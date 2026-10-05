#!/usr/bin/env python3
"""
MOMENTIS Phase 2 Backend API Tests
Tests Auth, Projects, Guests, RSVP, and Public APIs
"""
import requests
import json
import uuid
import time
from datetime import datetime

# Base URL from .env
BASE_URL = "https://ozel-anlar-tasarimi.preview.emergentagent.com/api"

# Test results tracking
results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name, details=""):
    results["passed"].append(test_name)
    print(f"✅ PASS: {test_name}")
    if details:
        print(f"   {details}")

def log_fail(test_name, details=""):
    results["failed"].append(test_name)
    print(f"❌ FAIL: {test_name}")
    if details:
        print(f"   {details}")

def log_warning(test_name, details=""):
    results["warnings"].append(test_name)
    print(f"⚠️  WARNING: {test_name}")
    if details:
        print(f"   {details}")

# Session for cookie management
session = requests.Session()

print("="*80)
print("MOMENTIS PHASE 2 BACKEND API TESTS")
print("="*80)
print()

# ============================================================================
# 1. AUTH TESTS
# ============================================================================
print("\n" + "="*80)
print("1. AUTH API TESTS")
print("="*80)

# 1.1 Register new user with unique email
print("\n--- 1.1 POST /api/auth/register (valid) ---")
try:
    unique_email = f"test_{uuid.uuid4().hex[:8]}@momentis.test"
    register_data = {
        "name": "Test User",
        "email": unique_email,
        "password": "Test1234!"
    }
    resp = session.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 201:
        data = resp.json()
        if "user" in data and data["user"].get("id") and data["user"].get("email") == unique_email:
            if data["user"].get("auth_provider") == "password":
                if "password_hash" not in data["user"]:
                    if "momentis_session" in session.cookies:
                        new_user_id = data["user"]["id"]
                        new_user_email = unique_email
                        log_pass("Register: 201 with user object, uuid, email, auth_provider=password, no password_hash, cookie set")
                    else:
                        log_fail("Register: Cookie not set", f"Response: {data}")
                else:
                    log_fail("Register: password_hash exposed in response", f"Response: {data}")
            else:
                log_fail("Register: auth_provider not 'password'", f"Got: {data['user'].get('auth_provider')}")
        else:
            log_fail("Register: Invalid user object", f"Response: {data}")
    else:
        log_fail(f"Register: Expected 201, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Register: Exception", str(e))

# 1.2 Register duplicate email
print("\n--- 1.2 POST /api/auth/register (duplicate email) ---")
try:
    resp = session.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 409:
        log_pass("Register duplicate: 409 Conflict")
    else:
        log_fail(f"Register duplicate: Expected 409, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Register duplicate: Exception", str(e))

# 1.3 Register short password
print("\n--- 1.3 POST /api/auth/register (short password) ---")
try:
    resp = session.post(f"{BASE_URL}/auth/register", json={
        "name": "Test",
        "email": f"test_{uuid.uuid4().hex[:8]}@momentis.test",
        "password": "123"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("Register short password: 400 Bad Request")
    else:
        log_fail(f"Register short password: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Register short password: Exception", str(e))

# 1.4 Register invalid email
print("\n--- 1.4 POST /api/auth/register (invalid email) ---")
try:
    resp = session.post(f"{BASE_URL}/auth/register", json={
        "name": "Test",
        "email": "not-an-email",
        "password": "Test1234!"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("Register invalid email: 400 Bad Request")
    else:
        log_fail(f"Register invalid email: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Register invalid email: Exception", str(e))

# 1.5 Logout to clear session
print("\n--- 1.5 POST /api/auth/logout ---")
try:
    resp = session.post(f"{BASE_URL}/auth/logout")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        log_pass("Logout: 200 OK")
    else:
        log_fail(f"Logout: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Logout: Exception", str(e))

# 1.6 Login with test user
print("\n--- 1.6 POST /api/auth/login (test@momentis.app) ---")
try:
    login_data = {
        "email": "test@momentis.app",
        "password": "Test1234!"
    }
    resp = session.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        if "user" in data and "momentis_session" in session.cookies:
            test_user_id = data["user"]["id"]
            log_pass("Login test user: 200 with cookie")
        else:
            log_fail("Login test user: Missing user or cookie", f"Response: {data}")
    else:
        log_fail(f"Login test user: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Login test user: Exception", str(e))

# 1.7 Login wrong password
print("\n--- 1.7 POST /api/auth/login (wrong password) ---")
try:
    session2 = requests.Session()
    resp = session2.post(f"{BASE_URL}/auth/login", json={
        "email": "test@momentis.app",
        "password": "WrongPassword123!"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 401:
        log_pass("Login wrong password: 401 Unauthorized")
    else:
        log_fail(f"Login wrong password: Expected 401, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Login wrong password: Exception", str(e))

# 1.8 GET /api/auth/me with cookie
print("\n--- 1.8 GET /api/auth/me (with cookie) ---")
try:
    resp = session.get(f"{BASE_URL}/auth/me")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        if "user" in data and data["user"].get("email") == "test@momentis.app":
            log_pass("GET /me with cookie: 200 with user")
        else:
            log_fail("GET /me with cookie: Invalid response", f"Response: {data}")
    else:
        log_fail(f"GET /me with cookie: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /me with cookie: Exception", str(e))

# 1.9 GET /api/auth/me without cookie
print("\n--- 1.9 GET /api/auth/me (without cookie) ---")
try:
    session_no_auth = requests.Session()
    resp = session_no_auth.get(f"{BASE_URL}/auth/me")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 401:
        log_pass("GET /me without cookie: 401 Unauthorized")
    else:
        log_fail(f"GET /me without cookie: Expected 401, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /me without cookie: Exception", str(e))

# 1.10 Logout and verify
print("\n--- 1.10 POST /api/auth/logout and verify ---")
try:
    resp = session.post(f"{BASE_URL}/auth/logout")
    print(f"Logout status: {resp.status_code}")
    if resp.status_code == 200:
        # Verify cookie cleared by checking /me
        resp2 = session.get(f"{BASE_URL}/auth/me")
        print(f"GET /me after logout status: {resp2.status_code}")
        if resp2.status_code == 401:
            log_pass("Logout clears cookie: subsequent /me returns 401")
        else:
            log_fail(f"Logout: Cookie not cleared, /me returned {resp2.status_code}")
    else:
        log_fail(f"Logout: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Logout verification: Exception", str(e))

# 1.11 Google exchange - missing sessionId
print("\n--- 1.11 POST /api/auth/google/exchange (missing sessionId) ---")
try:
    resp = session.post(f"{BASE_URL}/auth/google/exchange", json={})
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("Google exchange empty body: 400 Bad Request")
    else:
        log_fail(f"Google exchange empty: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Google exchange empty: Exception", str(e))

# 1.12 Google exchange - invalid sessionId
print("\n--- 1.12 POST /api/auth/google/exchange (invalid sessionId) ---")
try:
    resp = session.post(f"{BASE_URL}/auth/google/exchange", json={"sessionId": "invalid-xyz-12345"})
    print(f"Status: {resp.status_code}")
    if resp.status_code in [401, 502]:
        log_pass(f"Google exchange invalid: {resp.status_code} ({'upstream rejects' if resp.status_code == 401 else 'network/upstream error'})")
    else:
        log_fail(f"Google exchange invalid: Expected 401 or 502, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("Google exchange invalid: Exception", str(e))

# 1.13 Rate limiting test (optional - 5 wrong attempts)
print("\n--- 1.13 Rate limiting test (5 wrong password attempts) ---")
try:
    # Register a fresh user for rate limit test
    rate_test_email = f"ratetest_{uuid.uuid4().hex[:8]}@momentis.test"
    session_rate = requests.Session()
    resp = session_rate.post(f"{BASE_URL}/auth/register", json={
        "name": "Rate Test",
        "email": rate_test_email,
        "password": "Test1234!"
    })
    if resp.status_code == 201:
        # Logout
        session_rate.post(f"{BASE_URL}/auth/logout")
        
        # Try 6 wrong passwords
        for i in range(6):
            resp = session_rate.post(f"{BASE_URL}/auth/login", json={
                "email": rate_test_email,
                "password": f"Wrong{i}"
            })
            print(f"  Attempt {i+1}: {resp.status_code}")
            if i < 5:
                if resp.status_code != 401:
                    log_fail(f"Rate limit: Attempt {i+1} should be 401, got {resp.status_code}")
                    break
            else:
                if resp.status_code == 429:
                    log_pass("Rate limiting: 6th attempt returns 429 Too Many Requests")
                else:
                    log_warning(f"Rate limiting: 6th attempt returned {resp.status_code} instead of 429", "May not be implemented or IP-based")
    else:
        log_warning("Rate limiting: Could not create test user", f"Status: {resp.status_code}")
except Exception as e:
    log_warning("Rate limiting test: Exception", str(e))

# Re-login as new user for project tests
print("\n--- Re-login as new registered user for project tests ---")
try:
    session = requests.Session()
    resp = session.post(f"{BASE_URL}/auth/register", json={
        "name": "Zeynep Yılmaz",
        "email": f"zeynep_{uuid.uuid4().hex[:8]}@momentis.test",
        "password": "Test1234!"
    })
    if resp.status_code == 201:
        project_test_user = resp.json()["user"]
        print(f"✓ Logged in as: {project_test_user['email']}")
    else:
        print(f"✗ Failed to create project test user: {resp.status_code}")
        raise Exception("Cannot proceed without authenticated user")
except Exception as e:
    print(f"✗ Exception during user creation: {e}")
    raise

# ============================================================================
# 2. PROJECTS API TESTS
# ============================================================================
print("\n" + "="*80)
print("2. PROJECTS API TESTS")
print("="*80)

# 2.1 GET /api/projects (empty list for new user)
print("\n--- 2.1 GET /api/projects (should be empty) ---")
try:
    resp = session.get(f"{BASE_URL}/projects")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        if "items" in data and isinstance(data["items"], list):
            if len(data["items"]) == 0:
                log_pass("GET /projects: Returns empty list for new user")
            else:
                log_warning("GET /projects: Expected empty list", f"Got {len(data['items'])} items")
        else:
            log_fail("GET /projects: Invalid response structure", f"Response: {data}")
    else:
        log_fail(f"GET /projects: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /projects: Exception", str(e))

# 2.2 POST /api/projects (valid)
print("\n--- 2.2 POST /api/projects (valid) ---")
try:
    project_data = {
        "event_type": "dugun",
        "template_slug": "aurelia",
        "host_a": "Zeynep",
        "host_b": "Mert",
        "date": "2026-06-20",
        "time": "18:30",
        "venue": "Çırağan Sarayı",
        "city": "İstanbul",
        "story": "Hikayemiz 2020 yılında başladı..."
    }
    resp = session.post(f"{BASE_URL}/projects", json=project_data)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 201:
        data = resp.json()
        if "project" in data:
            project = data["project"]
            project_id = project.get("id")
            project_slug = project.get("slug")
            
            checks = []
            checks.append(("id (uuid)", bool(project_id)))
            checks.append(("slug contains 'zeynep-mert'", "zeynep-mert" in project_slug.lower() if project_slug else False))
            checks.append(("url ends with /d/<slug>", project.get("url", "").endswith(f"/d/{project_slug}") if project_slug else False))
            checks.append(("published=true", project.get("published") == True))
            checks.append(("stats present", "stats" in project))
            checks.append(("stats zeros", project.get("stats", {}).get("guest_count") == 0))
            
            all_pass = all(c[1] for c in checks)
            if all_pass:
                log_pass("POST /projects: 201 with valid project", f"slug={project_slug}, id={project_id}")
            else:
                failed_checks = [c[0] for c in checks if not c[1]]
                log_fail("POST /projects: Some checks failed", f"Failed: {failed_checks}")
        else:
            log_fail("POST /projects: No project in response", f"Response: {data}")
    else:
        log_fail(f"POST /projects: Expected 201, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /projects: Exception", str(e))

# 2.3 POST /api/projects (missing host_a)
print("\n--- 2.3 POST /api/projects (missing host_a) ---")
try:
    resp = session.post(f"{BASE_URL}/projects", json={
        "event_type": "dugun",
        "template_slug": "aurelia",
        "date": "2026-06-20"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /projects missing host_a: 400 Bad Request")
    else:
        log_fail(f"POST /projects missing host_a: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /projects missing host_a: Exception", str(e))

# 2.4 POST /api/projects (invalid event_type)
print("\n--- 2.4 POST /api/projects (invalid event_type) ---")
try:
    resp = session.post(f"{BASE_URL}/projects", json={
        "event_type": "invalid_type",
        "template_slug": "aurelia",
        "host_a": "Test",
        "date": "2026-06-20"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /projects invalid event_type: 400 Bad Request")
    else:
        log_fail(f"POST /projects invalid event_type: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /projects invalid event_type: Exception", str(e))

# 2.5 POST /api/projects (invalid template_slug)
print("\n--- 2.5 POST /api/projects (invalid template_slug) ---")
try:
    resp = session.post(f"{BASE_URL}/projects", json={
        "event_type": "dugun",
        "template_slug": "nonexistent-template",
        "host_a": "Test",
        "date": "2026-06-20"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /projects invalid template_slug: 400 Bad Request")
    else:
        log_fail(f"POST /projects invalid template_slug: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /projects invalid template_slug: Exception", str(e))

# 2.6 GET /api/projects/:id
print("\n--- 2.6 GET /api/projects/:id ---")
try:
    resp = session.get(f"{BASE_URL}/projects/{project_id}")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        if "project" in data and "stats" in data["project"]:
            log_pass("GET /projects/:id: 200 with stats")
        else:
            log_fail("GET /projects/:id: Missing project or stats", f"Response: {data}")
    else:
        log_fail(f"GET /projects/:id: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /projects/:id: Exception", str(e))

# 2.7 GET /api/projects/:id (random uuid - 404)
print("\n--- 2.7 GET /api/projects/:id (random uuid) ---")
try:
    random_id = str(uuid.uuid4())
    resp = session.get(f"{BASE_URL}/projects/{random_id}")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 404:
        log_pass("GET /projects/:id random uuid: 404 Not Found")
    else:
        log_fail(f"GET /projects/:id random uuid: Expected 404, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /projects/:id random uuid: Exception", str(e))

# 2.8 GET /api/projects/:id without cookie (401)
print("\n--- 2.8 GET /api/projects/:id (without cookie) ---")
try:
    session_no_auth = requests.Session()
    resp = session_no_auth.get(f"{BASE_URL}/projects/{project_id}")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 401:
        log_pass("GET /projects/:id without cookie: 401 Unauthorized")
    else:
        log_fail(f"GET /projects/:id without cookie: Expected 401, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /projects/:id without cookie: Exception", str(e))

# 2.9 PATCH /api/projects/:id
print("\n--- 2.9 PATCH /api/projects/:id ---")
try:
    patch_data = {
        "venue": "Yeni Mekân",
        "published": False
    }
    resp = session.patch(f"{BASE_URL}/projects/{project_id}", json=patch_data)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        if data.get("project", {}).get("venue") == "Yeni Mekân" and data.get("project", {}).get("published") == False:
            log_pass("PATCH /projects/:id: 200 with updated fields")
            
            # Set published back to true
            resp2 = session.patch(f"{BASE_URL}/projects/{project_id}", json={"published": True})
            if resp2.status_code == 200:
                print("  ✓ Set published back to true")
            else:
                print(f"  ✗ Failed to set published back to true: {resp2.status_code}")
        else:
            log_fail("PATCH /projects/:id: Fields not updated", f"Response: {data}")
    else:
        log_fail(f"PATCH /projects/:id: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("PATCH /projects/:id: Exception", str(e))

# ============================================================================
# 3. GUESTS API TESTS
# ============================================================================
print("\n" + "="*80)
print("3. GUESTS API TESTS")
print("="*80)

# 3.1 POST /api/projects/:id/guests (valid)
print("\n--- 3.1 POST /api/projects/:id/guests (valid) ---")
try:
    guest_data = {
        "name": "Ayşe Demir",
        "email": "ayse@ornek.com",
        "phone": "0532 123 45 67",
        "group": "Aile"
    }
    resp = session.post(f"{BASE_URL}/projects/{project_id}/guests", json=guest_data)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 201:
        data = resp.json()
        if "guest" in data:
            guest = data["guest"]
            guest_id = guest.get("id")
            phone_normalized = guest.get("phone")
            
            checks = []
            checks.append(("id present", bool(guest_id)))
            checks.append(("name", guest.get("name") == "Ayşe Demir"))
            checks.append(("email", guest.get("email") == "ayse@ornek.com"))
            checks.append(("phone normalized to +905321234567", phone_normalized == "+905321234567"))
            checks.append(("group", guest.get("group") == "Aile"))
            
            all_pass = all(c[1] for c in checks)
            if all_pass:
                log_pass("POST /guests: 201 with normalized phone +905321234567")
            else:
                failed_checks = [c[0] for c in checks if not c[1]]
                log_fail("POST /guests: Some checks failed", f"Failed: {failed_checks}, phone={phone_normalized}")
        else:
            log_fail("POST /guests: No guest in response", f"Response: {data}")
    else:
        log_fail(f"POST /guests: Expected 201, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /guests: Exception", str(e))

# 3.2 POST /api/projects/:id/guests (missing name)
print("\n--- 3.2 POST /api/projects/:id/guests (missing name) ---")
try:
    resp = session.post(f"{BASE_URL}/projects/{project_id}/guests", json={
        "email": "test@example.com"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /guests missing name: 400 Bad Request")
    else:
        log_fail(f"POST /guests missing name: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /guests missing name: Exception", str(e))

# 3.3 POST /api/projects/:id/guests (invalid phone)
print("\n--- 3.3 POST /api/projects/:id/guests (invalid phone) ---")
try:
    resp = session.post(f"{BASE_URL}/projects/{project_id}/guests", json={
        "name": "Test User",
        "phone": "abc"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /guests invalid phone: 400 Bad Request")
    else:
        log_fail(f"POST /guests invalid phone: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /guests invalid phone: Exception", str(e))

# 3.4 POST /api/projects/:id/guests/import
print("\n--- 3.4 POST /api/projects/:id/guests/import ---")
try:
    import_data = {
        "rows": [
            {"name": "A", "email": "a@x.com"},
            {"Ad Soyad": "B", "Telefon": "05321112233"},
            {"name": "", "email": "c@x.com"},  # Empty name - should skip
            {"name": "Ayşe Demir", "email": "ayse@ornek.com"}  # Duplicate - should skip
        ]
    }
    resp = session.post(f"{BASE_URL}/projects/{project_id}/guests/import", json=import_data)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 201:
        data = resp.json()
        imported = data.get("imported", 0)
        skipped = data.get("skipped", 0)
        
        if imported == 2 and skipped == 2:
            log_pass("POST /guests/import: 201 with imported=2, skipped=2 (empty name + duplicate)")
        else:
            log_fail("POST /guests/import: Wrong counts", f"imported={imported}, skipped={skipped}, expected imported=2, skipped=2")
    else:
        log_fail(f"POST /guests/import: Expected 201, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /guests/import: Exception", str(e))

# 3.5 GET /api/projects/:id/guests
print("\n--- 3.5 GET /api/projects/:id/guests ---")
try:
    resp = session.get(f"{BASE_URL}/projects/{project_id}/guests")
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        items = data.get("items", [])
        
        # Should have 3 guests: Ayşe Demir, A, B
        if len(items) == 3:
            has_id_field = any("_id" in item for item in items)
            if not has_id_field:
                log_pass("GET /guests: Returns 3 guests, no _id field")
            else:
                log_fail("GET /guests: Contains _id field", "Should not expose MongoDB _id")
        else:
            log_fail("GET /guests: Wrong count", f"Expected 3 guests, got {len(items)}")
    else:
        log_fail(f"GET /guests: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /guests: Exception", str(e))

# 3.6 DELETE /api/projects/:id/guests/:gid
print("\n--- 3.6 DELETE /api/projects/:id/guests/:gid ---")
try:
    # Get a guest to delete
    resp = session.get(f"{BASE_URL}/projects/{project_id}/guests")
    if resp.status_code == 200:
        guests = resp.json().get("items", [])
        if guests:
            delete_guest_id = guests[0]["id"]
            
            # Delete
            resp2 = session.delete(f"{BASE_URL}/projects/{project_id}/guests/{delete_guest_id}")
            print(f"Delete status: {resp2.status_code}")
            
            if resp2.status_code == 200:
                # Try to delete again - should 404
                resp3 = session.delete(f"{BASE_URL}/projects/{project_id}/guests/{delete_guest_id}")
                print(f"Delete again status: {resp3.status_code}")
                
                if resp3.status_code == 404:
                    log_pass("DELETE /guests/:gid: 200 first time, 404 second time")
                else:
                    log_fail(f"DELETE /guests/:gid: Second delete should be 404, got {resp3.status_code}")
            else:
                log_fail(f"DELETE /guests/:gid: Expected 200, got {resp2.status_code}", resp2.text[:200])
        else:
            log_warning("DELETE /guests/:gid: No guests to delete")
    else:
        log_warning("DELETE /guests/:gid: Could not fetch guests")
except Exception as e:
    log_fail("DELETE /guests/:gid: Exception", str(e))

# 3.7 GET /api/projects/:id/rsvps
print("\n--- 3.7 GET /api/projects/:id/rsvps ---")
try:
    resp = session.get(f"{BASE_URL}/projects/{project_id}/rsvps")
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        if "items" in data and "stats" in data:
            if isinstance(data["items"], list):
                log_pass("GET /rsvps: 200 with items array and stats")
            else:
                log_fail("GET /rsvps: items not an array", f"Response: {data}")
        else:
            log_fail("GET /rsvps: Missing items or stats", f"Response: {data}")
    else:
        log_fail(f"GET /rsvps: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /rsvps: Exception", str(e))

# 3.8 POST /api/projects/:id/send (SMS - should 503)
print("\n--- 3.8 POST /api/projects/:id/send (SMS - not configured) ---")
try:
    resp = session.post(f"{BASE_URL}/projects/{project_id}/send", json={
        "channel": "sms",
        "type": "invitation"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 503:
        log_pass("POST /send SMS: 503 Service Unavailable (Twilio not configured)")
    else:
        log_fail(f"POST /send SMS: Expected 503, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /send SMS: Exception", str(e))

# 3.9 POST /api/projects/:id/send (invalid channel)
print("\n--- 3.9 POST /api/projects/:id/send (invalid channel) ---")
try:
    resp = session.post(f"{BASE_URL}/projects/{project_id}/send", json={
        "channel": "invalid_channel",
        "type": "invitation"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /send invalid channel: 400 Bad Request")
    else:
        log_fail(f"POST /send invalid channel: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /send invalid channel: Exception", str(e))

# 3.10 POST /api/projects/:id/send (email - real Resend attempt)
print("\n--- 3.10 POST /api/projects/:id/send (email - REAL RESEND ATTEMPT) ---")
try:
    # Get a guest with email
    resp = session.get(f"{BASE_URL}/projects/{project_id}/guests")
    guests = resp.json().get("items", [])
    guest_with_email = next((g for g in guests if g.get("email")), None)
    
    if guest_with_email:
        send_data = {
            "channel": "email",
            "type": "invitation",
            "guest_ids": [guest_with_email["id"]]
        }
        resp = session.post(f"{BASE_URL}/projects/{project_id}/send", json=send_data)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Expected: ok:true, sent:0 or 1, failed:0 or 1, skipped:0
            if data.get("ok") == True:
                sent = data.get("sent", 0)
                failed = data.get("failed", 0)
                skipped = data.get("skipped", 0)
                
                if (sent == 1 and failed == 0) or (sent == 0 and failed == 1):
                    log_pass(f"POST /send email: 200 with ok:true, sent={sent}, failed={failed}, skipped={skipped}")
                    
                    # Check message logs
                    resp2 = session.get(f"{BASE_URL}/projects/{project_id}/messages")
                    if resp2.status_code == 200:
                        logs = resp2.json().get("items", [])
                        matching_log = next((l for l in logs if l.get("guest_id") == guest_with_email["id"]), None)
                        if matching_log:
                            print(f"  ✓ Message log entry found: status={matching_log.get('status')}")
                        else:
                            print(f"  ✗ No matching message log entry found")
                else:
                    log_fail("POST /send email: Unexpected counts", f"sent={sent}, failed={failed}, skipped={skipped}")
            else:
                log_fail("POST /send email: ok not true", f"Response: {data}")
        else:
            log_fail(f"POST /send email: Expected 200, got {resp.status_code}", resp.text[:200])
    else:
        log_warning("POST /send email: No guest with email found")
except Exception as e:
    log_fail("POST /send email: Exception", str(e))

# 3.11 GET /api/projects/:id/messages
print("\n--- 3.11 GET /api/projects/:id/messages ---")
try:
    resp = session.get(f"{BASE_URL}/projects/{project_id}/messages")
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        items = data.get("items", [])
        if len(items) >= 1:
            log_pass(f"GET /messages: 200 with {len(items)} log entries")
        else:
            log_warning("GET /messages: No log entries found", "Expected at least 1 from email send")
    else:
        log_fail(f"GET /messages: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /messages: Exception", str(e))

# 3.12 Isolation test - login as test@momentis.app and try to access new user's project
print("\n--- 3.12 Isolation test: Access other user's project ---")
try:
    session_test = requests.Session()
    resp = session_test.post(f"{BASE_URL}/auth/login", json={
        "email": "test@momentis.app",
        "password": "Test1234!"
    })
    
    if resp.status_code == 200:
        # Try to access new user's project
        resp2 = session_test.get(f"{BASE_URL}/projects/{project_id}")
        print(f"Status: {resp2.status_code}")
        
        if resp2.status_code == 404:
            log_pass("Isolation: Other user cannot access project (404)")
        else:
            log_fail(f"Isolation: Expected 404, got {resp2.status_code}", "Security issue: user can access other user's project")
    else:
        log_warning("Isolation test: Could not login as test@momentis.app")
except Exception as e:
    log_fail("Isolation test: Exception", str(e))

# ============================================================================
# 4. PUBLIC API TESTS
# ============================================================================
print("\n" + "="*80)
print("4. PUBLIC API TESTS")
print("="*80)

# 4.1 GET /api/public/invitations/:slug
print("\n--- 4.1 GET /api/public/invitations/:slug ---")
try:
    resp = requests.get(f"{BASE_URL}/public/invitations/{project_slug}")
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        if "project" in data and "template" in data:
            project = data["project"]
            if "user_id" not in project:
                log_pass("GET /public/invitations/:slug: 200 with project (no user_id) and template")
            else:
                log_fail("GET /public/invitations/:slug: user_id exposed", "Should not expose user_id in public API")
        else:
            log_fail("GET /public/invitations/:slug: Missing project or template", f"Response: {data}")
    else:
        log_fail(f"GET /public/invitations/:slug: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /public/invitations/:slug: Exception", str(e))

# 4.2 GET /api/public/invitations/:slug (unknown slug)
print("\n--- 4.2 GET /api/public/invitations/:slug (unknown) ---")
try:
    resp = requests.get(f"{BASE_URL}/public/invitations/nonexistent-slug-12345")
    print(f"Status: {resp.status_code}")
    if resp.status_code == 404:
        log_pass("GET /public/invitations unknown slug: 404 Not Found")
    else:
        log_fail(f"GET /public/invitations unknown slug: Expected 404, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("GET /public/invitations unknown slug: Exception", str(e))

# 4.3 GET /api/public/invitations/:slug (published=false)
print("\n--- 4.3 GET /api/public/invitations/:slug (published=false) ---")
try:
    # Set published to false
    resp = session.patch(f"{BASE_URL}/projects/{project_id}", json={"published": False})
    if resp.status_code == 200:
        # Try to access public invitation
        resp2 = requests.get(f"{BASE_URL}/public/invitations/{project_slug}")
        print(f"Status: {resp2.status_code}")
        
        if resp2.status_code == 404:
            log_pass("GET /public/invitations published=false: 404 Not Found")
            
            # Restore published=true
            session.patch(f"{BASE_URL}/projects/{project_id}", json={"published": True})
            print("  ✓ Restored published=true")
        else:
            log_fail(f"GET /public/invitations published=false: Expected 404, got {resp2.status_code}")
    else:
        log_warning("Could not set published=false for test")
except Exception as e:
    log_fail("GET /public/invitations published=false: Exception", str(e))

# 4.4 POST /api/public/rsvp (attending=true with email)
print("\n--- 4.4 POST /api/public/rsvp (attending=true) ---")
try:
    rsvp_data = {
        "slug": project_slug,
        "name": "Ayşe Demir",
        "email": "ayse@ornek.com",
        "attending": True,
        "guest_count": 2,
        "menu": "Balık",
        "note": "test"
    }
    resp = requests.post(f"{BASE_URL}/public/rsvp", json=rsvp_data)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 201:
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        checks = []
        checks.append(("ok=true", data.get("ok") == True))
        checks.append(("rsvp.attending=true", data.get("rsvp", {}).get("attending") == True))
        checks.append(("rsvp.guest_count=2", data.get("rsvp", {}).get("guest_count") == 2))
        checks.append(("confirmations array", isinstance(data.get("confirmations"), list)))
        
        all_pass = all(c[1] for c in checks)
        if all_pass:
            confirmations = data.get("confirmations", [])
            email_conf = next((c for c in confirmations if c.get("channel") == "email"), None)
            if email_conf:
                print(f"  Email confirmation: status={email_conf.get('status')}")
            
            log_pass("POST /public/rsvp attending=true: 201 with ok:true, rsvp, confirmations")
            
            # Verify guest status updated and stats
            resp2 = session.get(f"{BASE_URL}/projects/{project_id}/rsvps")
            if resp2.status_code == 200:
                rsvps_data = resp2.json()
                items = rsvps_data.get("items", [])
                stats = rsvps_data.get("stats", {})
                
                matching_rsvp = next((r for r in items if r.get("email") == "ayse@ornek.com"), None)
                if matching_rsvp:
                    print(f"  ✓ RSVP found in project rsvps")
                    
                    # Check guest status
                    resp3 = session.get(f"{BASE_URL}/projects/{project_id}/guests")
                    if resp3.status_code == 200:
                        guests = resp3.json().get("items", [])
                        matching_guest = next((g for g in guests if g.get("email") == "ayse@ornek.com"), None)
                        if matching_guest and matching_guest.get("status") == "responded":
                            print(f"  ✓ Guest status updated to 'responded'")
                        else:
                            print(f"  ✗ Guest status not updated: {matching_guest.get('status') if matching_guest else 'not found'}")
                    
                    # Check stats
                    if stats.get("attending") == 1 and stats.get("attending_people") == 2:
                        print(f"  ✓ Stats: attending=1, attending_people=2")
                    else:
                        print(f"  ✗ Stats incorrect: attending={stats.get('attending')}, attending_people={stats.get('attending_people')}")
                else:
                    print(f"  ✗ RSVP not found in project rsvps")
        else:
            failed_checks = [c[0] for c in checks if not c[1]]
            log_fail("POST /public/rsvp: Some checks failed", f"Failed: {failed_checks}")
    else:
        log_fail(f"POST /public/rsvp: Expected 201, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /public/rsvp attending=true: Exception", str(e))

# 4.5 POST /api/public/rsvp (attending=false, phone only)
print("\n--- 4.5 POST /api/public/rsvp (attending=false, phone only) ---")
try:
    rsvp_data = {
        "slug": project_slug,
        "name": "Mehmet Yılmaz",
        "phone": "05321234567",
        "attending": False
    }
    resp = requests.post(f"{BASE_URL}/public/rsvp", json=rsvp_data)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 201:
        data = resp.json()
        if data.get("ok") == True and data.get("rsvp", {}).get("attending") == False:
            guest_count = data.get("rsvp", {}).get("guest_count", -1)
            if guest_count == 0:
                log_pass("POST /public/rsvp attending=false: 201 with guest_count=0")
            else:
                log_fail("POST /public/rsvp attending=false: guest_count should be 0", f"Got: {guest_count}")
        else:
            log_fail("POST /public/rsvp attending=false: Invalid response", f"Response: {data}")
    else:
        log_fail(f"POST /public/rsvp attending=false: Expected 201, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /public/rsvp attending=false: Exception", str(e))

# 4.6 POST /api/public/rsvp (missing attending)
print("\n--- 4.6 POST /api/public/rsvp (missing attending) ---")
try:
    resp = requests.post(f"{BASE_URL}/public/rsvp", json={
        "slug": project_slug,
        "name": "Test",
        "email": "test@example.com"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /public/rsvp missing attending: 400 Bad Request")
    else:
        log_fail(f"POST /public/rsvp missing attending: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /public/rsvp missing attending: Exception", str(e))

# 4.7 POST /api/public/rsvp (no email and no phone)
print("\n--- 4.7 POST /api/public/rsvp (no email and no phone) ---")
try:
    resp = requests.post(f"{BASE_URL}/public/rsvp", json={
        "slug": project_slug,
        "name": "Test",
        "attending": True
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400:
        log_pass("POST /public/rsvp no email/phone: 400 Bad Request")
    else:
        log_fail(f"POST /public/rsvp no email/phone: Expected 400, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /public/rsvp no email/phone: Exception", str(e))

# 4.8 POST /api/public/rsvp (invalid slug)
print("\n--- 4.8 POST /api/public/rsvp (invalid slug) ---")
try:
    resp = requests.post(f"{BASE_URL}/public/rsvp", json={
        "slug": "nonexistent-slug-12345",
        "name": "Test",
        "email": "test@example.com",
        "attending": True
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 404:
        log_pass("POST /public/rsvp invalid slug: 404 Not Found")
    else:
        log_fail(f"POST /public/rsvp invalid slug: Expected 404, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("POST /public/rsvp invalid slug: Exception", str(e))

# ============================================================================
# 5. CLEANUP
# ============================================================================
print("\n" + "="*80)
print("5. CLEANUP")
print("="*80)

# 5.1 DELETE /api/projects/:id
print("\n--- 5.1 DELETE /api/projects/:id ---")
try:
    resp = session.delete(f"{BASE_URL}/projects/{project_id}")
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        # Verify deletion
        resp2 = session.get(f"{BASE_URL}/projects/{project_id}")
        print(f"GET after delete status: {resp2.status_code}")
        
        if resp2.status_code == 404:
            log_pass("DELETE /projects/:id: 200, subsequent GET returns 404")
        else:
            log_fail(f"DELETE /projects/:id: Project not deleted, GET returned {resp2.status_code}")
    else:
        log_fail(f"DELETE /projects/:id: Expected 200, got {resp.status_code}", resp.text[:200])
except Exception as e:
    log_fail("DELETE /projects/:id: Exception", str(e))

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print(f"\n✅ PASSED: {len(results['passed'])}")
for test in results["passed"]:
    print(f"   - {test}")

if results["warnings"]:
    print(f"\n⚠️  WARNINGS: {len(results['warnings'])}")
    for test in results["warnings"]:
        print(f"   - {test}")

if results["failed"]:
    print(f"\n❌ FAILED: {len(results['failed'])}")
    for test in results["failed"]:
        print(f"   - {test}")
else:
    print("\n🎉 ALL CRITICAL TESTS PASSED!")

print("\n" + "="*80)
print(f"Total: {len(results['passed'])} passed, {len(results['failed'])} failed, {len(results['warnings'])} warnings")
print("="*80)
