from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# --- SQLite Connection (Primary / Old Data) ---
SQLITE_URL = "sqlite:////app/data/menu_planner.db"

engine = create_engine(
    SQLITE_URL, 
    connect_args={
        "check_same_thread": False,
        "timeout": 15
    }
)

from sqlalchemy import event
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- PostgreSQL Connection (New Data / Test) ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://food_user:food_password@db:5432/food_db")

pg_engine = create_engine(DATABASE_URL)
pg_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine)

Base = declarative_base()