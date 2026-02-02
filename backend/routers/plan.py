import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
import models
import schemas
from dependencies import get_db
import json
import os
import random

router = APIRouter(prefix="/plan", tags=["Weekly Plan"])

EXPORT_PATH = "/app/data/plan.json"

# --- Хелпер для дат ---
def get_date_for_day_of_week(day_name: str) -> datetime.date:
    """Возвращает дату для указанного дня недели в рамках текущей недели"""
    days_map = {
        'Понедельник': 0, 'Вторник': 1, 'Среда': 2, 'Четверг': 3,
        'Пятница': 4, 'Суббота': 5, 'Воскресенье': 6
    }
    target_weekday = days_map.get(day_name)
    if target_weekday is None:
        return datetime.date.today() # Фолбек на сегодня
    
    today = datetime.date.today()
    current_weekday = today.weekday() # 0 = Пн
    
    # Понедельник текущей недели
    monday_of_week = today - datetime.timedelta(days=current_weekday)
    
    # Целевая дата
    return monday_of_week + datetime.timedelta(days=target_weekday)
# ----------------------

@router.get("/", response_model=List[schemas.PlanItemResponse])
def get_plan(
    start_date: datetime.date = None, 
    end_date: datetime.date = None, 
    db: Session = Depends(get_db)
):
    q = db.query(models.WeeklyPlanEntry)
    
    if start_date:
        q = q.filter(models.WeeklyPlanEntry.date >= start_date)
    if end_date:
        q = q.filter(models.WeeklyPlanEntry.date <= end_date)
        
    return q.order_by(models.WeeklyPlanEntry.date.asc(), models.WeeklyPlanEntry.id.asc()).all()

@router.post("/", response_model=schemas.PlanItemResponse)
def add_to_plan(item: schemas.PlanItemCreate, db: Session = Depends(get_db)):
    # Если дата не передана с фронта, вычисляем её
    calculated_date = item.date
    if not calculated_date:
        calculated_date = get_date_for_day_of_week(item.day_of_week)

    db_item = models.WeeklyPlanEntry(
        day_of_week=item.day_of_week,
        meal_type=item.meal_type,
        recipe_id=item.recipe_id,
        portions=item.portions,
        family_member_id=item.family_member_id,
        date=calculated_date
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.patch("/{item_id}", response_model=schemas.PlanItemResponse)
def update_plan_item(item_id: int, item_update: schemas.PlanItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item_update.portions is not None:
        db_item.portions = item_update.portions
    if item_update.family_member_id is not None:
        # allow setting to None
        db_item.family_member_id = item_update.family_member_id
    if item_update.date is not None:
        db_item.date = item_update.date
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def remove_from_plan(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"ok": True}

@router.delete("/")
def clear_plan(db: Session = Depends(get_db)):
    db.query(models.WeeklyPlanEntry).delete()
    db.commit()
    return {"ok": True}

@router.post("/autofill_one")
def autofill_one(req: schemas.AutoFillRequest = None, db: Session = Depends(get_db)):
    now = datetime.datetime.now()
    hour = now.hour
    
    target_meal = 'snack'
    # Простая логика времени (можно усложнить)
    if 0 <= hour < 10: target_meal = 'breakfast'
    elif 10 <= hour < 14: target_meal = 'lunch'
    elif 14 <= hour < 17: target_meal = 'afternoon_snack'
    elif 17 <= hour < 24: target_meal = 'dinner'
    else: target_meal = 'late_snack'

    allowed_categories = ['snack']
    if target_meal == 'breakfast': allowed_categories = ['breakfast', 'snack']
    elif target_meal == 'lunch': allowed_categories = ['soup', 'main', 'salad']
    elif target_meal == 'dinner': allowed_categories = ['main', 'salad', 'snack']
    
    candidates = db.query(models.Recipe).filter(
        models.Recipe.category.in_(allowed_categories)
    ).all()
    
    if not candidates:
        raise HTTPException(status_code=400, detail="No recipes found for this time")

    days_map = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    target_day = days_map[now.weekday()]
    
    # Проверяем, есть ли уже что-то в этот слот для этого человека
    q = db.query(models.WeeklyPlanEntry).filter(
        models.WeeklyPlanEntry.day_of_week == target_day,
        models.WeeklyPlanEntry.meal_type == target_meal,
        models.WeeklyPlanEntry.date == datetime.date.today() # <--- Строгая привязка к дате
    )
    if req and req.family_member_id:
        q = q.filter(models.WeeklyPlanEntry.family_member_id == req.family_member_id)
    
    if q.first():
         raise HTTPException(status_code=400, detail="Slot already occupied")

    target_recipe = random.choice(candidates)
    
    new_item = models.WeeklyPlanEntry(
        day_of_week=target_day,
        meal_type=target_meal,
        recipe_id=target_recipe.id,
        portions=1,
        family_member_id=req.family_member_id if req else None,
        date=datetime.date.today() 
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {
        "message": f"Added {target_recipe.title}", 
        "day": target_day, 
        "meal": target_meal, 
        "recipe": target_recipe.title
    }

@router.post("/autofill_week")
def autofill_week(db: Session = Depends(get_db)):
    # 0. Получаем пользователей
    family_members = db.query(models.FamilyMember).all()
    # Если пользователей нет, будем создавать записи без family_member_id (как для одного generic едока)
    if not family_members:
        family_members = [None]

    # 1. Определяем даты следующей недели
    today = datetime.date.today()
    current_weekday = today.weekday() # 0 = Пн
    days_until_next_monday = 7 - current_weekday
    next_monday = today + datetime.timedelta(days=days_until_next_monday)
    
    days_map = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    target_meals = ['lunch', 'dinner'] # Только обед и ужин
    
    # Рецепты (суп или второе)
    candidates = db.query(models.Recipe).options(
        joinedload(models.Recipe.ingredients).joinedload(models.RecipeIngredient.product)
    ).filter(
        models.Recipe.category.in_(['soup', 'main'])
    ).all()
    
    if not candidates:
        raise HTTPException(status_code=400, detail="No recipes found (need soup or main)")

    count = 0
    current_recipe = None
    portions_left = 0
    last_recipe_id = None

    # Track daily calories: {(date_str, member_id): current_calories}
    daily_calories = {}
    
    # Генерируем хронологический список слотов на неделю
    slots = []
    for i in range(7):
        target_date = next_monday + datetime.timedelta(days=i)
        target_day_name = days_map[i]
        for meal in target_meals:
            slots.append({
                "date": target_date,
                "day": target_day_name,
                "meal": meal
            })

    # Идем по слотам
    for slot in slots:
        # 3. Проверяем "кастрюлю" В НАЧАЛЕ приема пищи
        # Если еды совсем нет - готовим новое. 
        # (Если есть хоть 1 порция - доедаем её, остальные останутся голодными в этот слот)
        if portions_left <= 0:
            # Filter out the last recipe to avoid repeats
            valid_candidates = [r for r in candidates if r.id != last_recipe_id]
            if not valid_candidates:
                valid_candidates = candidates
            
            current_recipe = random.choice(valid_candidates)
            last_recipe_id = current_recipe.id
            
            portions_left = current_recipe.portions
            if portions_left < 1: portions_left = 1

        # Для каждого члена семьи
        for member in family_members:
            member_id = member.id if member else None
            
            # Проверяем занят ли слот
            q = db.query(models.WeeklyPlanEntry).filter(
                models.WeeklyPlanEntry.date == slot["date"],
                models.WeeklyPlanEntry.meal_type == slot["meal"]
            )
            if member_id:
                q = q.filter(models.WeeklyPlanEntry.family_member_id == member_id)
            else:
                q = q.filter(models.WeeklyPlanEntry.family_member_id == None)
                
            exists = q.first()
            if exists:
                continue
            
            # 4. Если порции есть - накладываем. Если нет - пропускаем (не готовим новое сразу)
            if portions_left > 0:
                # Calculate new calories
                recipe_cals = current_recipe.calories_per_portion
                
                # Check calorie limit
                limit = member.max_calories if member else 2000
                date_str = slot["date"].isoformat()
                current_daily_cals = daily_calories.get((date_str, member_id), 0)
                
                # Logic: If we are already near limit (e.g. max - 200), do not add more.
                if current_daily_cals >= (limit - 200):
                     # Skip this member for this meal
                     continue

                new_item = models.WeeklyPlanEntry(
                    day_of_week=slot["day"],
                    meal_type=slot["meal"],
                    recipe_id=current_recipe.id,
                    portions=1,  # Всегда 1 порция на человека
                    family_member_id=member_id,
                    date=slot["date"]
                )
                db.add(new_item)
                count += 1
                
                # Update stats
                daily_calories[(date_str, member_id)] = current_daily_cals + recipe_cals
                portions_left -= 1
            else:
                # Порции кончились прямо сейчас. 
                # Ничего не добавляем этому пользователю.
                # Следующее блюдо будет приготовлено только в начале СЛЕДУЮЩЕГО слота (цикла for slot).
                pass

    db.commit()
    msg = f"Planned {count} items for next week for {len(family_members)} people."
    return {"message": msg}

@router.get("/export")
def export_plan(db: Session = Depends(get_db)):
    # Экспортируем только ТЕКУЩУЮ неделю, чтобы это работало как шаблон
    today = datetime.date.today()
    current_weekday = today.weekday()
    start_of_week = today - datetime.timedelta(days=current_weekday)
    end_of_week = start_of_week + datetime.timedelta(days=6)

    plan = db.query(models.WeeklyPlanEntry).filter(
        models.WeeklyPlanEntry.date >= start_of_week,
        models.WeeklyPlanEntry.date <= end_of_week
    ).all()

    data = []
    for item in plan:
        data.append({
            "day": item.day_of_week,
            "meal": item.meal_type,
            "recipe_id": item.recipe_id,
            "portions": item.portions,
            "family_member_id": item.family_member_id,
            # Экспортируем без даты или с датой - неважно, импорт пересчитает
            "date": item.date.isoformat() if item.date else None 
        })
    try:
        with open(EXPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"message": f"Saved {len(data)} items from current week"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
def import_plan(db: Session = Depends(get_db)):
    if not os.path.exists(EXPORT_PATH):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(EXPORT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

    # Очищаем только ТЕКУЩУЮ неделю перед импортом
    today = datetime.date.today()
    current_weekday = today.weekday()
    start_of_week = today - datetime.timedelta(days=current_weekday)
    end_of_week = start_of_week + datetime.timedelta(days=6)

    db.query(models.WeeklyPlanEntry).filter(
        models.WeeklyPlanEntry.date >= start_of_week,
        models.WeeklyPlanEntry.date <= end_of_week
    ).delete()
    
    count = 0
    for item in data:
        # Пересчитываем дату на текущую неделю на основе дня недели
        day_name = item.get("day")
        target_date = get_date_for_day_of_week(day_name)
        
        new_entry = models.WeeklyPlanEntry(
            day_of_week=day_name,
            meal_type=item.get("meal"),
            recipe_id=item.get("recipe_id"),
            portions=item.get("portions", 1),
            family_member_id=item.get("family_member_id"),
            date=target_date
        )
        db.add(new_entry)
        count += 1
    
    db.commit()
    return {"message": f"Imported {count} items into current week"}