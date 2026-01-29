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
    recipe = db.query(models.Recipe).filter(models.Recipe.id == item.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db_item = models.WeeklyPlanEntry(
        day_of_week=item.day_of_week, meal_type=item.meal_type, recipe_id=item.recipe_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_from_plan(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}