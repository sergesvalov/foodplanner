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
    
    if update_data.portions > 0:
        db_item.portions = update_data.portions
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