import json
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import SessionLocal, engine

# Создаем таблицы
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Menu Planner API")

# Путь к файлу для экспорта/импорта (внутри контейнера)
# Docker volume монтирует /opt/foodplanner в /app/data
EXPORT_FILE_PATH = "/app/data/products.json"

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===========================
# API ПРОДУКТОВ
# ===========================

@app.get("/products/", response_model=List[schemas.ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.post("/products/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.name = product.name
    db_product.price = product.price
    db_product.unit = product.unit
    db_product.amount = product.amount
    db_product.calories = product.calories
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# --- ЭКСПОРТ И ИМПОРТ ---

@app.get("/products/export")
def export_products(db: Session = Depends(get_db)):
    """Сохранить каталог в JSON файл рядом с БД"""
    products = db.query(models.Product).all()
    
    data = []
    for p in products:
        data.append({
            "name": p.name,
            "price": p.price,
            "unit": p.unit,
            "amount": p.amount,
            "calories": p.calories
        })
    
    try:
        with open(EXPORT_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"message": f"Каталог сохранен: {len(data)} товаров в {EXPORT_FILE_PATH}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.post("/products/import")
def import_products(db: Session = Depends(get_db)):
    """Загрузить каталог из JSON файла (Update/Create)"""
    if not os.path.exists(EXPORT_FILE_PATH):
        raise HTTPException(status_code=404, detail="Файл products.json не найден на сервере")

    try:
        with open(EXPORT_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка чтения файла: {str(e)}")

    created_count = 0
    updated_count = 0
    
    for item in data:
        # Ищем продукт по имени
        db_product = db.query(models.Product).filter(models.Product.name == item["name"]).first()
        
        # Данные из файла
        file_price = item.get("price", 0)
        file_amount = item.get("amount", 1.0)
        file_unit = item.get("unit", "шт")
        file_cals = item.get("calories", 0)

        if not db_product:
            # Если товара нет — создаем
            new_product = models.Product(
                name=item["name"],
                price=file_price,
                unit=file_unit,
                amount=file_amount,
                calories=file_cals
            )
            db.add(new_product)
            created_count += 1
        else:
            # Если товар есть — проверяем отличия
            # Если цена, вес или единица отличаются — обновляем. Иначе не трогаем.
            if (db_product.price != file_price or 
                db_product.amount != file_amount or
                db_product.unit != file_unit or
                db_product.calories != file_cals):
                
                db_product.price = file_price
                db_product.amount = file_amount
                db_product.unit = file_unit
                db_product.calories = file_cals
                updated_count += 1

    db.commit()
    return {
        "message": "Импорт завершен",
        "created": created_count,
        "updated": updated_count,
        "total_in_file": len(data)
    }

# ===========================
# API РЕЦЕПТОВ
# ===========================

@app.get("/recipes/", response_model=List[schemas.RecipeResponse])
def read_recipes(db: Session = Depends(get_db)):
    return db.query(models.Recipe).all()

@app.post("/recipes/", response_model=schemas.RecipeResponse)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = models.Recipe(title=recipe.title, description=recipe.description)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)

    for item in recipe.ingredients:
        db_ingredient = models.RecipeIngredient(
            recipe_id=db_recipe.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(db_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.put("/recipes/{recipe_id}", response_model=schemas.RecipeResponse)
def update_recipe(recipe_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db_recipe.title = recipe.title
    db_recipe.description = recipe.description

    db.query(models.RecipeIngredient).filter(models.RecipeIngredient.recipe_id == recipe_id).delete()
    
    for item in recipe.ingredients:
        db_ingredient = models.RecipeIngredient(
            recipe_id=db_recipe.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(db_ingredient)

    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    db.delete(db_recipe)
    db.commit()
    return {"ok": True}

# ===========================
# API ПЛАНИРОВЩИКА
# ===========================

@app.get("/plan/", response_model=List[schemas.PlanItemResponse])
def get_plan(db: Session = Depends(get_db)):
    return db.query(models.WeeklyPlanEntry).all()

@app.post("/plan/", response_model=schemas.PlanItemResponse)
def add_to_plan(item: schemas.PlanItemCreate, db: Session = Depends(get_db)):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == item.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db_item = models.WeeklyPlanEntry(
        day_of_week=item.day_of_week,
        meal_type=item.meal_type,
        recipe_id=item.recipe_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/plan/{item_id}")
def delete_from_plan(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.WeeklyPlanEntry).filter(models.WeeklyPlanEntry.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True}