from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Импортируем наши новые роутеры
from routers import products, recipes, plan, shopping_list

# Создаем таблицы (если нет)
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

# Подключаем модули
app.include_router(products.router)
app.include_router(recipes.router)
app.include_router(plan.router)
app.include_router(shopping_list.router)

# Корневой маршрут (для проверки работоспособности)
@app.get("/")
def read_root():
    return {"status": "ok", "message": "FoodPlanner API is running"}