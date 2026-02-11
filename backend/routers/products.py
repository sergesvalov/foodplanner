from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import schemas
from dependencies import get_db
from services.product_service import ProductService

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.get("/", response_model=List[schemas.ProductResponse])
def read_products(name: str = None, db: Session = Depends(get_db)):
    return ProductService.get_products(db, name)

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return ProductService.create_product(db, product)

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    return ProductService.get_product_by_id(db, product_id)

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return ProductService.update_product(db, product_id, product)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return ProductService.delete_product(db, product_id)

@router.get("/export")
def export_products(db: Session = Depends(get_db)):
    return ProductService.export_products(db)

@router.post("/import")
def import_products(db: Session = Depends(get_db)):
    return ProductService.import_products(db)