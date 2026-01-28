from pydantic import BaseModel
from typing import List, Optional

# --- Схемы для ПРОДУКТОВ ---
class ProductBase(BaseModel):
    name: str
    price: float
    unit: str = "шт"

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True


# --- Схемы для ИНГРЕДИЕНТОВ ---
class IngredientBase(BaseModel):
    product_id: int
    quantity: float

class IngredientResponse(IngredientBase):
    id: int
    product: ProductResponse # Вкладываем полные данные о продукте (название, цена)
    
    class Config:
        from_attributes = True


# --- Схемы для РЕЦЕПТОВ ---
class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[IngredientBase] # Список {product_id, quantity}

class RecipeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    ingredients: List[IngredientResponse] = [] # Возвращаем полный состав

    class Config:
        from_attributes = True


# --- Схемы для ПЛАНИРОВЩИКА ---
class PlanItemCreate(BaseModel):
    day_of_week: str
    meal_type: str
    recipe_id: int

class PlanItemResponse(PlanItemCreate):
    id: int
    recipe: RecipeResponse # Вкладываем данные о рецепте

    class Config:
        from_attributes = True