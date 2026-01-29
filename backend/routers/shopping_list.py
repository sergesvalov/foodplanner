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

# Схема для получения chat_id от фронтенда
class TelegramSendRequest(BaseModel):
    chat_id: str

# --- Вспомогательная функция (расчет списка) ---
def calculate_shopping_list(db: Session):
    """
    Внутренняя логика подсчета продуктов.
    Возвращает список словарей.
    """
    plan_items = db.query(models.WeeklyPlanEntry).all()
    shopping_dict = {}

    for plan_item in plan_items:
        if not plan_item.recipe: continue
        for ingredient in plan_item.recipe.ingredients:
            if not ingredient.product: continue
            
            p_id = ingredient.product_id
            if p_id not in shopping_dict:
                shopping_dict[p_id] = {"product": ingredient.product, "quantity": 0.0}
            shopping_dict[p_id]["quantity"] += ingredient.quantity

    result = []
    for p_id, data in shopping_dict.items():
        product = data["product"]
        total_qty = data["quantity"]
        
        pack_amount = product.amount if product.amount > 0 else 1.0
        price_per_unit = product.price / pack_amount
        estimated_cost = total_qty * price_per_unit

        result.append({
            "id": product.id,
            "name": product.name,
            "total_quantity": round(total_qty, 3),
            "unit": product.unit,
            "estimated_cost": round(estimated_cost, 2),
            "packs_needed": round(total_qty / pack_amount, 1)
        })
    
    result.sort(key=lambda x: x["name"])
    return result

# --- Основной GET (использует функцию выше) ---
@router.get("/")
def get_shopping_list_api(db: Session = Depends(get_db)):
    return calculate_shopping_list(db)

# --- НОВЫЙ ENDPOINT: Отправка в Telegram ---
@router.post("/send")
def send_shopping_list_telegram(body: TelegramSendRequest, db: Session = Depends(get_db)):
    # 1. Получаем токен
    setting = db.query(models.AppSetting).filter(models.AppSetting.key == "bot_token").first()
    if not setting or not setting.value:
        raise HTTPException(status_code=400, detail="Токен бота не настроен в админке")
    
    bot_token = setting.value

    # 2. Считаем список
    items = calculate_shopping_list(db)
    if not items:
        raise HTTPException(status_code=400, detail="Список покупок пуст")

    # 3. Формируем красивый текст сообщения
    total_cost = sum(i["estimated_cost"] for i in items)
    
    message_lines = ["🛒 *Список покупок*", ""]
    for i, item in enumerate(items, 1):
        # Формат: 1. Молоко — 2.0 л
        line = f"{i}. {item['name']} — *{item['total_quantity']} {item['unit']}*"
        message_lines.append(line)
    
    message_lines.append("")
    message_lines.append(f"💰 *Примерно:* €{total_cost:.2f}")
    
    message_text = "\n".join(message_lines)

    # 4. Отправляем запрос в Telegram API
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