import pytest
import requests
import os
import datetime
import uuid

# Use environment variable for API URL or default to docker compose service name
BASE_URL = os.getenv("API_URL", "http://backend:8000")

@pytest.fixture(scope="module")
def setup_data():
    """Create a temporary product and recipe for testing."""
    unique_suffix = str(uuid.uuid4())[:8]
    
    # 1. Create Product
    product_data = {
        "name": f"BoundaryProduct_{unique_suffix}",
        "price": 10,
        "amount": 1000,
        "unit": "g",
        "calories": 100,
        "proteins": 10,
        "fats": 10,
        "carbs": 10
    }
    p_resp = requests.post(f"{BASE_URL}/products/", json=product_data)
    if p_resp.status_code != 200:
        pytest.fail(f"Failed to create product: {p_resp.text}")
    product = p_resp.json()
    
    # 2. Create Recipe
    recipe_data = {
        "title": f"Boundary Test Recipe {unique_suffix}",
        "description": "For testing week boundaries",
        "portions": 4,
        "category": "breakfast", # Using breakfast as base
        "ingredients": [
            {"product_id": product["id"], "quantity": 100}
        ]
    }
    r_resp = requests.post(f"{BASE_URL}/recipes/", json=recipe_data)
    if r_resp.status_code != 200:
        # Cleanup product if recipe fails
        requests.delete(f"{BASE_URL}/products/{product['id']}")
        pytest.fail(f"Failed to create recipe: {r_resp.text}")
    recipe = r_resp.json()
    
    yield {"product": product, "recipe": recipe}
    
    # Teardown
    requests.delete(f"{BASE_URL}/recipes/{recipe['id']}")
    requests.delete(f"{BASE_URL}/products/{product['id']}")

def test_sunday_boundary_issue(setup_data):
    """
    Scenario: Ensure that items on the PREVIOUS Sunday (Feb 1) do not appear
    in the CURRENT week (Feb 2 - Feb 8), but items on THIS Sunday (Feb 8) do.
    """
    recipe_id = setup_data["recipe"]["id"]
    
    # Dates
    last_sunday = "2026-02-01"
    this_sunday = "2026-02-08"
    
    # The week range we are querying
    query_start = "2026-02-02"  # Monday
    query_end = "2026-02-08"    # Sunday (inclusive)
    
    created_ids = []
    
    try:
        # 1. Add entry for Last Sunday (Feb 1) - Should be EXCLUDED
        entry_last = {
            "day_of_week": "Воскресенье",
            "meal_type": "breakfast",
            "recipe_id": recipe_id,
            "portions": 1,
            "date": last_sunday
        }
        resp1 = requests.post(f"{BASE_URL}/plan/", json=entry_last)
        assert resp1.status_code == 200, f"Failed to add last sunday entry: {resp1.text}"
        created_ids.append(resp1.json()["id"])
        
        # 2. Add entry for This Sunday (Feb 8) - Should be INCLUDED
        entry_this = {
            "day_of_week": "Воскресенье",
            "meal_type": "lunch", # distinct type
            "recipe_id": recipe_id,
            "portions": 1,
            "date": this_sunday
        }
        resp2 = requests.post(f"{BASE_URL}/plan/", json=entry_this)
        assert resp2.status_code == 200, f"Failed to add this sunday entry: {resp2.text}"
        created_ids.append(resp2.json()["id"])
        
        # 3. Query the plan
        resp_query = requests.get(f"{BASE_URL}/plan/?start_date={query_start}&end_date={query_end}")
        assert resp_query.status_code == 200
        plan_items = resp_query.json()
        
        print(f"\nQuery returned {len(plan_items)} items for range {query_start} to {query_end}")
        
        # 4. Verify
        dates_in_plan = [item["date"] for item in plan_items]
        meal_types_in_plan = [item["meal_type"] for item in plan_items if item["date"] == this_sunday]
        
        # Check THIS Sunday is present
        assert this_sunday in dates_in_plan, "This Sunday (Feb 8) should be in the plan"
        assert "lunch" in meal_types_in_plan, "The lunch item for Feb 8 should be present"
        
        # Check LAST Sunday is ABSENT
        # Note: If database was empty properly, strictly 1 item (or existing items in that range).
        # We just check our specific date logic.
        
        # Verify specifically that our 'breakfast' for '2026-02-01' is NOT in the list
        last_sunday_items = [
            item for item in plan_items 
            if item["date"] == last_sunday and item["recipe_id"] == recipe_id
        ]
        assert len(last_sunday_items) == 0, f"Found item from Last Sunday ({last_sunday}) in current week plan!"
        
    finally:
        # Cleanup created plan items
        for pid in created_ids:
            requests.delete(f"{BASE_URL}/plan/{pid}")
