import pytest
import requests
import os
import uuid

# Configuration
BASE_URL = os.getenv("API_URL", "http://backend:8000")

@pytest.fixture(scope="module")
def safe_recipe():
    """
    Creates a unique recipe for these tests.
    This ensures that querying by recipe_id only returns OUR test data,
    so we don't accidentally see or modify user data.
    """
    unique_suffix = str(uuid.uuid4())[:8]
    recipe_payload = {
        "title": f"Safe Boundary Test {unique_suffix}",
        "description": "Integration Test - Should not touch user data",
        "ingredients": [],
        "portions": 1,
        "category": "breakfast"
    }
    r = requests.post(f"{BASE_URL}/recipes/", json=recipe_payload)
    if r.status_code != 200:
        pytest.fail(f"Could not create test recipe: {r.text}")
    
    recipe = r.json()
    yield recipe
    
    # Cleanup: Delete the recipe
    # Note: Depending on backend, this MIGHT cascade delete plan items (good for cleanup)
    # OR leave them orphaned. We should probably clean up plan items first to be safe.
    requests.delete(f"{BASE_URL}/recipes/{recipe['id']}")

def test_week_filtering_boundaries(safe_recipe):
    """
    Scenario: Verify that requesting a specific week range ONLY returns items within that range.
    SAFE VERSION: Uses a unique recipe ID to filter results, avoiding user data.
    """
    recipe_id = safe_recipe['id']
    created_item_ids = []

    # Helper to add plan item
    def add_item(date_str, day, meal):
        payload = {
            "day_of_week": day,
            "meal_type": meal,
            "recipe_id": recipe_id,
            "portions": 1,
            "date": date_str
        }
        res = requests.post(f"{BASE_URL}/plan/", json=payload)
        assert res.status_code == 200, f"Failed to add item: {res.text}"
        item = res.json()
        created_item_ids.append(item['id'])
        return item

    # Dates
    last_sunday = "2026-02-01"
    this_monday = "2026-02-02"
    this_sunday = "2026-02-08"
    next_monday = "2026-02-09"

    try:
        # Add items
        add_item(last_sunday, "Воскресенье", "breakfast")
        add_item(this_monday, "Понедельник", "lunch")
        add_item(this_sunday, "Воскресенье", "dinner")
        add_item(next_monday, "Понедельник", "breakfast")

        # 2. Query Range (Feb 2 - Feb 8)
        # Verify that ONLY items in this range with OUR recipe are returned.
        res = requests.get(f"{BASE_URL}/plan/?start_date={this_monday}&end_date={this_sunday}")
        assert res.status_code == 200
        data = res.json()
        
        # Filter: Only look at items for OUR test recipe
        test_data = [x for x in data if x.get('recipe_id') == recipe_id]
        
        dates = [x['date'] for x in test_data]
        print(f"Returned dates for test recipe: {dates}")
        
        assert last_sunday not in dates, f"{last_sunday} Should be excluded"
        assert this_monday in dates, f"{this_monday} Should be included"
        assert this_sunday in dates, f"{this_sunday} Should be included"
        assert next_monday not in dates, f"{next_monday} Should be excluded"
        
    finally:
        # cleanup plan items
        for pid in created_item_ids:
            requests.delete(f"{BASE_URL}/plan/{pid}")

def test_date_integrity(safe_recipe):
    """
    Verify date persistence via API in a safe way.
    """
    recipe_id = safe_recipe['id']
    target_date = "2026-05-15" # Far future date unlikely to conflict, but we use ID anyway
    
    payload = {
        "day_of_week": "Пятница",
        "meal_type": "lunch",
        "recipe_id": recipe_id,
        "portions": 1,
        "date": target_date
    }
    
    # POST
    resp = requests.post(f"{BASE_URL}/plan/", json=payload)
    assert resp.status_code == 200
    saved = resp.json()
    saved_id = saved['id']
    
    try:
        assert saved['date'] == target_date
        
        # GET
        resp = requests.get(f"{BASE_URL}/plan/?start_date={target_date}&end_date={target_date}")
        items = resp.json()
        
        # Find our item by ID
        found_item = next((i for i in items if i['id'] == saved_id), None)
        assert found_item is not None, "Item not found in retrieval"
        assert found_item['date'] == target_date
        
    finally:
        requests.delete(f"{BASE_URL}/plan/{saved_id}")

def test_null_date_handling(safe_recipe):
    """
    Verify behavior when sending 'date': None. Use safe recipe.
    """
    recipe_id = safe_recipe['id']
    payload = {
        "day_of_week": "Среда",
        "meal_type": "snack",
        "recipe_id": recipe_id,
        "portions": 1,
        "date": None # Explicit null
    }
    
    resp = requests.post(f"{BASE_URL}/plan/", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    item_id = data['id']
    
    try:
        assert data['date'] is not None, "API should calculate date if missing/null"
        print(f"Calculated date for None input: {data['date']}")
    finally:
        requests.delete(f"{BASE_URL}/plan/{item_id}")
