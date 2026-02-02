import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float, default=0.0)
    unit = Column(String, default="шт")
    amount = Column(Float, default=1.0)
    calories = Column(Float, default=0.0)
    
    # Новые поля
    proteins = Column(Float, nullable=True, default=None)
    fats = Column(Float, nullable=True, default=None)
    carbs = Column(Float, nullable=True, default=None)
    # Новое поле: вес за штуку (если unit='шт')
    weight_per_piece = Column(Float, nullable=True)

class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    portions = Column(Integer, default=1)
    category = Column(String, default="other") 

    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

    @property
    def total_cost(self):
        total = 0.0
        for item in self.ingredients:
            if item.product:
                pack_amount = item.product.amount if item.product.amount > 0 else 1.0
                price_per_unit = item.product.price / pack_amount
                total += item.quantity * price_per_unit
        return round(total, 2)

    def _calculate_nutrient(self, attr_name):
        total = 0.0
        for item in self.ingredients:
            if item.product:
                unit_lower = (item.product.unit or "").lower()
                is_pieces = unit_lower in ["шт", "шт.", "pcs", "piece", "stk"]
                qty = item.quantity
                if unit_lower in ["kg", "кг", "l", "л"]:
                    qty *= 1000
                
                value_per_unit = getattr(item.product, attr_name, 0.0) or 0.0

                if is_pieces and item.product.weight_per_piece:
                    # Если штуки и есть вес -> считаем вес партии и берем нутриент на 100г
                    total_weight = qty * item.product.weight_per_piece
                    total += (value_per_unit / 100.0) * total_weight
                elif is_pieces:
                    # Если штуки без веса -> нутриент за штуку
                    total += value_per_unit * qty
                else:
                    val_per_gram = value_per_unit / 100.0
                    total += qty * val_per_gram
        return total

    @property
    def total_calories(self):
        return round(self._calculate_nutrient("calories"))

    @property
    def total_proteins(self):
        return round(self._calculate_nutrient("proteins"), 1)

    @property
    def total_fats(self):
        return round(self._calculate_nutrient("fats"), 1)

    @property
    def total_carbs(self):
        return round(self._calculate_nutrient("carbs"), 1)

    @property
    def total_weight(self):
        weight = 0.0
        for item in self.ingredients:
            if item.product:
                unit_lower = (item.product.unit or "").lower()
                qty = item.quantity
                
                is_pieces = unit_lower in ["шт", "шт.", "pcs", "piece", "stk"]

                if unit_lower in ["kg", "кг", "l", "л"]:
                    weight += qty * 1000
                elif unit_lower in ["g", "г", "ml", "мл"]:
                    weight += qty
                elif is_pieces and item.product.weight_per_piece:
                    weight += qty * item.product.weight_per_piece
        return weight

    @property
    def calories_per_100g(self):
        cals = self.total_calories
        weight = self.total_weight
        if weight > 0:
            return round((cals / weight) * 100)
        return 0

    @property
    def proteins_per_100g(self):
        val = self.total_proteins
        weight = self.total_weight
        if weight > 0:
            return round((val / weight) * 100, 1)
        return 0

    @property
    def fats_per_100g(self):
        val = self.total_fats
        weight = self.total_weight
        if weight > 0:
            return round((val / weight) * 100, 1)
        return 0

    @property
    def carbs_per_100g(self):
        val = self.total_carbs
        weight = self.total_weight
        if weight > 0:
            return round((val / weight) * 100, 1)
        return 0

    @property
    def calories_per_portion(self):
        if self.portions > 0:
            return round(self.total_calories / self.portions)
        return 0

    @property
    def weight_per_portion(self):
        if self.portions > 0:
            return round(self.total_weight / self.portions)
        return 0

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    recipe = relationship("Recipe", back_populates="ingredients")
    product = relationship("Product")

class FamilyMember(Base):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    color = Column(String, default="blue")
    max_calories = Column(Integer, default=2000)
    max_proteins = Column(Integer, default=135)
    max_fats = Column(Integer, default=100)
    max_carbs = Column(Integer, default=300)

class WeeklyPlanEntry(Base):
    __tablename__ = "weekly_plan"
    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String)
    meal_type = Column(String)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    portions = Column(Integer, default=1)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)

    # --- НОВОЕ ПОЛЕ ---
    date = Column(Date, nullable=True)

    recipe = relationship("Recipe")
    family_member = relationship("FamilyMember")

class AppSetting(Base):
    __tablename__ = "app_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class TelegramUser(Base):
    __tablename__ = "telegram_users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    chat_id = Column(String, unique=True)