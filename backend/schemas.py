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

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []

class RecipeResponse(RecipeBase):
    id: int
    ingredients: List[IngredientResponse] = []
    total_cost: float
    total_calories: float  # Новое поле
    
    class Config:
        from_attributes = True

# --- План ---
class PlanItemBase(BaseModel):
    day_of_week: str
    meal_type: str
    recipe_id: int

class PlanItemCreate(PlanItemBase):
    pass

class PlanItemResponse(PlanItemBase):
    id: int
    recipe: Optional[RecipeResponse]
    class Config:
        from_attributes = True