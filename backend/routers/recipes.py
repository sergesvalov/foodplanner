from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import schemas
from dependencies import get_db
from services.recipe_service import RecipeService

router = APIRouter(
    prefix="/recipes",
    tags=["Recipes"]
)

@router.get("/", response_model=List[schemas.RecipeResponse])
def read_recipes(db: Session = Depends(get_db)):
    return RecipeService.get_recipes(db)

@router.post("/", response_model=schemas.RecipeResponse)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    return RecipeService.create_recipe(db, recipe)

@router.put("/{recipe_id}", response_model=schemas.RecipeResponse)
def update_recipe(recipe_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    return RecipeService.update_recipe(db, recipe_id, recipe)

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    return RecipeService.delete_recipe(db, recipe_id)

@router.get("/export")
def export_recipes(db: Session = Depends(get_db)):
    return RecipeService.export_recipes(db)

@router.post("/import")
def import_recipes(db: Session = Depends(get_db)):
    return RecipeService.import_recipes(db)

# --- Telegram Send ---

class TelegramSendRequest(BaseModel):
    chat_id: str

@router.post("/{recipe_id}/send")
def send_recipe_telegram(recipe_id: int, body: TelegramSendRequest, db: Session = Depends(get_db)):
    return RecipeService.send_telegram(db, recipe_id, body.chat_id)
