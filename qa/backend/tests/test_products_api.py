import unittest
import requests
import os

class TestProductsAPI(unittest.TestCase):
    BASE_URL = os.getenv("API_URL", "http://backend:8000")

    def setUp(self):
        self.products_url = f"{self.BASE_URL}/products/"

    def test_get_all_products(self):
        """Test retrieving the list of all products."""
        print(f"\nTesting GET {self.products_url}...")
        try:
            response = requests.get(self.products_url)
            self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}")
            
            data = response.json()
            self.assertIsInstance(data, list, "Response should be a list of products")
            print(f"PASS: Retrieved {len(data)} products.")
            
            if len(data) > 0:
                first_product = data[0]
                self._validate_product_schema(first_product)

        except requests.exceptions.ConnectionError:
            self.fail(f"Could not connect to server at {self.BASE_URL}. Is it running?")

    def test_filter_by_name(self):
        """Test filtering products by name."""
        # First get all products to find a valid name to search for
        try:
            response = requests.get(self.products_url)
            if response.status_code != 200:
                self.skipTest("Could not retrieve products to start filtering test.")
            
            products = response.json()
            if not products:
                self.skipTest("No products available to test filtering.")

            target_product = products[0]
            target_name = target_product['name']
            
            print(f"\nTesting filter by name='{target_name}'...")
            filter_response = requests.get(self.products_url, params={"name": target_name})
            self.assertEqual(filter_response.status_code, 200)
            
            filtered_data = filter_response.json()
            self.assertTrue(len(filtered_data) > 0, "Should find at least one product")
            
            for product in filtered_data:
                self.assertEqual(product['name'], target_name, "Filtered product name should match query")
            
            print(f"PASS: Filter correctly returned products with name '{target_name}'.")

        except requests.exceptions.ConnectionError:
            self.fail(f"Could not connect to server at {self.BASE_URL}")

    def test_filter_non_existent(self):
        """Test filtering with a name that is unlikely to exist."""
        fake_name = "NonExistentProductXYZ123"
        print(f"\nTesting filter by non-existent name='{fake_name}'...")
        
        try:
            response = requests.get(self.products_url, params={"name": fake_name})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data, [], "Should return empty list for non-existent product")
            print("PASS: Correctly returned empty list for non-existent product.")
            
        except requests.exceptions.ConnectionError:
            self.fail(f"Could not connect to server at {self.BASE_URL}")

    def _validate_product_schema(self, product):
        """Helper to validate product structure."""
        required_fields = ["id", "name", "price", "unit", "amount", "calories"]
        for field in required_fields:
            self.assertIn(field, product, f"Product missing required field: {field}")
        
        # Check types
        self.assertIsInstance(product["id"], int)
        self.assertIsInstance(product["name"], str)
        self.assertTrue(isinstance(product["price"], (int, float)))

if __name__ == "__main__":
    unittest.main()
