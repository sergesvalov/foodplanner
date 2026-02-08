
import requests
import datetime

BASE_URL = "http://localhost:8000/api"

def test_mock_id_payload():
    # Payload similar to what autoDistribute sends when no family members exist
    payload = [
        {
            "day_of_week": "Понедельник",
            "meal_type": "breakfast",
            "recipe_id": 1,
            "portions": 1,
            "family_member_id": "mock-1",  # This should fail if backend expects int
            "date": datetime.date.today().isoformat()
        }
    ]

    try:
        print(f"Sending payload: {payload}")
        response = requests.post(f"{BASE_URL}/plan/batch", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 422:
            print("SUCCESS: Backend correctly rejected string ID (or failed validation as expected).")
        elif response.status_code == 200:
            print("WARNING: Backend ACCEPTED string ID. This might be okay if logic handles it, but schema says int.")
        else:
            print("ERROR: Unexpected status code.")

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_mock_id_payload()
