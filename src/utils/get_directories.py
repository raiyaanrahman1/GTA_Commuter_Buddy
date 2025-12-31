from pathlib import Path

# Get the directory where this script (get_directories) is located
UTILS_DIR = Path(__file__).resolve().parent

# Define the repository root (one level up from src/)
ROOT_DIR = UTILS_DIR.parent.parent

# Define the intermediate_results directory (sibling of src/)
INTERMEDIATE_RESULTS_DIR = ROOT_DIR / "intermediate_results"

# Ensure the intermediate_results directory exists (create it if needed)
INTERMEDIATE_RESULTS_DIR.mkdir(parents=True, exist_ok=True)