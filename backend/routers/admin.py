import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/admin",
    tags=["Administration"]
)

# Путь к файлу конфигурации
CONFIG_PATH = "/app/data/config.json"

# Модель для приема пароля
class LoginRequest(BaseModel):
    password: str

def load_config():
    """
    Загружает конфиг. Если файла нет — создает его с паролем '123'.
    """
    default_config = {
        "admin_password": "123",
        "app_name": "FoodPlanner"
    }
    
    if not os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(default_config, f, indent=2)
            return default_config
        except Exception as e:
            print(f"Error creating config: {e}")
            return default_config

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading config: {e}")
        return default_config

@router.post("/verify")
def verify_password(body: LoginRequest):
    """
    Проверяет пароль, присланный с фронтенда.
    """
    config = load_config()
    # Если в конфиге нет пароля, используем '123' по умолчанию
    server_password = config.get("admin_password", "123")
    
    if body.password == server_password:
        return {"status": "ok", "message": "Access granted"}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")