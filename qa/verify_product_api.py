import requests
import sys

BASE_URL = "http://localhost:8000"

def check_products():
    print(f"Checking API at {BASE_URL}...")
    
    # 1. Get all products
    try:
        response = requests.get(f"{BASE_URL}/products/")
        response.raise_for_status()
        products = response.json()
        print(f"PASS: Successfully retrieved {len(products)} products.")
        
        if len(products) > 0:
            first_product = products[0]
            required_fields = ["name", "price", "calories", "proteins", "fats", "carbs"]
            missing_fields = [field for field in required_fields if field not in first_product]
            if missing_fields:
                print(f"FAIL: Missing fields in product response: {missing_fields}")
                sys.exit(1)
            print("PASS: Product structure is correct.")
            
            # 2. Filter by name using the first product's name
            search_name = first_product["name"]
            print(f"Testing filter with name: '{search_name}'...")
            response = requests.get(f"{BASE_URL}/products/", params={"name": search_name})
            response.raise_for_status()
            filtered_products = response.json()
            
            found = False
            for p in filtered_products:
                if p["name"] == search_name:
                    found = True
                    break
            
            if found:
                print(f"PASS: Successfully found product by name '{search_name}'.")
            else:
                print(f"FAIL: Product '{search_name}' not found when filtering.")
                sys.exit(1)
                
    except requests.exceptions.ConnectionError:
        print("FAIL: Could not connect to the server. Is it running?")
        sys.exit(1)
    except Exception as e:
        print(f"FAIL: Error during test: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_products()
