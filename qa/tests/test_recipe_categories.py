import pytest
import requests
import os
import random
import string

BASE_URL = os.getenv("API_URL", "http://backend:8000")

def test_recipe_category_lifecycle():
    """
    Verify that categories can be assigned, retrieved, and updated.
    """
    # 1. Create a recipe with a specific category
    title = "CategoryTest_" + "".join(random.choices(string.ascii_letters, k=6))
    category_initial = "breakfast"
    
    recipe_data = {
        "title": title,
        "description": "Testing Categories",
        "portions": 1,
        "category": category_initial,
        "ingredients": []
    }
    
    resp = requests.post(f"{BASE_URL}/recipes/", json=recipe_data)
    assert resp.status_code == 200
    recipe = resp.json()
    
    # Verify creation
    assert recipe["category"] == category_initial, f"Expected {category_initial}, got {recipe['category']}"
    recipe_id = recipe["id"]
    
    try:
        # 2. Update category
        category_updated = "dinner"
        update_data = recipe_data.copy()
        update_data["category"] = category_updated
        
        resp_upd = requests.put(f"{BASE_URL}/recipes/{recipe_id}", json=update_data)
        assert resp_upd.status_code == 200
        recipe_updated = resp_upd.json()
        assert recipe_updated["category"] == category_updated, f"Update failed. Expected {category_updated}, got {recipe_updated['category']}"
        
        # 3. Verify Persistence (GET by ID is implicit in PUT response usually, but let's list)
        resp_list = requests.get(f"{BASE_URL}/recipes/")
        all_recipes = resp_list.json()
        saved_recipe = next((r for r in all_recipes if r["id"] == recipe_id), None)
        assert saved_recipe is not None
        assert saved_recipe["category"] == category_updated
        
    finally:
        # Cleanup
        requests.delete(f"{BASE_URL}/recipes/{recipe_id}")

def test_category_default_value():
    """
    Verify default category is 'other' if not provided.
    """
    title = "DefaultCatTest_" + "".join(random.choices(string.ascii_letters, k=6))
    recipe_data = {
        "title": title,
         # "category" omitted
    }
    # Note: Pydantic schema might require all fields or have defaults. 
    # Schema check: category: str = "other" in RecipeBase.
    
    resp = requests.post(f"{BASE_URL}/recipes/", json=recipe_data)
    assert resp.status_code == 200
    recipe = resp.json()
    
    try:
        assert recipe["category"] == "other", f"Default should be 'other', got {recipe['category']}"
    finally:
         requests.delete(f"{BASE_URL}/recipes/{recipe['id']}")
