from sqlalchemy.orm import Session
from fastapi import HTTPException
import requests
import models

def send_telegram_message(db: Session, chat_id: str, message_text: str):
    """
    Sends a message via Telegram Bot API using the token stored in AppSettings.
    """
    # 1. Get Token
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "bot_token").first()
    if not setting or not setting.value:
        raise HTTPException(status_code=400, detail="Токен бота не настроен в админке")
    
    bot_token = setting.value
    telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    # 2. Send Request
    try:
        resp = requests.post(telegram_url, json={
            "chat_id": chat_id,
            "text": message_text,
            "parse_mode": "Markdown"
        })
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Telegram Error: {resp.text}")
            
    except Exception as e:
        # Re-raise HTTP exceptions (like the 500 above)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Connection Error: {str(e)}")

    return True
