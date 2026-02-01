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
def autofill_one(db: Session = Depends(get_db)):
    # 1. Find candidates (Soup or Main)
    # categories: 'soup' (Первое), 'main' (Второе)
    candidates = db.query(models.Recipe).filter(
        or_(models.Recipe.category == 'soup', models.Recipe.category == 'main')
    ).all()
    
    if not candidates:
        raise HTTPException(status_code=400, detail="No recipes found in categories 'soup' or 'main'")

    # 2. Get current plan
    current_plan = db.query(models.WeeklyPlanEntry).all()
    
    # 3. Define all slots: Days x Meals (lunch, dinner)
    days_map = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    
    # Ограничиваемся ТОЛЬКО СЕГОДНЯШНИМ ДНЕМ
    today_index = datetime.datetime.now().weekday()
    target_day = days_map[today_index]
    
    meals = ['lunch', 'dinner']
    
    occupied_slots = set()
    for item in current_plan:
        if item.meal_type in meals and item.day_of_week == target_day:
            occupied_slots.add((item.day_of_week, item.meal_type))
            
    # 4. Find empty slots (Only for Today)
    empty_slots = []
    for m in meals:
        if (target_day, m) not in occupied_slots:
            empty_slots.append((target_day, m))
                
    if not empty_slots:
        raise HTTPException(status_code=400, detail=f"На сегодня ({target_day}) уже все запланировано!")
        
    # 5. Pick randoms
    target_slot = random.choice(empty_slots)
    target_recipe = random.choice(candidates)
    
    # 6. Create entry
    new_item = models.WeeklyPlanEntry(
        day_of_week=target_slot[0],
        meal_type=target_slot[1],
        recipe_id=target_recipe.id,
        portions=1
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {"message": "Added recipe", "day": target_slot[0], "meal": target_slot[1], "recipe": target_recipe.title}