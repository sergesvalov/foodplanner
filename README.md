# FoodPlanner (Menu & Recipe Manager)

## 🤖 Context for LLM Analysis
**Project Goal:** A full-stack web application for weekly meal planning, recipe management, and automated cost/calorie calculation.
**Key Architecture:**
* **Backend:** Python (FastAPI) + SQLAlchemy + SQLite.
* **Frontend:** React + Tailwind CSS.
* **Deployment:** Docker Compose (Nginx reverse proxy implied or direct port mapping).
* **Data Flow:** REST API interaction. No client-side state persistence; strict sync with DB.

---

## 🛠 Tech Stack
* **Backend:** FastAPI, Pydantic, SQLAlchemy.
* **Database:** SQLite (`/app/data/menu_planner.db`).
* **Frontend:** React, Vite, Tailwind CSS.
* **Containerization:** Docker, Docker Compose.
* **CI/CD:** Jenkins (Pipeline builds Docker images and deploys via SSH).

---

## 📊 Database Schema & Data Models

### 1. Product (Table: `products`)
Represents a raw ingredient purchased from a store.
* `id`: Integer (PK)
* `name`: String
* `price`: Float (Price per pack/unit in €)
* `unit`: String (e.g., 'kg', 'g', 'pcs', 'l')
* `amount`: Float (The weight or quantity of the pack, e.g., 1000 for 1kg, 10 for 10 eggs). **Crucial for math.**
* `calories`: Float (Calories per whole pack/unit).

### 2. Recipe (Table: `recipes`)
Represents a cooking dish.
* `id`: Integer (PK)
* `title`: String
* `description`: Text (Cooking instructions)
* `created_at`: DateTime
* **Computed Property:** `total_cost` (Sum of ingredients costs).

### 3. RecipeIngredient (Table: `recipe_ingredients`)
Link table between Recipe and Product.
* `id`: Integer (PK)
* `recipe_id`: FK -> recipes.id
* `product_id`: FK -> products.id
* `quantity`: Float (Amount used in the recipe).

### 4. WeeklyPlanEntry (Table: `weekly_plan`)
Represents a slot in the weekly schedule.
* `id`: Integer (PK)
* `day_of_week`: String (Monday...Sunday)
* `meal_type`: String (breakfast, lunch, dinner, snacks...)
* `recipe_id`: FK -> recipes.id

---

## 🧮 Business Logic (Crucial)

### Price Calculation Formula
The cost of an ingredient in a recipe is calculated based on the **unit price** derived from the product's package size.

$$Cost = \left( \frac{\text{Product.price}}{\text{Product.amount}} \right) \times \text{Ingredient.quantity}$$

*Example:*
* Product: "Sugar", Price: 2.00€, Amount: 1000g.
* Recipe uses: 100g.
* Calculation: `(2.00 / 1000) * 100 = 0.20€`.

---

## 🚀 Key Features

### 1. Product Catalog (`/products`)
* CRUD operations for products.
* **Server-side IO:**
    * `Export`: Dumps table to `/app/data/products.json`.
    * `Import`: Reads JSON from server. logic: **Updates** price/amount if name matches, **Creates** if new.

### 2. Recipe Builder (`/recipes`)
* Dynamic ingredient list.
* **Searchable Dropdown:** Custom `ProductSelect` component for filtering ingredients by name.
* **Live Calculation:** Updates total cost and calories in real-time on Frontend.
* **Server-side IO:**
    * Export/Import for `title` and `description` only (ingredients are excluded from JSON sync to avoid ID conflicts).

### 3. Weekly Planner (Home `/`)
* **Grid System:** 7 days x 7 meal slots (Breakfast, Lunch, Dinner + Snacks).
* **Drag & Drop:** Drag recipes from the sidebar into slots.
* **Daily Cost:** Automatically sums up the `total_cost` of all recipes in a specific day column.

---

## 📂 Project Structure

```text
/
├── backend/
│   ├── main.py          # FastAPI app, API Endpoints, Export/Import logic
│   ├── models.py        # SQLAlchemy models (DB Schema)
│   ├── schemas.py       # Pydantic models (Validation, min=0 constraints)
│   ├── database.py      # DB connection
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── RecipeBuilder.jsx      # Form with dynamic inputs & calcs
│   │   │   ├── WeeklyGrid.jsx         # Drag & Drop calendar
│   │   │   └── DraggableRecipeList.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ProductsPage.jsx       # Catalog CRUD + JSON IO
│   │   │   └── RecipesPage.jsx        # Recipe CRUD + JSON IO
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml   # Orchestration
└── Jenkinsfile          # CI/CD Pipeline

🐳 Deployment Info

    Volume Mapping: The database and JSON export files persist on the host machine via Docker volume mapping:

        Host: /opt/foodplanner

        Container: /app/data

    Network: Backend runs on port 8000, Frontend on port 80 (mapped to host 8010).

