import pytest
import requests
import os
import datetime

BASE_URL = os.getenv("API_URL", "http://backend:8000")

@pytest.fixture
def recipe_fixture():
    """Create a temporary recipe for planning."""
    # Create product first
    p_data = {"name": "PlanProduct", "price": 1, "amount": 1, "unit": "kg", "calories": 100}
    p_resp = requests.post(f"{BASE_URL}/products/", json=p_data)
    product_id = p_resp.json()["id"]

    # Create recipe
    r_data = {
        "title": "PlanRecipe",
        "description": "For planning",
        "portions": 4,
        "category": "lunch",
        "ingredients": [{"product_id": product_id, "quantity": 1}]
    }
    r_resp = requests.post(f"{BASE_URL}/recipes/", json=r_data)
    recipe = r_resp.json()
    
    yield recipe

    # Cleanup
    requests.delete(f"{BASE_URL}/recipes/{recipe['id']}")
    requests.delete(f"{BASE_URL}/products/{product_id}")

def test_add_and_remove_plan_item(recipe_fixture):
    """Test adding an item to the plan and removing it."""
    
    today = datetime.date.today().isoformat()
    
    plan_data = {
        "day_of_week": "Понедельник",
        "meal_type": "lunch",
        "recipe_id": recipe_fixture["id"],
        "portions": 1,
        "date": today
    }
    
    # Add
    resp_add = requests.post(f"{BASE_URL}/plan/", json=plan_data)
    assert resp_add.status_code == 200
    item = resp_add.json()
    assert item["recipe_id"] == recipe_fixture["id"]
    assert item["date"] == today
    
    item_id = item["id"]
    
    # Get Plan
    resp_plan = requests.get(f"{BASE_URL}/plan/")
    assert resp_plan.status_code == 200
    plan_items = resp_plan.json()
    assert any(i["id"] == item_id for i in plan_items)
    
    # Update
    update_data = {"portions": 2}
    resp_update = requests.put(f"{BASE_URL}/plan/{item_id}", json=update_data)
    assert resp_update.status_code == 200
    assert resp_update.json()["portions"] == 2
    
    # Delete
    resp_del = requests.delete(f"{BASE_URL}/plan/{item_id}")
    assert resp_del.status_code == 200
    
    # Verify Gone
    resp_plan_after = requests.get(f"{BASE_URL}/plan/")
    plan_items_after = resp_plan_after.json()
    assert not any(i["id"] == item_id for i in plan_items_after)
