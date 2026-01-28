from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    unit = Column(String)
    amount = Column(Float, default=1.0) # Вес/Кол-во упаковки
    calories = Column(Float, default=0)

class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

    # --- ИЗМЕНЕННАЯ ЛОГИКА ---
    @property
    def total_cost(self):
        """
        Считает стоимость: (Цена товара / Вес товара) * Количество в рецепте
        """
        total = 0.0
        for item in self.ingredients:
            if item.product:
                # Берем вес упаковки (защита от 0)
                pack_amount = item.product.amount if item.product.amount > 0 else 1.0
                
                # Цена за 1 ед (гр/шт)
                price_per_unit = item.product.price / pack_amount
                
                # Итог
                total += item.quantity * price_per_unit
                
        return round(total, 2)
    # -------------------------

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