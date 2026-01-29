from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Импортируем все роутеры из папки routers
from routers import products, recipes, plan, shopping_list, admin

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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FoodPlanner API is running"}