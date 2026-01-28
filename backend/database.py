from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Абсолютный путь внутри контейнера.
# Docker свяжет эту папку с папкой 'foodplanner' на твоем сервере.
# 4 слэша (sqlite:////) означают абсолютный путь в Unix системах.
SQL_ALCHEMY_DATABASE_URL = "sqlite:////app/data/menu_planner.db"

# connect_args={"check_same_thread": False} обязательно для SQLite при многопоточном доступе
engine = create_engine(
    SQL_ALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()