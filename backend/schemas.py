from pydantic import BaseModel
from typing import List, Optional

# --- ПРОДУКТЫ ---
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

# --- ИНГРЕДИЕНТЫ ---
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

# --- РЕЦЕПТЫ ---
class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    portions: int = 1

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []

class RecipeResponse(RecipeBase):
    id: int
    ingredients: List[IngredientResponse] = []
    total_cost: float
    total_calories: float
    class Config:
        from_attributes = True

# --- ПЛАН ПИТАНИЯ ---
class PlanItemBase(BaseModel):
    day_of_week: str
    meal_type: str
    recipe_id: int
    portions: int = 1

class PlanItemCreate(PlanItemBase):
    pass

class PlanItemUpdate(BaseModel):
    portions: int

class PlanItemResponse(PlanItemBase):
    id: int
    recipe: Optional[RecipeResponse]
    class Config:
        from_attributes = True

# --- TELEGRAM ---
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

# --- ЧЛЕНЫ СЕМЬИ (НОВОЕ) ---
class FamilyMemberBase(BaseModel):
    name: str
    color: str 

class FamilyMemberCreate(FamilyMemberBase):
    pass

class FamilyMemberResponse(FamilyMemberBase):
    id: int
    class Config:
        from_attributes = True