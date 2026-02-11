# Product API Documentation

This API allows you to retrieve the list of products from the FoodPlanner database. You can download all products at once or filter them by name.

## Base URL
Depending on your deployment, the base URL is typically:
`http://localhost:8000`

## Endpoint: Get Products

### `GET /products/`

Retrieves a list of products.

### `POST /products/import`

Imports products from an external service (`http://192.168.10.222:8010/products/`).
Updates existing products by name and creates new ones if they don't exist.

**Response:**
Returns a JSON object with:
- `message`: Status message
- `created`: Number of new products created
- `updated`: Number of existing products updated

### Parameters

| Name | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` (optional) | Filter products by name. Performs a case-insensitive partial match. |

### Response

Returns a JSON array of product objects. Each object contains the following fields:

- `name`: Name of the product (string)
- `price`: Price of the product (float)
- `calories`: Calories per 100g/ml (float)
- `proteins`: Proteins per 100g/ml (float, optional)
- `fats`: Fats per 100g/ml (float, optional)
- `carbs`: Carbs per 100g/ml (float, optional)
- `unit`: Unit of measurement (string, e.g., "kg", "l", "pcs")
- `amount`: Amount in one unit (float)

### Examples

#### 1. Download All Products

**Request:**
```bash
curl -X 'GET' 'http://localhost:8000/products/' -H 'accept: application/json'
```

**Response:**
```json
[
  {
    "name": "Apple",
    "price": 1.5,
    "unit": "kg",
    "amount": 1,
    "calories": 52,
    "proteins": 0.3,
    "fats": 0.2,
    "carbs": 14,
    "weight_per_piece": 0.15,
    "id": 1
  },
  {
    "name": "Milk",
    "price": 0.99,
    "unit": "l",
    "amount": 1,
    "calories": 42,
    "proteins": 3.4,
    "fats": 1,
    "carbs": 5,
    "weight_per_piece": null,
    "id": 2
  }
]
```

#### 2. Download Product by Name

**Request:**
```bash
curl -X 'GET' 'http://localhost:8000/products/?name=Apple' -H 'accept: application/json'
```

**Response:**
```json
[
  {
    "name": "Apple",
    "price": 1.5,
    "unit": "kg",
    "amount": 1,
    "calories": 52,
    "proteins": 0.3,
    "fats": 0.2,
    "carbs": 14,
    "weight_per_piece": 0.15,
    "id": 1
  }
]
```

## Using with Python

You can use the `requests` library to download products:

```python
import requests

# Get all products
response = requests.get('http://localhost:8000/products/')
products = response.json()
print(f"Total products: {len(products)}")

# Get specific product
response = requests.get('http://localhost:8000/products/', params={'name': 'Apple'})
apple_products = response.json()
print("Found products:", apple_products)
```
