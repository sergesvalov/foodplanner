from pydantic import BaseModel
from typing import List, Optional

# --- Продукты ---
class ProductBase(BaseModel):
    name: str
    price: float
    unit: str
    amount: float
    calories: float = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

# --- Ингредиенты ---
class IngredientBase(BaseModel):
    product_id: int
    quantity: float

class IngredientCreate(IngredientBase):
    pass

class IngredientResponse(BaseModel):
    id: int
    product: Optional[ProductResponse]
    quantity: float
    class Config:
        from_attributes = True

# --- Рецепты ---
class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    portions: int = 1 # НОВОЕ ПОЛЕ

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []

class RecipeResponse(RecipeBase):
    id: int
    ingredients: List[IngredientResponse] = []
    total_cost: float
    total_calories: float
    class Config:
        from_attributes = True

# --- План ---
class PlanItemBase(BaseModel):
    day_of_week: str
    meal_type: str
    recipe_id: int
    portions: int = 1 # НОВОЕ ПОЛЕ

class PlanItemCreate(PlanItemBase):
    pass

# Схема для обновления (PATCH)
class PlanItemUpdate(BaseModel):
    portions: int

class PlanItemResponse(PlanItemBase):
    id: int
    recipe: Optional[RecipeResponse]
    class Config:
        from_attributes = True

# --- Telegram ---
class TelegramUserBase(BaseModel):
    name: str
    chat_id: str

class TelegramUserCreate(TelegramUserBase):
    pass

class TelegramUserResponse(TelegramUserBase):
    id: int
    class Config:
        from_attributes = True

class TokenUpdate(BaseModel):
    token: str