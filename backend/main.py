from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Импортируем все роутеры из папки routers
from routers import products, recipes, plan, shopping_list, admin

# Создаем таблицы в БД (если их нет)
# Создаем таблицы в БД (если их нет)
models.Base.metadata.create_all(bind=engine)

# --- БЫСТРАЯ МИГРАЦИЯ ДЛЯ НОВОГО ПОЛЯ DATE ---
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
try:
    with engine.connect() as conn:
        # Пытаемся выбрать новое поле. Если упадет - значит его нет.
        try:
            conn.execute(text("SELECT date FROM weekly_plan LIMIT 1"))
        except OperationalError:
            print("Migration: Adding 'date' column to 'weekly_plan'...")
            conn.execute(text("ALTER TABLE weekly_plan ADD COLUMN date DATE"))
            conn.commit()
            print("Migration: Done.")
except Exception as e:
    print(f"Migration check failed (it's ok if table doesn't exist yet): {e}")
# ---------------------------------------------

app = FastAPI(title="Menu Planner API")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем модули (роутеры)
app.include_router(products.router)
app.include_router(recipes.router)
app.include_router(plan.router)
app.include_router(shopping_list.router)
app.include_router(admin.router) # <-- Админка подключена

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FoodPlanner API is running"}