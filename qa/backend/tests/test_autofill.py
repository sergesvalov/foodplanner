import pytest
import requests
import os
import datetime
import random
import string

BASE_URL = os.getenv("API_URL", "http://backend:8000")

@pytest.fixture
def autofill_fixtures():
    """Create necessary recipes for autofill."""
    # Create product
    p_resp = requests.post(f"{BASE_URL}/products/", json={"name": "AutoFillProd", "price": 1, "amount": 1, "unit": "kg", "calories": 200, "weight_per_piece": 100})
    product_id = p_resp.json()["id"]

    created_recipes = []
    
    # Create Soup
    requests.post(f"{BASE_URL}/recipes/", json={
        "title": "AutoFillSoup", "description": "Soup", "portions": 10, "category": "soup", "rating": 5,
        "ingredients": [{"product_id": product_id, "quantity": 100}] # 200 kcal
    }).json() # ignore result, just need it there
    
    # Create Main
    requests.post(f"{BASE_URL}/recipes/", json={
        "title": "AutoFillMain", "description": "Main", "portions": 10, "category": "main", "rating": 5,
        "ingredients": [{"product_id": product_id, "quantity": 200}] # 400 kcal
    }).json()

    # Capture IDs for cleanup by name maybe? 
    # Or just rely on the test logic finding them.
    # Logic in autofill uses "soup" and "main" categories.
    
    yield
    
    # Clean up (find by name to delete)
    all_recipes = requests.get(f"{BASE_URL}/recipes/").json()
    for r in all_recipes:
        if r["title"].startswith("AutoFill"):
            requests.delete(f"{BASE_URL}/recipes/{r['id']}")
            
    requests.delete(f"{BASE_URL}/products/{product_id}")

def test_autofill_week(autofill_fixtures):
    """Test that autofill_week populates the plan."""
    
    # 1. Trigger Autofill
    resp = requests.post(f"{BASE_URL}/plan/autofill_week")
    assert resp.status_code == 200, f"Autofill failed: {resp.text}"
    
    # 2. Verify
    # Autofill targets next week.
    today = datetime.date.today()
    next_monday = today + datetime.timedelta(days=(7 - today.weekday()))
    
    resp_plan = requests.get(f"{BASE_URL}/plan/", params={"start_date": next_monday.isoformat()})
    assert resp_plan.status_code == 200
    plan = resp_plan.json()
    
    # Should have at least some items (7 days * 2 meals * users)
    assert len(plan) > 0, "Plan should not be empty after autofill"
    
    # Check that we have lunch and dinner
    meals = [p["meal_type"] for p in plan]
    assert "lunch" in meals
    assert "dinner" in meals
    
    # 3. Cleanup created plan items
    # We only want to remove the ones we just added to avoid polluting
    # Using the date range of next week
    for item in plan:
        requests.delete(f"{BASE_URL}/plan/{item['id']}")

