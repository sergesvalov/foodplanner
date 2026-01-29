import json
import os
import schemas
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
SETTINGS_BACKUP_PATH = "/app/data/settings.json" # Путь к файлу бэкапа настроек

class LoginRequest(BaseModel):
    password: str

# --- ЛОГИН ---
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

# --- УПРАВЛЕНИЕ ТОКЕНОМ ---
@router.get("/telegram/token")
def get_bot_token(db: Session = Depends(get_db)):
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "bot_token").first()
    return {"token": setting.value if setting else ""}

@router.post("/telegram/token")
def set_bot_token(body: schemas.TokenUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "bot_token").first()
    if not setting:
        setting = models.AppSetting(key="bot_token", value=body.token)
        db.add(setting)
    else:
        setting.value = body.token
    db.commit()
    return {"status": "ok", "message": "Токен сохранен"}

# --- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ---
@router.get("/telegram/users", response_model=List[schemas.TelegramUserResponse])
def get_telegram_users(db: Session = Depends(get_db)):
    return db.query(models.TelegramUser).all()

@router.post("/telegram/users", response_model=schemas.TelegramUserResponse)
def add_telegram_user(user: schemas.TelegramUserCreate, db: Session = Depends(get_db)):
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

# --- НОВЫЕ ЭНДПОИНТЫ: ЭКСПОРТ И ИМПОРТ НАСТРОЕК ---

@router.get("/settings/export")
def export_settings(db: Session = Depends(get_db)):
    """Сохраняет настройки и пользователей в settings.json"""
    try:
        # 1. Читаем данные из БД
        settings_data = db.query(models.AppSetting).all()
        users_data = db.query(models.TelegramUser).all()

        # 2. Формируем словарь
        export_data = {
            "app_settings": [{"key": s.key, "value": s.value} for s in settings_data],
            "telegram_users": [{"name": u.name, "chat_id": u.chat_id} for u in users_data]
        }

        # 3. Пишем в файл
        with open(SETTINGS_BACKUP_PATH, "w", encoding="utf-8") as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
            
        return {"status": "ok", "message": "Настройки успешно сохранены в файл settings.json"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка экспорта: {str(e)}")

@router.post