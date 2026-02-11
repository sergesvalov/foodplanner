import pytest
import requests
import uuid
import os
from datetime import datetime, timedelta

# --- Config ---
BASE_URL = os.environ.get("API_URL", "http://menu_backend:8000")

@pytest.fixture
def test_data():
    """Calculates dynamic dates for the test"""
    today = datetime.now()
    # Find next Monday to avoid conflicts with existing plans
    days_ahead = 0 - today.weekday()
    if days_ahead <= 0: # Target next week
        days_ahead += 7
    monday = today + timedelta(days=days_ahead)
    
    return {
        "monday": monday.strftime('%Y-%m-%d'),
        "sunday": (monday + timedelta(days=6)).strftime('%Y-%m-%d')
    }

def test_statistics_data_flow(test_data):
    """
    Simulates the data flow required for statistics calculation:
    1. Create Product
    2. Create Recipe using Product
    3. Create User
    4. Add Recipe to Plan for User
    5. Fetch Plan for Date Range
    6. Verify Item has Recipe and Ingredients (which frontend uses to calc stats)
    """

    # 1. Create Product (100g = 100kcal)
    prod_name = f"TestStatProd_{uuid.uuid4().hex[:6]}"
    res_prod = requests.post(f"{BASE_URL}/products/", json={
        "name": prod_name,
        "calories": 100,
        "proteins": 10,
        "fats": 10,
        "carbs": 10,
        "price": 0,
        "amount": 100,
        "unit": "g"
    })
    assert res_prod.status_code == 200
    product_id = res_prod.json()["id"]

    # 2. Create Recipe (uses 100g of product = 100kcal)
    rec_name = f"TestStatRec_{uuid.uuid4().hex[:6]}"
    res_rec = requests.post(f"{BASE_URL}/recipes/", json={
        "title": rec_name,
        "description": "desc",
        "portions": 1,
        "category": "breakfast",
        "ingredients": [
            {"product_id": product_id, "quantity": 100} 
        ]
    })
    assert res_rec.status_code == 200
    recipe_id = res_rec.json()["id"]

    # 3. Create User
    user_name = f"TestUser_{uuid.uuid4().hex[:6]}"
    res_user = requests.post(f"{BASE_URL}/admin/family", json={
        "name": user_name,
        "tg_username": user_name,
        "max_calories": 2000
    })
    assert res_user.status_code == 200
    user_id = res_user.json()["id"]

    item_id = None
    try:
        # 4. Add to Plan (Monday)
        res_plan = requests.post(f"{BASE_URL}/plan/", json={
            "day_of_week": "Понедельник",
            "meal_type": "breakfast",
            "recipe_id": recipe_id,
            "portions": 1.0,
            "family_member_id": user_id,
            "date": test_data["monday"]
        })
        assert res_plan.status_code == 200
        item_id = res_plan.json()["id"]

        # 5. Fetch Plan (Mimic Statistics Page fetch)
        res_fetch = requests.get(f"{BASE_URL}/plan/?start_date={test_data['monday']}&end_date={test_data['sunday']}")
        assert res_fetch.status_code == 200
        plan_items = res_fetch.json()

        # 6. Verify Correctness
        # Find our item
        target = next((x for x in plan_items if x["id"] == item_id), None)
        assert target is not None, "Created plan item should be returned in range"
        
        # Verify nested data structure (crucial for frontend stats)
        assert target["recipe"]["id"] == recipe_id
        assert len(target["recipe"]["ingredients"]) == 1
        ing = target["recipe"]["ingredients"][0]
        assert ing["product"]["id"] == product_id
        assert ing["quantity"] == 100
        
        # Frontend does client-side calculation, so if we get the data, it logic holds.
        print(f"Verified Statistics Data Flow for {test_data['monday']}")

    finally:
        # Cleanup
        if item_id:
            requests.delete(f"{BASE_URL}/plan/{item_id}")
        requests.delete(f"{BASE_URL}/admin/family/{user_id}")
        requests.delete(f"{BASE_URL}/recipes/{recipe_id}")
        requests.delete(f"{BASE_URL}/products/{product_id}")
