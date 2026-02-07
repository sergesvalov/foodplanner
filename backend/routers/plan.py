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

@router.put("/{item_id}", response_model=schemas.PlanItemResponse)
@router.patch("/{item_id}", response_model=schemas.PlanItemResponse)
def update_plan_item(item_id: int, item_update: schemas.PlanItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    print(f"DEBUG: Updating item {item_id} with {item_update.dict()}")
    if item_update.portions is not None:
        db_item.portions = item_update.portions
    if item_update.family_member_id is not None:
        # allow setting to None
        db_item.family_member_id = item_update.family_member_id
    if item_update.date is not None:
        db_item.date = item_update.date
    if item_update.meal_type is not None:
        db_item.meal_type = item_update.meal_type
    if item_update.day_of_week is not None:
        db_item.day_of_week = item_update.day_of_week
        
    db.commit()
    db.refresh(db_item)
    print(f"DEBUG: Saved item {item_id} portions={db_item.portions}")
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

@router.post("/batch", response_model=List[schemas.PlanItemResponse])
def update_plan_batch(items: List[schemas.PlanItemCreate], db: Session = Depends(get_db)):
    if not items:
        return []

    # 1. Determine date range to clear
    # We assume the batch covers a specific range (e.g. a week)
    # Let's find min and max dates from the input
    dates = [item.date for item in items if item.date]
    
    if not dates:
        # Fallback if no dates provided (should not happen for this specific feature)
        raise HTTPException(status_code=400, detail="Dates required for batch update")

    min_date = min(dates)
    max_date = max(dates)

    # 2. Clear existing items in that range
    db.query(models.WeeklyPlanEntry).filter(
        models.WeeklyPlanEntry.date >= min_date,
        models.WeeklyPlanEntry.date <= max_date
    ).delete()
    
    # 3. Insert new items
    new_items = []
    for item in items:
        db_item = models.WeeklyPlanEntry(
            day_of_week=item.day_of_week,
            meal_type=item.meal_type,
            recipe_id=item.recipe_id,
            portions=item.portions,
            family_member_id=item.family_member_id,
            date=item.date
        )
        db.add(db_item)
        new_items.append(db_item)

    db.commit()
    
    # Refresh to return IDs
    for item in new_items:
        db.refresh(item)
        
    return new_items

from services.plan import autofill_week_logic, autofill_one_logic

@router.post("/autofill_one")
def autofill_one(req: schemas.AutoFillRequest = None, db: Session = Depends(get_db)):
    return autofill_one_logic(req, db)

@router.post("/autofill_week")
def autofill_week(db: Session = Depends(get_db)):
    return autofill_week_logic(db)

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