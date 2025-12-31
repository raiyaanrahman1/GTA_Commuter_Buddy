from pathlib import Path

# Get the directory where this script (main.py) is located
SCRIPT_DIR = Path(__file__).resolve().parent

# Define the repository root (one level up from src/)
# ROOT_DIR = SCRIPT_DIR.parent
ROOT_DIR = SCRIPT_DIR

# Define the intermediate_results directory (sibling of src/)
INTERMEDIATE_RESULTS_DIR = ROOT_DIR / "intermediate_results"

# Ensure the intermediate_results directory exists (create it if needed)
INTERMEDIATE_RESULTS_DIR.mkdir(parents=True, exist_ok=True)