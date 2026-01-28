from pydantic import BaseModel
from typing import List, Optional

# --- ПРОДУКТЫ ---
class ProductBase(BaseModel):
    name: str
    price: float
    unit: str
    calories: Optional[float] = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

# --- ИНГРЕДИЕНТЫ ---
class IngredientBase(BaseModel):
    product_id: int
    quantity: float

class IngredientResponse(IngredientBase):
    id: int
    product: ProductResponse
    quantity: float
    class Config:
        from_attributes = True

# --- РЕЦЕПТЫ ---
class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[IngredientBase]

class RecipeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    ingredients: List[IngredientResponse] = []
    
    # --- НОВОЕ: Поле для цены ---
    total_cost: float 

    class Config:
        from_attributes = True

# --- ПЛАН ---
class PlanItemCreate(BaseModel):
    day_of_week: str
    meal_type: str
    recipe_id: int

class PlanItemResponse(PlanItemCreate):
    id: int
    recipe: RecipeResponse
    class Config:
        from_attributes = True