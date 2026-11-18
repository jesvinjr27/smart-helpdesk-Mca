import os
import sys
import ast
import importlib

# Add project root to sys.path
PROJECT_ROOT = r"c:\smart helpdesk"
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

def verify_all_imports():
    print("=" * 70)
    print("VERIFYING ALL BACKEND APP PYTHON IMPORTS")
    print("=" * 70)

    app_dir = os.path.join(PROJECT_ROOT, "backend", "app")
    errors = []
    scanned_files = 0

    for root, dirs, files in os.walk(app_dir):
        if "__pycache__" in root or ".venv" in root:
            continue
        for file in files:
            if file.endswith(".py"):
                scanned_files += 1
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, PROJECT_ROOT)
                mod_name = rel_path[:-3].replace(os.sep, ".")
                try:
                    importlib.import_module(mod_name)
                except Exception as e:
                    errors.append((rel_path, str(e)))

    print(f"Scanned {scanned_files} application files.")
    if errors:
        print(f"\n[!] Found {len(errors)} import issue(s):")
        for p, err in errors:
            print(f"  - {p}: {err}")
        return False
    else:
        print("\n[+] SUCCESS: All backend modules and dependencies (including SQLAlchemy, FastAPI, Pydantic, Scikit-learn) imported with ZERO errors!")
        return True

if __name__ == "__main__":
    success = verify_all_imports()
    sys.exit(0 if success else 1)
