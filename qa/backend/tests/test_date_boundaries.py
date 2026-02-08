import pytest
import requests
import os
import datetime

# Configuration
BASE_URL = os.getenv("API_URL", "http://backend:8000")

def test_week_filtering_boundaries():
    """
    Scenario: Verify that requesting a specific week range ONLY returns items within that range.
    We will:
    1. Clear the plan for a specific range to ensure clean state.
    2. Add items:
       - Last Sunday (Feb 1)
       - This Monday (Feb 2)
       - This Sunday (Feb 8)
       - Next Monday (Feb 9)
    3. Query for "Current Week" (Feb 2 - Feb 8) and verify exclusions.
    """
    
    # 1. Setup Data via API
    # We need a valid recipe ID. Let's fetch one or create one.
    # Assuming at least one recipe exists (seeded or created by other tests).
    # Or create one for robustness.
    
    recipe_payload = {
        "title": "API Boundary Test Recipe",
        "description": "Test",
        "ingredients": [],
        "portions": 1,
        "category": "breakfast"
    }
    r = requests.post(f"{BASE_URL}/recipes/", json=recipe_payload)
    if r.status_code == 200:
        recipe_id = r.json()['id']
    else:
        # Fallback to fetching existing
        recipes = requests.get(f"{BASE_URL}/recipes/").json()
        if not recipes:
             pytest.skip("No recipes available to run test")
        recipe_id = recipes[0]['id']

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
        return res.json()

    # Dates
    last_sunday = "2026-02-01"
    this_monday = "2026-02-02"
    this_sunday = "2026-02-08"
    next_monday = "2026-02-09"

    # Clean up potentially conflicting items in this broad range first?
    # DELETE /plan/?start_date=...&end_date=...
    # (Assuming clear_plan endpoint exists as per routers/plan.py)
    requests.delete(f"{BASE_URL}/plan/?start_date={last_sunday}&end_date={next_monday}")

    # Add items
    add_item(last_sunday, "Воскресенье", "breakfast")
    add_item(this_monday, "Понедельник", "lunch")
    add_item(this_sunday, "Воскресенье", "dinner")
    add_item(next_monday, "Понедельник", "breakfast")

    # 2. Query Range (Feb 2 - Feb 8)
    res = requests.get(f"{BASE_URL}/plan/?start_date={this_monday}&end_date={this_sunday}")
    assert res.status_code == 200
    data = res.json()
    
    dates = [x['date'] for x in data]
    print(f"Returned dates: {dates}")
    
    assert last_sunday not in dates, f"{last_sunday} Should be excluded"
    assert this_monday in dates, f"{this_monday} Should be included"
    assert this_sunday in dates, f"{this_sunday} Should be included"
    assert next_monday not in dates, f"{next_monday} Should be excluded"

def test_date_integrity():
    """
    Verify date persistence via API.
    """
    # Get recipe
    recipes = requests.get(f"{BASE_URL}/recipes/").json()
    if not recipes:
         pytest.skip("No recipes available")
    recipe_id = recipes[0]['id']
    
    target_date = "2026-05-15"
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
    assert saved['date'] == target_date
    
    # GET
    resp = requests.get(f"{BASE_URL}/plan/?start_date={target_date}&end_date={target_date}")
    items = resp.json()
    
    # Find our item
    found = False
    for i in items:
        if i['id'] == saved['id']:
             assert i['date'] == target_date
             found = True
             break
    assert found, "Item not found in retrieval"

def test_null_date_exclusion():
    """
    Verify that if we somehow insert a NULL date (or omit it), 
    it doesn't appear in date-filtered query.
    Note: Via API, 'date' might be optional or calculated.
    If we omit 'date', backend calculates it based on 'day_of_week' relative to TODAY.
    So we can't easily force NULL via API unless we send explicit null and schema allows it.
    Schema PlanItemCreate: date: Optional[date] = None. 
    Router: if not calculated_date: calculated_date = get_date_for_day_of_week(...)
    So backend forces a date! 
    The ONLY way to have NULL date is DB corruption or manual SQL injection, 
    which we can't test via API easily.
    
    HOWEVER, we can verify that sending explicit None results in a calculated date,
    NOT a null date.
    """
    
    recipes = requests.get(f"{BASE_URL}/recipes/").json()
    if not recipes: return
    recipe_id = recipes[0]['id']
    
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
    
    assert data['date'] is not None, "API should calculate date if missing/null"
    print(f"Calculated date for None input: {data['date']}")
