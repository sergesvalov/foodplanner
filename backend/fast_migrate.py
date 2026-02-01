import os
import time
from alembic import command
from alembic.config import Config
from database import engine

def run_auto_migrations():
    # Ждем, пока БД станет доступна (актуально, если переедете на PostgreSQL, для SQLite не критично)
    time.sleep(1)
    
    # Указываем путь к alembic.ini
    alembic_cfg = Config("alembic.ini")

    try:
        print("--- [MIGRATION START] ---")
        
        # 1. Сначала накатываем всё, что уже есть (чтобы база была актуальной перед сравнением)
        print("1. Applying existing migrations...")
        command.upgrade(alembic_cfg, "head")

        # 2. Генерируем новую миграцию (если есть изменения в models.py)
        # Alembic сравнит структуру БД с кодом models.py
        print("2. Checking for schema changes...")
        command.revision(alembic_cfg, message="auto_update", autogenerate=True)

        # 3. Снова накатываем (если на шаге 2 создался новый файл)
        print("3. Applying new changes (if any)...")
        command.upgrade(alembic_cfg, "head")
        
        print("--- [MIGRATION DONE] ---")

    except Exception as e:
        print(f"!!! MIGRATION ERROR: {e}")
        # Не роняем контейнер, чтобы приложение могло попытаться запуститься,
        # даже если миграции сломались (хотя это рискованно)

if __name__ == "__main__":
    run_auto_migrations()