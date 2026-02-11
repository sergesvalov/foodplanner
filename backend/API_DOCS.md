# Product API Documentation

This API allows you to retrieve the list of products from the FoodPlanner database. You can download all products at once or filter them by name.

## Base URL
Depending on your deployment, the base URL is typically:
- **Local access**: `http://localhost:8000`
- **From local network**: `http://<server-ip>:8000` (e.g., `http://192.168.1.100:8000`)

### Network Access Configuration
To allow access from other devices in your local network, ensure that `docker-compose.yml` has the backend port configured as:
```yaml
ports:
  - "0.0.0.0:8000:8000"
```

If you cannot access the API from another device:
1. Check that the port is open in the firewall:
   ```bash
   sudo ufw allow 8000/tcp
   ```
2. Find your server's IP address:
   ```bash
   hostname -I
   # or
   ip addr show
   ```
3. Test from another device:
   ```bash
   curl http://<server-ip>:8000/
   ```

## Endpoint: Get Products

### `GET /products/`

Retrieves a list of products.

### `POST /products/import`

Imports products from an external service.

**External Service URL:**
```
http://192.168.10.222:8000/products/
```
> **Note:** Port 8000 is the Backend API. Do not confuse with port 8010 which is the Frontend.

**Behavior:**
- Updates existing products by name (case-sensitive match)
- Creates new products if they don't exist in the database
- Skips products with missing required fields
- Provides detailed logging for diagnostics

**Response:**
Returns a JSON object with:
- `message`: Human-readable status message with statistics
- `created`: Number of new products created (integer)
- `updated`: Number of existing products updated (integer)
- `skipped`: Number of products skipped due to errors (integer)

**Example Response:**
```json
{
  "message": "Создано: 5, Обновлено: 38, Пропущено: 2",
  "created": 5,
  "updated": 38,
  "skipped": 2
}
```

**Example Request:**
```bash
curl -X 'POST' 'http://localhost:8000/products/import' -H 'accept: application/json'
```

**Error Handling:**
The endpoint may return errors in the following cases:
- External service is unreachable (timeout, connection error)
- External service returns non-200 status code
- Data format is invalid or cannot be parsed

**Example Error Response:**
```json
{
  "detail": "Ошибка соединения с внешним API: Connection timeout"
}
```

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

**Request (localhost):**
```bash
curl -X 'GET' 'http://localhost:8000/products/' -H 'accept: application/json'
```

**Request (from local network):**
```bash
curl -X 'GET' 'http://192.168.1.100:8000/products/' -H 'accept: application/json'
# Replace 192.168.1.100 with your server's IP address
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

You can use the `requests` library to interact with the API:

### Get Products

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

### Import Products

```python
import requests

# Import products from external service
response = requests.post('http://localhost:8000/products/import')
result = response.json()

if response.status_code == 200:
    print(f"Import successful!")
    print(f"Created: {result['created']}")
    print(f"Updated: {result['updated']}")
    print(f"Skipped: {result['skipped']}")
else:
    print(f"Error: {result.get('detail', 'Unknown error')}")
```

## Troubleshooting

### Import Not Working

If product import fails, check:

1. **External service is accessible:**
   ```bash
   curl http://192.168.10.222:8000/products/
   ```

2. **Correct port (8000 for Backend, not 8010):**
   - Port 8000 = Backend API (FastAPI)
   - Port 8010 = Frontend (React/Vue)

3. **Check backend logs** for detailed error messages:
   ```bash
   docker-compose logs backend
   ```

4. **Verify external service format** - it should return an array of products:
   ```json
   [
     {
       "name": "Product Name",
       "price": 1.5,
       "unit": "kg",
       "amount": 1.0,
       "calories": 52,
       "proteins": 0.3,
       "fats": 0.2,
       "carbs": 14,
       "weight_per_piece": 0.15
     }
   ]
   ```
