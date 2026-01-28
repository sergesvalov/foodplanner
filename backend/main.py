from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import SessionLocal, engine

# Создаем таблицы, если их нет (при первом запуске)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Weekly Menu Planner")

# Настройка CORS
# В Docker-среде фронтенд приходит через Nginx, но для локальной разработки
# или прямых запросов лучше оставить '*'
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Функция получения сессии БД (Dependency Injection)
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

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


# ===========================
# API РЕЦЕПТОВ
# ===========================

@app.get("/recipes/", response_model=List[schemas.RecipeResponse])
def read_recipes(db: Session = Depends(get_db)):
    # SQLAlchemy автоматически подтянет ингредиенты благодаря relationship
    return db.query(models.Recipe).all()

@app.post("/recipes/", response_model=schemas.RecipeResponse)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    # 1. Создаем сам рецепт
    db_recipe = models.Recipe(title=recipe.title, description=recipe.description)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)

    # 2. Добавляем ингредиенты (в цикле)
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


# ===========================
# API ПЛАНИРОВЩИКА (НЕДЕЛЬНОЕ МЕНЮ)
# ===========================

@app.get("/plan/", response_model=List[schemas.PlanItemResponse])
def get_plan(db: Session = Depends(get_db)):
    return db.query(models.WeeklyPlanEntry).all()

@app.post("/plan/", response_model=schemas.PlanItemResponse)
def add_to_plan(item: schemas.PlanItemCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли рецепт
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