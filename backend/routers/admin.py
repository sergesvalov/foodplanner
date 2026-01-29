import json
import os
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db

router = APIRouter(prefix="/admin", tags=["Administration"])

CONFIG_PATH = "/app/data/config.json"
SETTINGS_BACKUP_PATH = "/app/data/settings.json"

class LoginRequest(BaseModel):
    password: str

def load_config():
    default_config = {"admin_password": "123", "app_name": "FoodPlanner"}
    if not os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(default_config, f, indent=2)
            return default_config
        except Exception: return default_config
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception: return default_config

@router.post("/verify")
def verify_password(body: LoginRequest):
    config = load_config()
    if body.password == config.get("admin_password", "123"):
        return {"status": "ok", "message": "Access granted"}
    raise HTTPException(status_code=401, detail="Invalid password")

# Telegram Token
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
    else: setting.value = body.token
    db.commit()
    return {"status": "ok", "message": "Токен сохранен"}

# Telegram Users
@router.get("/telegram/users", response_model=List[schemas.TelegramUserResponse])
def get_telegram_users(db: Session = Depends(get_db)):
    return db.query(models.TelegramUser).all()

@router.post("/telegram/users", response_model=schemas.TelegramUserResponse)
def add_telegram_user(user: schemas.TelegramUserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.TelegramUser).filter(models.TelegramUser.chat_id == user.chat_id).first()
    if existing: raise HTTPException(status_code=400, detail="Пользователь уже существует")
    new_user = models.TelegramUser(name=user.name, chat_id=user.chat_id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/telegram/users/{user_id}")
def delete_telegram_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.TelegramUser).filter(models.TelegramUser.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"ok": True}

# Family Members (NEW)
@router.get("/family", response_model=List[schemas.FamilyMemberResponse])
def get_family_members(db: Session = Depends(get_db)):
    return db.query(models.FamilyMember).all()

@router.post("/family", response_model=schemas.FamilyMemberResponse)
def add_family_member(member: schemas.FamilyMemberCreate, db: Session = Depends(get_db)):
    new_member = models.FamilyMember(name=member.name, color=member.color)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.delete("/family/{member_id}")
def delete_family_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(models.FamilyMember).filter(models.FamilyMember.id == member_id).first()
    if not member: raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"ok": True}

# Import / Export
@router.get("/settings/export")
def export_settings(db: Session = Depends(get_db)):
    try:
        data = {
            "app_settings": [{"key": s.key, "value": s.value} for s in db.query(models.AppSetting).all()],
            "telegram_users": [{"name": u.name, "chat_id": u.chat_id} for u in db.query(models.TelegramUser).all()],
            "family_members": [{"name": f.name, "color": f.color} for f in db.query(models.FamilyMember).all()]
        }
        with open(SETTINGS_BACKUP_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return {"status": "ok", "message": "Настройки сохранены"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/import")
def import_settings(db: Session = Depends(get_db)):
    if not os.path.exists(SETTINGS_BACKUP_PATH): raise HTTPException(status_code=404, detail="Файл не найден")
    try:
        with open(SETTINGS_BACKUP_PATH, "r", encoding="utf-8") as f: data = json.load(f)
        db.query(models.AppSetting).delete()
        db.query(models.TelegramUser).delete()
        db.query(models.FamilyMember).delete()
        
        for s in data.get("app_settings", []): db.add(models.AppSetting(key=s["key"], value=s["value"]))
        for u in data.get("telegram_users", []): db.add(models.TelegramUser(name=u["name"], chat_id=u["chat_id"]))
        for f in data.get("family_members", []): db.add(models.FamilyMember(name=f["name"], color=f["color"]))
        
        db.commit()
        return {"status": "ok", "message": "Настройки восстановлены"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))