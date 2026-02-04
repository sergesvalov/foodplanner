import json
import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
from pydantic import BaseModel
import models
import schemas
from dependencies import get_db

router = APIRouter(
    prefix="/recipes",
    tags=["Recipes"]
)

EXPORT_PATH = "/app/data/recipes.json"

@router.get("/", response_model=List[schemas.RecipeResponse])
def read_recipes(db: Session = Depends(get_db)):
    return db.query(models.Recipe).all()

@router.post("/", response_model=schemas.RecipeResponse)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = models.Recipe(
        title=recipe.title, 
        description=recipe.description,
        portions=recipe.portions,
        category=recipe.category, # <-- Сохраняем категорию
        rating=recipe.rating # <-- Сохраняем рейтинг
    )
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    
    for item in recipe.ingredients:
        db_ingredient = models.RecipeIngredient(
            recipe_id=db_recipe.id, product_id=item.product_id, quantity=item.quantity
        )
        db.add(db_ingredient)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@router.put("/{recipe_id}", response_model=schemas.RecipeResponse)
def update_recipe(recipe_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db_recipe.title = recipe.title
    db_recipe.description = recipe.description
    db_recipe.portions = recipe.portions
    db_recipe.category = recipe.category # <-- Обновляем категорию
    db_recipe.rating = recipe.rating # <-- Обновляем рейтинг
    
    db.query(models.RecipeIngredient).filter(models.RecipeIngredient.recipe_id == recipe_id).delete()
    for item in recipe.ingredients:
        db_ingredient = models.RecipeIngredient(
            recipe_id=db_recipe.id, product_id=item.product_id, quantity=item.quantity
        )
        db.add(db_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(db_recipe)
    db.commit()
    return {"ok": True}

# --- Export / Import ---

@router.get("/export")
def export_recipes(db: Session = Depends(get_db)):
    recipes = db.query(models.Recipe).all()
    # Добавляем category в экспорт
    data = [{
        "title": r.title, 
        "description": r.description,
        "portions": r.portions,
        "category": r.category,
        "rating": r.rating 
    } for r in recipes]
    try:
        with open(EXPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"message": f"Сохранено {len(data)} рецептов"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
def import_recipes(db: Session = Depends(get_db)):
    if not os.path.exists(EXPORT_PATH):
        raise HTTPException(status_code=404, detail="Файл не найден")
    try:
        with open(EXPORT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    created, updated = 0, 0
    for item in data:
        title = item.get("title")
        description = item.get("description", "")
        portions = item.get("portions", 1)
        category = item.get("category", "other") # Читаем категорию
        
        if not title: continue
        
        db_recipe = db.query(models.Recipe).filter(models.Recipe.title == title).first()
        if not db_recipe:
            new_recipe = models.Recipe(
                title=title, 
                description=description, 
                portions=portions,
                category=category,
                rating=item.get("rating", 0)
            )
            db.add(new_recipe)
            created += 1
        else:
            updated_flag = False
            if db_recipe.description != description:
                db_recipe.description = description
                updated_flag = True
            if db_recipe.portions != portions:
                db_recipe.portions = portions
                updated_flag = True
            if db_recipe.category != category:
                db_recipe.category = category
                updated_flag = True
            
            rating = item.get("rating", 0)
            if db_recipe.rating != rating:
                db_recipe.rating = rating
                updated_flag = True
            
            if updated_flag:
                updated += 1

    db.commit()
    return {"message": "Импорт завершен", "created": created, "updated": updated}

# --- Telegram Send ---

class TelegramSendRequest(BaseModel):
    chat_id: str

from services.telegram import send_telegram_message

@router.post("/{recipe_id}/send")
def send_recipe_telegram(recipe_id: int, body: TelegramSendRequest, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")

    # Формирование сообщения
    lines = [
        f"🍳 *{db_recipe.title}*",
        f"_{db_recipe.description or 'Без описания'}_",
        "",
        f"📊 *КБЖУ (на 100г):* {db_recipe.calories_per_100g} ккал",
        f"💰 *Цена:* €{db_recipe.total_cost:.2f}",
        "",
        "*Ингредиенты:*",
    ]
    
    for ing in db_recipe.ingredients:
        if ing.product:
            lines.append(f"— {ing.product.name}: {ing.quantity} {ing.product.unit}")
            
    message_text = "\n".join(lines)
    
    send_telegram_message(db, body.chat_id, message_text)

    return {"status": "ok", "message": "Рецепт отправлен"}
