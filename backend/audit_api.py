import re
from app.main import app

def main():
    backend_routes = []
    for r in app.routes:
        if hasattr(r, 'methods') and hasattr(r, 'path'):
            for m in r.methods:
                backend_routes.append((m, r.path))

    print(f"Total Backend Registered Routes: {len(backend_routes)}")

    with open("../frontend/src/services/api.js", "r", encoding="utf-8") as f:
        fe_lines = f.readlines()

    frontend_calls = []
    for line in fe_lines:
        line_clean = line.strip()
        if "request(" in line_clean and not line_clean.startswith("//") and not line_clean.startswith("async function request"):
            # extract path
            path_match = re.search(r"request\(['\"`]([^'\"`]+)['\"`]", line_clean)
            if path_match:
                path = path_match.group(1)
                # extract method
                method_match = re.search(r"method:\s*['\"]([A-Z]+)['\"]", line_clean)
                method = method_match.group(1) if method_match else "GET"
                frontend_calls.append((method, path, line_clean))

    print(f"Total Frontend API Calls Identified: {len(frontend_calls)}")
    print("\n--- DETAILED FRONTEND TO BACKEND MAPPING AUDIT ---")
    
    missing = []
    for m, p, raw in frontend_calls:
        # strip query params & template interpolation queries
        norm_path = p.split("?")[0].split("${params")[0]
        # replace ${id} or ${admin_id} or ${params ? ...} with clean param
        norm_path = re.sub(r"\$\{[^}]+\}", "{id}", norm_path)
        # if any trailing artifacts
        norm_path = norm_path.replace("{id}/", "test_id_123/")
        full_path = "/api" + norm_path

        matched = False
        for b_method, b_path in backend_routes:
            if b_method == m:
                # normalize backend path params {service_id}, {id}, {booking_id} to regex
                pattern = "^" + re.sub(r"\{[^}]+\}", "[^/]+", b_path) + "$"
                test_path = re.sub(r"\{id\}", "test_id_123", full_path)
                if re.match(pattern, test_path):
                    matched = True
                    break
        
        status = "PASSED" if matched else "FAILED / MISSING"
        print(f"[{m:<6}] {full_path:<35} -> {status}")
        if not matched:
            missing.append((m, full_path, raw))

    print("\n" + "="*50)
    if missing:
        print(f"WARNING: Found {len(missing)} unmatched API calls:")
        for m, p, raw in missing:
            print(f"  - [{m}] {p} (from: {raw})")
    else:
        print("ALL FRONTEND API CALLS PERFECTLY MATCH FASTAPI BACKEND ROUTES! (100% COVERAGE)")
    print("="*50)

if __name__ == "__main__":
    main()
