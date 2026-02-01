from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
import models
import schemas
from dependencies import get_db
import json
import os
from sqlalchemy import text


import random
from sqlalchemy import or_
import datetime

router = APIRouter(prefix="/plan", tags=["Weekly Plan"])

@router.get("/", response_model=List[schemas.PlanItemResponse])
def get_plan(db: Session = Depends(get_db)):
    return db.query(models.WeeklyPlanEntry).all()

@router.post("/", response_model=schemas.PlanItemResponse)
def add_to_plan(item: schemas.PlanItemCreate, db: Session = Depends(get_db)):
    db_item = models.WeeklyPlanEntry(
        day_of_week=item.day_of_week,
        meal_type=item.meal_type,
        recipe_id=item.recipe_id,
        portions=item.portions,
        family_member_id=item.family_member_id # <-- ВАЖНО
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.patch("/{item_id}", response_model=schemas.PlanItemResponse)
def update_plan_item(item_id: int, update_data: schemas.PlanItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Item not found")
    
    if update_data.portions is not None and update_data.portions > 0:
        db_item.portions = update_data.portions
        
    # Разрешаем сброс пользователя (если передадут None, это удалит привязку? 
    # В Pydantic Optional[int]=None значит поле необязательно. 
    # Но если мы хотим передать null, нужно быть аккуратнее.
    # Пока сделаем так: если поле присутствует в запросе (даже если None - хотя тут сложно отличить).
    # Упростим: если пришло значение, ставим.
    if update_data.family_member_id is not None:
        # -1 или 0 можно использовать как сброс, если нужно.
        # Или просто обновляем.
        db_item.family_member_id = update_data.family_member_id
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def remove_from_plan(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if not db_item: raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    return {"ok": True}

@router.get("/export")
def export_plan(db: Session = Depends(get_db)):
    plan_items = db.query(models.WeeklyPlanEntry).all()
    data = []
    for item in plan_items:
        data.append({
            "day_of_week": item.day_of_week,
            "meal_type": item.meal_type,
            "recipe_id": item.recipe_id,
            "portions": item.portions,
            "family_member_id": item.family_member_id
        })
    
    file_path = "weekly_plan.json"
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": "Plan saved successfully to weekly_plan.json"}

@router.post("/import")
def import_plan(db: Session = Depends(get_db)):
    file_path = "weekly_plan.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Saved plan file not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Clear existing plan
        db.query(models.WeeklyPlanEntry).delete()
        
        # Import new items
        for item in data:
            db_item = models.WeeklyPlanEntry(
                day_of_week=item["day_of_week"],
                meal_type=item["meal_type"],
                recipe_id=item["recipe_id"],
                portions=item.get("portions", 1),
                family_member_id=item.get("family_member_id")
            )
            db.add(db_item)
            
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": "Plan loaded successfully"}

@router.post("/autofill_one")
def autofill_one(req: schemas.AutoFillRequest = None, db: Session = Depends(get_db)):
    # 1. Determine time-based rules
    now = datetime.datetime.now()
    hour = now.hour
    
    target_meal = None
    allowed_categories = []
    
    if 0 <= hour < 10:
        target_meal = 'breakfast'
        allowed_categories = ['snack'] # User req: Only snacks
    elif 10 <= hour < 14:
        target_meal = 'lunch'
        allowed_categories = ['snack'] # User req: Only snacks
    elif 14 <= hour < 17:
        target_meal = 'afternoon_snack'
        allowed_categories = ['snack']
    elif 17 <= hour < 24:
        target_meal = 'dinner'
        allowed_categories = ['snack'] # User req: Only snacks
    else:
        # Fallback
        target_meal = 'late_snack'
        allowed_categories = ['snack']

    # 2. Find Candidates
    candidates = db.query(models.Recipe).filter(
        models.Recipe.category.in_(allowed_categories)
    ).all()
    
    if not candidates:
        raise HTTPException(status_code=400, detail=f"No recipes found for {target_meal} (categories: {allowed_categories})")

    # 3. Get current plan for TODAY
    days_map = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    target_day = days_map[now.weekday()]
    
    current_plan_items = db.query(models.WeeklyPlanEntry).filter(
        models.WeeklyPlanEntry.day_of_week == target_day,
        models.WeeklyPlanEntry.meal_type == target_meal
    ).all()
    
    # Check if slot is occupied for the requested user (or generally if no user logic was complex)
    # The requirement simplifies to: "adds food...". 
    # If we are adding for a specific user, check if THEY have food.
    # If we are adding for 'all', check if there is ANY food? Or just add another?
    # Context from previous turns: "In place where it adds, there should be no other food".
    
    # Let's verify if the specific slot is empty.
    # Logic: If I ask for User A, and User A has no food there -> Add.
    # If I selected 'All' (req is None or family_member_id is None) -> Check if *any* "All" entry exists?
    # To keep it simple and consistent with previous "Empty Slot":
    # If specific user: check if that user has an entry.
    # If generic: check if there is a generic entry (family_member_id is NULL).
    
    target_user_id = req.family_member_id if req else None
    
    is_occupied = False
    for item in current_plan_items:
        if item.family_member_id == target_user_id:
            is_occupied = True
            break
            
    if is_occupied:
         user_label = "вас" if target_user_id else "общий стол"
         raise HTTPException(status_code=400, detail=f"На {target_meal} ({target_day}) для {user_label} уже есть еда!")

    # 4. Pick Random Recipe
    target_recipe = random.choice(candidates)
    
    # 5. Create Entry
    new_item = models.WeeklyPlanEntry(
        day_of_week=target_day,
        meal_type=target_meal,
        recipe_id=target_recipe.id,
        portions=1,
        family_member_id=target_user_id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {
        "message": f"Added {target_recipe.title} to {target_meal}", 
        "day": target_day, 
        "meal": target_meal, 
        "recipe": target_recipe.title
    }
    db.commit()
    db.refresh(new_item)
    
    return {"message": "Added recipe", "day": target_slot[0], "meal": target_slot[1], "recipe": target_recipe.title}