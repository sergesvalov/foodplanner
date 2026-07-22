from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Импортируем все роутеры из папки routers
from routers import products, recipes, plan, shopping_list, admin

# Создаем таблицы в БД (если их нет)
# Создаем таблицы в БД (если их нет)
models.Base.metadata.create_all(bind=engine)



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

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from dependencies import get_pg_db

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FoodPlanner API is running"}

@app.get("/check_pg")
def check_pg(db: Session = Depends(get_pg_db)):
    try:
        result = db.execute(text("SELECT 1")).scalar()
        return {"status": "ok", "message": "PostgreSQL connection successful", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}