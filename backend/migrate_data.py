import os
from sqlalchemy import create_engine
from database import Base
import models # Загружаем модели, чтобы Base.metadata наполнилась

def migrate_data():
    # Хардкод пути к старой базе данных внутри контейнера
    sqlite_url = "sqlite:////app/data/menu_planner.db"
    
    # URL для новой базы данных (PostgreSQL)
    pg_url = os.getenv("DATABASE_URL", "postgresql://food_user:food_password@db:5432/food_db")

    print(f"Connecting to SQLite: {sqlite_url}")
    sqlite_engine = create_engine(sqlite_url)
    
    print(f"Connecting to PostgreSQL: {pg_url}")
    pg_engine = create_engine(pg_url)

    # Base.metadata.sorted_tables возвращает таблицы в порядке с учетом внешних ключей (foreign keys)
    tables = Base.metadata.sorted_tables

    try:
        with sqlite_engine.connect() as sqlite_conn:
            # Используем begin(), чтобы все инсерты пошли в одной транзакции
            with pg_engine.begin() as pg_conn:
                for table in tables:
                    print(f"Migrating table: {table.name}...")
                    
                    # Получаем все данные из SQLite
                    rows = sqlite_conn.execute(table.select()).fetchall()
                    if not rows:
                        print(f"  Table {table.name} is empty, skipping.")
                        continue
                    
                    # В SQLAlchemy 2.0+ используем _mapping для конвертации Row в dict
                    insert_data = [dict(row._mapping) for row in rows]
                    
                    # Вставляем данные в PostgreSQL
                    pg_conn.execute(table.insert(), insert_data)
                    
                    print(f"  Inserted {len(insert_data)} rows into {table.name}.")
                    
                print("--- [DATA MIGRATION COMPLETED SUCCESSFULLY] ---")
    except Exception as e:
        print(f"!!! MIGRATION ERROR: {e}")

if __name__ == "__main__":
    migrate_data()
