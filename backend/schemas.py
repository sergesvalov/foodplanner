from pydantic import BaseModel, Field # <-- Добавь импорт Field
from typing import List, Optional

# --- ПРОДУКТЫ ---
class ProductBase(BaseModel):
    name: str
    
    # Цена: больше или равно 0
    price: float = Field(..., ge=0)
    
    unit: str
    
    # Вес/Количество: строго больше 0 (не может быть 0 кг)
    amount: float = Field(1.0, gt=0)
    
    # Калории: больше или равно 0
    calories: Optional[float] = Field(0, ge=0)

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

# --- ИНГРЕДИЕНТЫ ---
class IngredientBase(BaseModel):
    product_id: int
    # Количество в рецепте: строго больше 0
    quantity: float = Field(..., gt=0)

class IngredientResponse(IngredientBase):
    id: int
    product: ProductResponse
    quantity: float
    class Config:
        from_attributes = True

# ... Остальные схемы (RecipeCreate, RecipeResponse и т.д.) без изменений ...
class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: List[IngredientBase]

class RecipeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    ingredients: List[IngredientResponse] = []
    total_cost: float 
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