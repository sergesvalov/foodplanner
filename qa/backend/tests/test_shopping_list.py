import pytest
import requests
import os
import datetime
import random
import string

BASE_URL = os.getenv("API_URL", "http://backend:8000")

@pytest.fixture
def shopping_fixture():
    """Setup a plan with known ingredients to test aggregation."""
    # 1. Create Product (1kg)
    # Price: 10.0, Amount: 1.0, Unit: kg
    p_resp = requests.post(f"{BASE_URL}/products/", json={
        "name": "ShopTestProd_" + "".join(random.choices(string.ascii_letters, k=5)),
        "price": 10.0,
        "amount": 1.0,
        "unit": "kg", 
        "calories": 100
    })
    product = p_resp.json()
    
    # 2. Create Recipe (Uses 500g of Product)
    # Portions: 1
    r_resp = requests.post(f"{BASE_URL}/recipes/", json={
        "title": "ShopTestRecipe",
        "ingredients": [{"product_id": product["id"], "quantity": 0.5}], # 0.5 kg
        "portions": 1,
        "rating": 5
    })
    recipe = r_resp.json()
    
    # 3. Add to Plan
    # Portions: 2 (So we expect 0.5 * 2 = 1.0 kg total)
    today = datetime.date.today().isoformat()
    plan_resp = requests.post(f"{BASE_URL}/plan/", json={
        "day_of_week": "Monday", 
        "meal_type": "lunch",
        "recipe_id": recipe["id"],
        "portions": 2,
        "date": today
    })
    plan_item = plan_resp.json()
    
    yield {
        "product": product,
        "recipe": recipe,
        "plan_item": plan_item
    }
    
    # Cleanup
    requests.delete(f"{BASE_URL}/plan/{plan_item['id']}")
    requests.delete(f"{BASE_URL}/recipes/{recipe['id']}")
    requests.delete(f"{BASE_URL}/products/{product['id']}")

def test_shopping_list_aggregation(shopping_fixture):
    """Test that shopping list calculates totals correctly."""
    
    resp = requests.get(f"{BASE_URL}/shopping-list/")
    assert resp.status_code == 200
    items = resp.json()
    
    # Find our product
    target_id = shopping_fixture["product"]["id"]
    target_item = next((i for i in items if i["id"] == target_id), None)
    
    assert target_item is not None, "Product missing from shopping list"
    
    # Logic Check:
    # Recipe Ingredients: 0.5 kg
    # Recipe Portions: 1
    # Plan Portions: 2
    # Scaling: 0.5 * (2/1) = 1.0 total needed.
    # Total pack amount: 1.0
    # Packs needed: 1.0
    
    expected_qty = 1.0
    assert abs(target_item["total_quantity"] - expected_qty) < 0.01, \
        f"Expected qty {expected_qty}, got {target_item['total_quantity']}"
        
    expected_cost = 10.0 # 1 pack * 10.0
    assert abs(target_item["estimated_cost"] - expected_cost) < 0.01
