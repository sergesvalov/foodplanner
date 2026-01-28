from pydantic import BaseModel
from typing import List, Optional

# --- ПРОДУКТЫ ---
class ProductBase(BaseModel):
    name: str
    price: float
    unit: str        # 'шт', 'кг' и т.д.
    calories: Optional[float] = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

# ... (Остальные схемы IngredientBase, RecipeCreate и т.д. оставляем без изменений)
class IngredientBase(BaseModel):
    product_id: int
    quantity: float

class IngredientResponse(IngredientBase):
    id: int
    product: ProductResponse 
    class Config:
        from_attributes = True

class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[IngredientBase]

class RecipeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    ingredients: List[IngredientResponse] = []
    class Config:
        from_attributes = True

class PlanItemCreate(BaseModel):
    day_of_week: str
    meal_type: str
    recipe_id: int

class PlanItemResponse(PlanItemCreate):
    id: int
    recipe: RecipeResponse
    class Config:
        from_attributes = True