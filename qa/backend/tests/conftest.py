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
    # DEBUGGING: If we can't find it, we MUST know why
    debug_msg = ["Could not find main.py in common locations."]
    debug_msg.append(f"Current Test Dir: {current_test_dir}")
    debug_msg.append(f"Sys Path: {sys.path}")
    
    try:
        debug_msg.append(f"Listing /app: {os.listdir('/app')}")
    except Exception as e:
        debug_msg.append(f"Could not list /app: {e}")
        
    try:
        debug_msg.append(f"Listing /app/backend: {os.listdir('/app/backend')}")
    except Exception:
        pass
        
    try:
        debug_msg.append(f"Listing current dir {current_test_dir}: {os.listdir(current_test_dir)}")
    except Exception:
        pass
        
    # Raise error to show this message in logs
    raise RuntimeError("\n".join(debug_msg))
