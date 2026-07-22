from database import SessionLocal, pg_SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_pg_db():
    db = pg_SessionLocal()
    try:
        yield db
    finally:
        db.close()