import pytest
import requests
import uuid
import os

# --- Config ---
BASE_URL = os.environ.get("API_URL", "http://menu_backend:8000")

def test_products_crud_and_recipe_creation():
    """
    Verifies the user flow for managing products:
    1. Create Product
    2. Read Product List & Verify
    3. Update Product
    4. Create Recipe from Product (special action)
    5. Delete Product
    """

    # 1. Create Product
    prod_name = f"TestProd_{uuid.uuid4().hex[:6]}"
    res_create = requests.post(f"{BASE_URL}/products/", json={
        "name": prod_name,
        "price": 1.50,
        "amount": 100,
        "unit": "g",
        "calories": 250,
        "proteins": 10.5,
        "fats": 5.0,
        "carbs": 30.0
    })
    
    assert res_create.status_code == 200
    product = res_create.json()
    product_id = product["id"]
    assert product["name"] == prod_name
    assert product["price"] == 1.50

    try:
        # 2. Read Product List
        res_list = requests.get(f"{BASE_URL}/products/")
        assert res_list.status_code == 200
        items = res_list.json()
        assert any(p["id"] == product_id for p in items)

        # 3. Update Product
        updated_name = f"{prod_name}_Updated"
        res_update = requests.put(f"{BASE_URL}/products/{product_id}", json={
            "name": updated_name,
            "price": 2.00,
            "amount": 200,
            "unit": "g"
        })
        assert res_update.status_code == 200
        updated_product = res_update.json()
        assert updated_product["name"] == updated_name
        assert updated_product["price"] == 2.00

        # 4. Create Recipe from Product (Simulate Frontend Logic)
        # Frontend logic calls: POST /recipes/ with the product as ingredient
        res_recipe = requests.post(f"{BASE_URL}/recipes/", json={
            "title": updated_name,
            "description": "Автоматически создано из продукта",
            "category": "other",
            "portions": 1,
            "ingredients": [
                {
                    "product_id": product_id,
                    "quantity": 200
                }
            ]
        })
        assert res_recipe.status_code == 200
        recipe = res_recipe.json()
        recipe_id = recipe["id"]
        
        assert recipe["title"] == updated_name
        assert len(recipe["ingredients"]) == 1
        assert recipe["ingredients"][0]["product"]["id"] == product_id

        # Cleanup Recipe
        requests.delete(f"{BASE_URL}/recipes/{recipe_id}")

    finally:
        # 5. Delete Product
        res_delete = requests.delete(f"{BASE_URL}/products/{product_id}")
        assert res_delete.status_code == 200
        
        # Verify Deletion
        res_check = requests.get(f"{BASE_URL}/products/{product_id}")
        assert res_check.status_code == 404
