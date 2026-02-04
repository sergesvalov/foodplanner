import pytest
import requests
import os
import random
import string

BASE_URL = os.getenv("API_URL", "http://backend:8000")

@pytest.fixture
def random_product_data():
    """Generate random product data."""
    name = "TestProduct_" + "".join(random.choices(string.ascii_letters, k=8))
    return {
        "name": name,
        "price": 9.99,
        "amount": 1.0,
        "unit": "kg",
        "calories": 100.0,
        "proteins": 10.0,
        "fats": 5.0,
        "carbs": 2.0,
        "weight_per_piece": 0.0 # Optional but good to test
    }

def test_create_and_delete_product(random_product_data):
    """Test creating a product and then deleting it."""
    # Create
    resp_create = requests.post(f"{BASE_URL}/products/", json=random_product_data)
    assert resp_create.status_code == 200
    created_product = resp_create.json()
    assert created_product["name"] == random_product_data["name"]
    assert created_product["id"] is not None
    
    product_id = created_product["id"]

    # Verify Get
    resp_get = requests.get(f"{BASE_URL}/products/")
    assert resp_get.status_code == 200
    products = resp_get.json()
    # Ensure our product is in the list
    assert any(p["id"] == product_id for p in products)

    # Delete
    resp_delete = requests.delete(f"{BASE_URL}/products/{product_id}")
    assert resp_delete.status_code == 200
    
    # Verify Deletion
    # Check that it's gone
    resp_get_again = requests.get(f"{BASE_URL}/products/")
    products_after = resp_get_again.json()
    assert not any(p["id"] == product_id for p in products_after)
