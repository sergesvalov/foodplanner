import sys
import os

# Add the parent directory (project root) to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))) # Try to reach far up if nesting is weird
# Also add /app explicitly just in case
if "/app" not in sys.path:
    sys.path.append("/app")
