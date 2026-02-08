import sys
import os
import pytest

# Try to find 'backend' directory or 'main.py'
current_dir = os.path.dirname(os.path.abspath(__file__))

# Candidates for project root or backend root
paths_to_check = [
    current_dir,
    os.path.join(current_dir, ".."),
    os.path.join(current_dir, "../.."),
    os.path.join(current_dir, "../../.."),
    "/app",
    "/app/backend",
    os.path.join(os.getcwd(), "backend") 
]

found_backend = False

print(f"DEBUG: Searching for main.py from {current_dir}")
for p in paths_to_check:
    abs_p = os.path.abspath(p)
    if os.path.exists(os.path.join(abs_p, "main.py")):
        print(f"DEBUG: Found main.py in {abs_p}")
        if abs_p not in sys.path:
            sys.path.insert(0, abs_p) # Insert at beginning
        found_backend = True
        break

if not found_backend:
    print("DEBUG: Could not find main.py in common locations. Printing sys.path:")
    for p in sys.path:
        print(f" - {p}")
    print(f"DEBUG: Listing current dir {current_dir}: {os.listdir(current_dir)}")
    try:
        print(f"DEBUG: Listing /app: {os.listdir('/app')}")
    except:
        pass
