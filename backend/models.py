from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# --- Таблица Продуктов ---
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)       # Название (Яйца)
    price = Column(Float)                   # Цена (2.50)
    unit = Column(String, default="шт")     # Ед. измерения (шт, кг, л)


# --- Таблица Рецептов ---
class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)      # Название блюда
    description = Column(Text)              # Инструкция
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связь с ингредиентами. cascade="all, delete" удалит ингредиенты, если удалить рецепт
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")


# --- Таблица Ингредиентов (Связка Рецепт <-> Продукт) ---
class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)

    recipe = relationship("Recipe", back_populates="ingredients")
    product = relationship("Product") # Для доступа к названию продукта


# --- Таблица Планировщика (Сетка на неделю) ---
class WeeklyPlanEntry(Base):
    __tablename__ = "weekly_plan"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String)  # 'Понедельник', 'Вторник'...
    meal_type = Column(String)    # 'breakfast', 'lunch', 'dinner', 'snack'
    recipe_id = Column(Integer, ForeignKey("recipes.id"))

    # Чтобы при запросе плана сразу видеть название рецепта
    recipe = relationship("Recipe")