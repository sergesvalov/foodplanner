import pytest
import requests
import os

# Configuration
# Default to localhost if not set, but in docker-compose it will be 'backend' usually 
# or passed via env var.
BASE_URL = os.getenv("API_URL", "http://backend:8000")

def test_health_check():
    """Verify the API is reachable."""
    try:
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "message": "FoodPlanner API is running"}
    except requests.exceptions.ConnectionError:
        pytest.fail(f"Could not connect to API at {BASE_URL}")

def test_get_recipes():
    """Verify recipes endpoint returns a list."""
    response = requests.get(f"{BASE_URL}/recipes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_products():
    """Verify products endpoint returns a list."""
    response = requests.get(f"{BASE_URL}/products/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_plan():
    """Verify plan endpoint works."""
    response = requests.get(f"{BASE_URL}/plan/")
    assert response.status_code == 200
    # Provide helpful error message if schema doesn't match
    data = response.json()
    assert isinstance(data, (list, dict)), f"Expected list or dict, got {type(data)}"
