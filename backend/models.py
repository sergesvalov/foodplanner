import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float, default=0.0)
    unit = Column(String, default="шт")
    # Вес упаковки (например, 1000 для кг, 10 для десятка яиц)
    amount = Column(Float, default=1.0)
    # Калории на всю упаковку/единицу
    calories = Column(Float, default=0.0)

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

    @property
    def total_cost(self):
        """Считает стоимость рецепта"""
        total = 0.0
        for item in self.ingredients:
            if item.product:
                # Защита от деления на ноль
                pack_amount = item.product.amount if item.product.amount > 0 else 1.0
                price_per_unit = item.product.price / pack_amount
                total += item.quantity * price_per_unit
        return round(total, 2)

    @property
    def total_calories(self):
        """Считает калории рецепта"""
        total = 0.0
        for item in self.ingredients:
            if item.product:
                pack_amount = item.product.amount if item.product.amount > 0 else 1.0
                # Калории на единицу веса
                cals_per_unit = item.product.calories / pack_amount
                # Умножаем на количество в рецепте
                total += item.quantity * cals_per_unit
        return round(total)

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