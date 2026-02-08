import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import schemas
from dependencies import get_db
from services.plan_service import PlanService

router = APIRouter(prefix="/plan", tags=["Weekly Plan"])

@router.get("/", response_model=List[schemas.PlanItemResponse])
def get_plan(
    start_date: datetime.date = None, 
    end_date: datetime.date = None, 
    db: Session = Depends(get_db)
):
    return PlanService.get_plan(db, start_date, end_date)

@router.post("/", response_model=schemas.PlanItemResponse)
def add_to_plan(item: schemas.PlanItemCreate, db: Session = Depends(get_db)):
    return PlanService.add_to_plan(db, item)

@router.put("/{item_id}", response_model=schemas.PlanItemResponse)
@router.patch("/{item_id}", response_model=schemas.PlanItemResponse)
def update_plan_item(item_id: int, item_update: schemas.PlanItemUpdate, db: Session = Depends(get_db)):
    return PlanService.update_plan_item(db, item_id, item_update)

@router.delete("/{item_id}")
def remove_from_plan(item_id: int, db: Session = Depends(get_db)):
    return PlanService.remove_from_plan(db, item_id)

@router.delete("/")
def clear_plan(
    start_date: datetime.date = None,
    end_date: datetime.date = None,
    db: Session = Depends(get_db)
):
    return PlanService.clear_plan(db, start_date, end_date)

@router.post("/batch", response_model=List[schemas.PlanItemResponse])
def update_plan_batch(items: List[schemas.PlanItemCreate], db: Session = Depends(get_db)):
    return PlanService.batch_update(db, items)

@router.post("/autofill_one")
def autofill_one(req: schemas.AutoFillRequest = None, db: Session = Depends(get_db)):
    return PlanService.autofill_one(db, req)

@router.post("/autofill_week")
def autofill_week(db: Session = Depends(get_db)):
    return PlanService.autofill_week(db)

@router.get("/export")
def export_plan(db: Session = Depends(get_db)):
    return PlanService.export_plan(db)

@router.post("/import")
def import_plan(db: Session = Depends(get_db)):
    return PlanService.import_plan(db)