import pytest
import requests
import os
import random
import string

BASE_URL = os.getenv("API_URL", "http://backend:8000")

@pytest.fixture
def product_fixture():
    """Create a temporary product to use in recipes."""
    name = "RecipeIngredient_" + "".join(random.choices(string.ascii_letters, k=6))
    data = {
        "name": name,
        "price": 5.0,
        "amount": 1000,
        "unit": "g",
        "calories": 50,
        "proteins": 1, "fats": 1, "carbs": 1
    }
    resp = requests.post(f"{BASE_URL}/products/", json=data)
    assert resp.status_code == 200
    product = resp.json()
    yield product
    # Cleanup
    requests.delete(f"{BASE_URL}/products/{product['id']}")

def test_create_recipe(product_fixture):
    """Test creating a recipe with ingredients."""
    title = "TestRecipe_" + "".join(random.choices(string.ascii_letters, k=8))
    
    recipe_data = {
        "title": title,
        "description": "Auto test recipe",
        "portions": 2,
        "category": "lunch",
        "rating": 5,
        "ingredients": [
            {
                "product_id": product_fixture["id"],
                "quantity": 200
            }
        ]
    }
    
    # Create
    resp = requests.post(f"{BASE_URL}/recipes/", json=recipe_data)
    assert resp.status_code == 200
    created_recipe = resp.json()
    
    assert created_recipe["title"] == title
    assert len(created_recipe["ingredients"]) == 1
    # Schema returns nested product object, not 'product_id' at top level
    assert created_recipe["ingredients"][0]["product"]["id"] == product_fixture["id"]
    
    recipe_id = created_recipe["id"]
    
    # Simple Update
    update_data = recipe_data.copy()
    update_data["title"] = title + "_UPDATED"
    resp_update = requests.put(f"{BASE_URL}/recipes/{recipe_id}", json=update_data)
    assert resp_update.status_code == 200
    assert resp_update.json()["title"] == title + "_UPDATED"
    
    # Delete
    resp_del = requests.delete(f"{BASE_URL}/recipes/{recipe_id}")
    assert resp_del.status_code == 200
    
    # Verify Gone
    resp_list = requests.get(f"{BASE_URL}/recipes/")
    ids = [r["id"] for r in resp_list.json()]
    assert recipe_id not in ids
