import json
import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from dependencies import get_db

# Создаем роутер. Префикс позволяет не писать "/products" в каждом методе
router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

EXPORT_PATH = "/app/data/products.json"

@router.get("/", response_model=List[schemas.ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.name = product.name
    db_product.price = product.price
    db_product.unit = product.unit
    db_product.amount = product.amount
    db_product.calories = product.calories
    # Новые поля
    db_product.proteins = product.proteins
    db_product.fats = product.fats
    db_product.carbs = product.carbs
    db_product.weight_per_piece = product.weight_per_piece
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# --- Export / Import ---

@router.get("/export")
def export_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    data = [{
        "name": p.name,
        "price": p.price,
        "unit": p.unit,
        "amount": p.amount,
        "calories": p.calories,
        "proteins": p.proteins,
        "fats": p.fats,
        "carbs": p.carbs,
        "weight_per_piece": p.weight_per_piece
    } for p in products]
    
    try:
        with open(EXPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"message": f"Успешно сохранено {len(data)} товаров в {EXPORT_PATH}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка записи: {str(e)}")

@router.post("/import")
def import_products(db: Session = Depends(get_db)):
    if not os.path.exists(EXPORT_PATH):
        raise HTTPException(status_code=404, detail="Файл не найден")

    try:
        with open(EXPORT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка чтения: {str(e)}")

    created_count, updated_count = 0, 0
    
    for item in data:
        db_product = db.query(models.Product).filter(models.Product.name == item["name"]).first()
        params = {
            "price": float(item.get("price", 0)),
            "amount": float(item.get("amount", 1.0)),
            "unit": item.get("unit", "шт"),
            "calories": float(item.get("calories", 0)),
            "proteins": item.get("proteins"),
            "fats": item.get("fats"),
            "carbs": item.get("carbs"),
            "weight_per_piece": item.get("weight_per_piece")
        }


        if not db_product:
            new_product = models.Product(name=item["name"], **params)
            db.add(new_product)
            created_count += 1
        else:
            if (db_product.price != params["price"] or 
                db_product.amount != params["amount"] or
                db_product.unit != params["unit"] or
                db_product.calories != params["calories"]):
                
                db_product.price = params["price"]
                db_product.amount = params["amount"]
                db_product.unit = params["unit"]
                db_product.calories = params["calories"]
                db_product.proteins = params["proteins"]
                db_product.fats = params["fats"]
                db_product.carbs = params["carbs"]
                updated_count += 1

    db.commit()
    return {"message": "Импорт завершен", "created": created_count, "updated": updated_count}