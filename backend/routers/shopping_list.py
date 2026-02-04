import requests
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from dependencies import get_db

router = APIRouter(
    prefix="/shopping-list",
    tags=["Shopping List"]
)

class TelegramSendRequest(BaseModel):
    chat_id: str

from services.shopping_list import calculate_shopping_list
@router.get("/")
def get_shopping_list_api(db: Session = Depends(get_db)):
    return calculate_shopping_list(db)

@router.post("/send")
def send_shopping_list_telegram(body: TelegramSendRequest, db: Session = Depends(get_db)):
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "bot_token").first()
    if not setting or not setting.value:
        raise HTTPException(status_code=400, detail="Токен бота не настроен в админке")
    
    bot_token = setting.value
    items = calculate_shopping_list(db)
    
    if not items:
        raise HTTPException(status_code=400, detail="Список покупок пуст")

    total_cost = sum(i["estimated_cost"] for i in items)
    
    message_lines = ["🛒 *Список покупок*", ""]
    for i, item in enumerate(items, 1):
        line = f"{i}. {item['name']} — *{item['total_quantity']} {item['unit']}* (~€{item['estimated_cost']:.2f})"
        message_lines.append(line)
    
    message_lines.append("")
    message_lines.append(f"💰 *Примерно:* €{total_cost:.2f}")
    
    message_text = "\n".join(message_lines)
    telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    try:
        resp = requests.post(telegram_url, json={
            "chat_id": body.chat_id,
            "text": message_text,
            "parse_mode": "Markdown"
        })
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Telegram Error: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection Error: {str(e)}")

    return {"status": "ok", "message": "Список отправлен"}