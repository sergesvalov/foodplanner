from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from dependencies import get_db

router = APIRouter(
    prefix="/plan",
    tags=["Weekly Plan"]
)

@router.get("/", response_model=List[schemas.PlanItemResponse])
def get_plan(db: Session = Depends(get_db)):
    return db.query(models.WeeklyPlanEntry).all()

@router.post("/", response_model=schemas.PlanItemResponse)
def add_to_plan(item: schemas.PlanItemCreate, db: Session = Depends(get_db)):
    db_item = models.WeeklyPlanEntry(
        day_of_week=item.day_of_week,
        meal_type=item.meal_type,
        recipe_id=item.recipe_id,
        portions=item.portions # Сохраняем порции
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.patch("/{item_id}", response_model=schemas.PlanItemResponse)
def update_plan_item(item_id: int, update_data: schemas.PlanItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Plan item not found")
    
    if update_data.portions > 0:
        db_item.portions = update_data.portions
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