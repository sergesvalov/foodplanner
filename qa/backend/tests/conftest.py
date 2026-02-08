import sys
import os
import pytest

# Try to find 'backend' code
current_test_dir = os.path.dirname(os.path.abspath(__file__))

# 1. Check if we are in a standard location
# Candidates for project root or backend root
possible_roots = [
    "/app",
    "/app/backend",
    os.path.abspath(os.path.join(current_test_dir, "..")), 
    os.path.abspath(os.path.join(current_test_dir, "../..")),
    os.path.abspath(os.path.join(current_test_dir, "../../..")),
]

found_path = None
for root in possible_roots:
    if os.path.exists(os.path.join(root, "main.py")):
        found_path = root
        break

if found_path:
    if found_path not in sys.path:
        sys.path.insert(0, found_path)
    print(f"DEBUG: Found main.py in {found_path}, added to sys.path")
else:
    # If we are in the QA Docker container, this is EXPECTED behavior.
    # The backend code main.py is NOT mounted in the QA container.
    # The tests should use requests to talk to the backend service.
    debug_msg = ["Could not find main.py in common locations. Assuming INTEGRATION TEST mode."]
    debug_msg.append(f"Current Test Dir: {current_test_dir}")
    print("\nDEBUG: " + "\nDEBUG: ".join(debug_msg))
