import sqlite3

def migrate():
    # Path to your database file
    db_path = "/app/data/foodplanner.db"
    
    if not db_path:
        print("Database path not found")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns = [
        ("max_proteins", "INTEGER DEFAULT 135"),
        ("max_fats", "INTEGER DEFAULT 100"),
        ("max_carbs", "INTEGER DEFAULT 300")
    ]

    for col_name, col_def in columns:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE family_members ADD COLUMN {col_name} {col_def}")
            print(f"Column {col_name} added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
