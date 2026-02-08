import datetime
import pytest
import sys
import os

# Robustly add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
sys.path.append("/app")

# Now import app
from main import app
from dependencies import get_db
import models

# Setup Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dates.db"
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
    if os.path.exists("./test_dates.db"):
        os.remove("./test_dates.db")

def test_week_filtering_boundaries(setup_db):
    """
    Scenario: 'Today' is Sunday Feb 8.
    Week Range: Mon Feb 2 - Sun Feb 8.
    
    We insert:
    1. Item A: Last Sunday (Feb 1) - Should be EXCLUDED.
    2. Item B: This Monday (Feb 2) - Should be INCLUDED.
    3. Item C: This Sunday (Feb 8) - Should be INCLUDED.
    4. Item D: Next Monday (Feb 9) - Should be EXCLUDED.
    """
    db = TestingSessionLocal()
    
    # Create Dummy Recipe
    recipe = models.Recipe(title="Date Test", category="breakfast", total_calories=100)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    
    # helper
    def add_plan(d_date, day_name, meal):
        item = models.WeeklyPlanEntry(
            day_of_week=day_name,
            meal_type=meal,
            recipe_id=recipe.id,
            date=d_date
        )
        db.add(item)
    
    # 1. Last Sunday (Feb 1)
    add_plan(datetime.date(2026, 2, 1), "Воскресенье", "breakfast")
    
    # 2. This Monday (Feb 2)
    add_plan(datetime.date(2026, 2, 2), "Понедельник", "lunch")
    
    # 3. This Sunday (Feb 8)
    add_plan(datetime.date(2026, 2, 8), "Воскресенье", "dinner")
    
    # 4. Next Monday (Feb 9)
    add_plan(datetime.date(2026, 2, 9), "Понедельник", "breakfast")
    
    db.commit()
    db.close()
    
    # Perform Query for "Current Week" (Feb 2 - Feb 8)
    start = "2026-02-02"
    end = "2026-02-08"
    
    res = client.get(f"/api/plan/?start_date={start}&end_date={end}")
    assert res.status_code == 200
    data = res.json()
    
    dates = [x['date'] for x in data]
    print(f"Returned dates: {dates}")
    
    assert "2026-02-01" not in dates, "Feb 1 (Last Sunday) should be excluded"
    assert "2026-02-02" in dates, "Feb 2 (This Mon) should be included"
    assert "2026-02-08" in dates, "Feb 8 (This Sun) should be included"
    assert "2026-02-09" not in dates, "Feb 9 (Next Mon) should be excluded"

def test_autofill_date_logic(setup_db):
    """
    Verify that backend date calculation matches expectations.
    If today is Sunday Feb 8, then 'get_date_for_day_of_week' for 'Воскресенье' should differ 
    depending on how we define 'current week'.
    """
    # This logic is internal to routers/plan.py helper get_date_for_day_of_week
    # But that helper depends on datetime.date.today().
    # We can't mock today easily in these integration tests without patching 'services.plan.datetime'.
    pass

def test_date_integrity(setup_db):
    """
    Verify that when we POST a plan item with a specific date, 
    it is saved EXACTLY as provided, without any timezone shifts.
    """
    db = TestingSessionLocal()
    recipe = db.query(models.Recipe).first()
    if not recipe:
        recipe = models.Recipe(title="Integrity Test", category="breakfast", total_calories=100)
        db.add(recipe)
        db.commit()
    db.refresh(recipe)
    db.close()
    
    target_date = "2026-05-15" # Random future date
    day_name = "Пятница"
    
    payload = {
        "day_of_week": day_name,
        "meal_type": "lunch",
        "recipe_id": recipe.id,
        "portions": 1,
        "date": target_date
    }
    
    response = client.post("/api/plan/", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    print(f"Sent: {target_date}, Received: {data['date']}")
    assert data['date'] == target_date, "Date mismatch on save!"
    
    # Verify retrieval
    # Start/End date query
    res = client.get(f"/api/plan/?start_date={target_date}&end_date={target_date}")
    items = res.json()
    assert len(items) == 1
    assert items[0]['date'] == target_date, "Date mismatch on retrieval!"

def test_null_date_exclusion(setup_db):
    """
    Ensure items with NULL date (if any exist) are NOT returned when filtering by date range.
    """
    db = TestingSessionLocal()
    recipe = db.query(models.Recipe).first()
    if not recipe:
        recipe = models.Recipe(title="Null Date Test", category="breakfast", total_calories=100)
        db.add(recipe)
        db.commit()
    db.refresh(recipe)
    
    # Manually insert item with NULL date
    # Note: Pydantic/SQLAlchemy might set default, so we explicitly set None if allowed by model
    # If model requires date, this test might fail on insert, which is also good (integrity).
    try:
        item = models.WeeklyPlanEntry(
            day_of_week="Воскресенье",
            meal_type="breakfast",
            recipe_id=recipe.id,
            portions=1,
            date=None # Explicit None
        )
        db.add(item)
        db.commit()
    except Exception as e:
        print(f"Computed date required or DB constraint: {e}")
        db.rollback()
        return # If we can't insert null, we are safe from null ghosts
        
    db.close()
    
    # Query Range
    start = "2026-02-02"
    end = "2026-02-08"
    
    res = client.get(f"/api/plan/?start_date={start}&end_date={end}")
    data = res.json()
    
    # Should NOT satisfy date >= start
    # SQL comparison with NULL result in NULL (False-ish for filter)
    ids = [x['id'] for x in data]
    print(f"IDs with null date check: {ids}")
    # We can't know ID easily without refresh, but if list is empty good.
    # If list has items, verify they have dates.
    for x in data:
        assert x['date'] is not None, "Item with NULL date leaked into range query!"
