import json
import os
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db

router = APIRouter(
    prefix="/admin",
    tags=["Administration"]
)

CONFIG_PATH = "/app/data/config.json"

class LoginRequest(BaseModel):
    password: str

# --- ЛОГИН (через файл config.json) ---

def load_config():
    default_config = {"admin_password": "123", "app_name": "FoodPlanner"}
    if not os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(default_config, f, indent=2)
            return default_config
        except Exception:
            return default_config

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default_config

@router.post("/verify")
def verify_password(body: LoginRequest):
    config = load_config()
    server_password = config.get("admin_password", "123")
    if body.password == server_password:
        return {"status": "ok", "message": "Access granted"}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")


# --- УПРАВЛЕНИЕ ТОКЕНОМ БОТА (В БД) ---

@router.get("/telegram/token")
def get_bot_token(db: Session = Depends(get_db)):
    # Ищем настройку с ключом 'bot_token'
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "bot_token").first()
    return {"token": setting.value if setting else ""}

@router.post("/telegram/token")
def set_bot_token(body: schemas.TokenUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "bot_token").first()
    if not setting:
        # Создаем, если нет
        setting = models.AppSetting(key="bot_token", value=body.token)
        db.add(setting)
    else:
        # Обновляем, если есть
        setting.value = body.token
    db.commit()
    return {"status": "ok", "message": "Токен сохранен"}


# --- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ TELEGRAM (В БД) ---

@router.get("/telegram/users", response_model=List[schemas.TelegramUserResponse])
def get_telegram_users(db: Session = Depends(get_db)):
    return db.query(models.TelegramUser).all()

@router.post("/telegram/users", response_model=schemas.TelegramUserResponse)
def add_telegram_user(user: schemas.TelegramUserCreate, db: Session = Depends(get_db)):
    # Проверяем на дубликаты
    existing = db.query(models.TelegramUser).filter(models.TelegramUser.chat_id == user.chat_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким Chat ID уже существует")
    
    new_user = models.TelegramUser(name=user.name, chat_id=user.chat_id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/telegram/users/{user_id}")
def delete_telegram_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.TelegramUser).filter(models.TelegramUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"ok": True}