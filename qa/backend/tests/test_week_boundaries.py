import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from dependencies import get_db
import models
import pytest
from dependencies import get_db
import models
import pytest

# Setup Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_boundaries.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    models.Base.metadata.create_all(bind=engine)
    yield
    models.Base.metadata.drop_all(bind=engine)
    import os
    if os.path.exists("./test_boundaries.db"):
        os.remove("./test_boundaries.db")

def test_sunday_boundary_issue(setup_db):
    # Scenario: Today is Sunday, Feb 8th 2026.
    # Current Week: Feb 2 (Mon) - Feb 8 (Sun).
    # Last Sunday: Feb 1.
    
    # We simulate "Today" as Feb 8.
    # But we can't easily mock datetime.date.today() inside the API without patching.
    # However, the API accepts start_date and end_date.
    
    # Let's create an entry explicitly dated Feb 1 (Last Sunday).
    # And one dated Feb 8 (This Sunday).
    
    db = TestingSessionLocal()
    
    # Create a recipe first
    recipe = models.Recipe(title="Boundary Test Recipe", category="breakfast", total_calories=100)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    
    # 1. Entry for last Sunday (Feb 1)
    last_sunday = datetime.date(2026, 2, 1)
    entry_last = models.WeeklyPlanEntry(
        day_of_week="Воскресенье",
        meal_type="breakfast",
        recipe_id=recipe.id,
        date=last_sunday
    )
    db.add(entry_last)
    
    # 2. Entry for this Sunday (Feb 8)
    this_sunday = datetime.date(2026, 2, 8)
    entry_this = models.WeeklyPlanEntry(
        day_of_week="Воскресенье",
        meal_type="lunch", # Different type to distinguish
        recipe_id=recipe.id,
        date=this_sunday
    )
    db.add(entry_this)
    
    db.commit()
    db.close()
    
    # 3. Query for "Current Week" (Feb 2 - Feb 8)
    # The frontend calculates this range.
    start_date = "2026-02-02"
    end_date = "2026-02-08"
    
    response = client.get(f"/api/plan/?start_date={start_date}&end_date={end_date}")
    assert response.status_code == 200
    data = response.json()
    
    print(f"\nQuery Range: {start_date} to {end_date}")
    print("Items found:", len(data))
    for item in data:
        print(f" - {item['date']} {item['meal_type']}")
        
    # Expectation: Only 'lunch' (Feb 8) should be present. 'breakfast' (Feb 1) should be excluded.
    dates = [item['date'] for item in data]
    
    assert "2026-02-08" in dates
    assert "2026-02-01" not in dates, "Last Sunday's item appeared in this week's plan!"
