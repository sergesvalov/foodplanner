from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)            # Цена за упаковку/единицу
    unit = Column(String)            # Единица измерения (кг, г, л, шт, упак)
    
    # --- НОВОЕ ПОЛЕ ---
    amount = Column(Float, default=1.0) # Номинальный вес или количество в упаковке
    # ------------------
    
    calories = Column(Float, default=0)

# ... Остальные классы (Recipe, RecipeIngredient, WeeklyPlanEntry) остаются БЕЗ ИЗМЕНЕНИЙ
class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    @property
    def total_cost(self):
        total = 0.0
        for item in self.ingredients:
            if item.product:
                total += item.quantity * item.product.price
        return round(total, 2)

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    recipe = relationship("Recipe", back_populates="ingredients")
    product = relationship("Product")

class WeeklyPlanEntry(Base):
    __tablename__ = "weekly_plan"
    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String)
    meal_type = Column(String)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    recipe = relationship("Recipe")