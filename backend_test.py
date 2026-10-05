#!/usr/bin/env python3
"""
Backend test for MOMENTIS Album API (QR Anı Albümü)
Tests all album endpoints with authentication
"""
import requests
import json
import sys

# Base URL from .env
BASE_URL = "https://ozel-anlar-tasarimi.preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "test@momentis.app"
TEST_PASSWORD = "Test1234!"

# Tiny 1x1 transparent PNG as base64 data URL (minimal size)
TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Invalid data URL for validation testing
INVALID_DATA_URL = "not-a-data-url"

def print_test(name):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print('='*60)

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg):
    print(f"❌ FAIL: {msg}")
    
def print_info(msg):
    print(f"ℹ️  INFO: {msg}")

class AlbumAPITest:
    def __init__(self):
        self.session = requests.Session()
        self.project_id = None
        self.project_slug = None
        self.photo_id = None
        self.throwaway_project_id = None
        self.throwaway_slug = None
        
    def login(self):
        """Login and get auth cookie"""
        print_test("Login to get auth cookie")
        try:
            resp = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
                timeout=10
            )
            if resp.status_code == 200:
                print_pass(f"Login successful: {resp.status_code}")
                # Check if cookie is set
                if 'momentis_session' in self.session.cookies:
                    print_pass("Auth cookie 'momentis_session' is set")
                else:
                    print_fail("Auth cookie 'momentis_session' NOT set")
                    return False
                return True
            else:
                print_fail(f"Login failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Login exception: {e}")
            return False
    
    def create_published_project(self):
        """Create a new published project for testing"""
        print_test("Create a published project")
        try:
            # Create project
            resp = self.session.post(
                f"{BASE_URL}/projects",
                json={
                    "host_a": "Ayşe",
                    "host_b": "Mehmet",
                    "date": "2025-06-15",
                    "time": "18:00",
                    "event_type": "dugun",
                    "template_slug": "aurelia",
                    "venue": "Test Venue",
                    "city": "Istanbul",
                    "published": True,
                    "album_enabled": True
                },
                timeout=10
            )
            if resp.status_code == 201:
                data = resp.json()
                self.project_id = data['project']['id']
                self.project_slug = data['project']['slug']
                print_pass(f"Project created: id={self.project_id}, slug={self.project_slug}")
                return True
            else:
                print_fail(f"Project creation failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Project creation exception: {e}")
            return False
    
    def test_public_listing_empty(self):
        """Test GET /api/public/album/<slug> returns empty list initially"""
        print_test("Public listing - initially empty")
        try:
            resp = requests.get(f"{BASE_URL}/public/album/{self.project_slug}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get('enabled') == True:
                    print_pass(f"Album enabled: {data['enabled']}")
                else:
                    print_fail(f"Album should be enabled, got: {data.get('enabled')}")
                    return False
                if isinstance(data.get('items'), list):
                    print_pass(f"Items is a list with {len(data['items'])} items")
                else:
                    print_fail(f"Items should be a list, got: {type(data.get('items'))}")
                    return False
                if data.get('total') == len(data.get('items', [])):
                    print_pass(f"Total matches items length: {data['total']}")
                else:
                    print_fail(f"Total mismatch: total={data.get('total')}, items={len(data.get('items', []))}")
                    return False
                return True
            else:
                print_fail(f"Public listing failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Public listing exception: {e}")
            return False
    
    def test_public_upload(self):
        """Test POST /api/public/album/<slug> with valid photo"""
        print_test("Public upload - valid photo")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}",
                json={"uploader": "Zeynep", "photos": [TINY_PNG]},
                timeout=10
            )
            if resp.status_code == 201:
                data = resp.json()
                if data.get('ok') == True:
                    print_pass(f"Upload successful: ok={data['ok']}")
                else:
                    print_fail(f"Expected ok=true, got: {data.get('ok')}")
                    return False
                if data.get('uploaded') == 1:
                    print_pass(f"Uploaded count correct: {data['uploaded']}")
                else:
                    print_fail(f"Expected uploaded=1, got: {data.get('uploaded')}")
                    return False
                photos = data.get('photos', [])
                if len(photos) == 1:
                    print_pass(f"Photos array has 1 item")
                    photo = photos[0]
                    # CRITICAL: Check that data_url is NOT in the response
                    if 'data_url' in photo:
                        print_fail(f"CRITICAL: data_url should NOT be in public upload response, but found: {list(photo.keys())}")
                        return False
                    else:
                        print_pass("CRITICAL: data_url is NOT in response (correct)")
                    # Check required fields
                    if 'id' in photo and 'uploader_name' in photo:
                        print_pass(f"Photo has id and uploader_name: id={photo['id']}, uploader={photo['uploader_name']}")
                        self.photo_id = photo['id']
                    else:
                        print_fail(f"Photo missing required fields: {list(photo.keys())}")
                        return False
                else:
                    print_fail(f"Expected 1 photo in response, got: {len(photos)}")
                    return False
                return True
            else:
                print_fail(f"Public upload failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Public upload exception: {e}")
            return False
    
    def test_validation_invalid_data_url(self):
        """Test POST with invalid data URL returns 400"""
        print_test("Validation - invalid data URL")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}",
                json={"uploader": "Test", "photos": [INVALID_DATA_URL]},
                timeout=10
            )
            if resp.status_code == 400:
                print_pass(f"Invalid data URL rejected with 400: {resp.status_code}")
                return True
            else:
                print_fail(f"Expected 400 for invalid data URL, got: {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Validation exception: {e}")
            return False
    
    def test_validation_empty_photos(self):
        """Test POST with empty photos array returns 400"""
        print_test("Validation - empty photos array")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}",
                json={"uploader": "Test", "photos": []},
                timeout=10
            )
            if resp.status_code == 400:
                print_pass(f"Empty photos array rejected with 400: {resp.status_code}")
                return True
            else:
                print_fail(f"Expected 400 for empty photos, got: {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Validation exception: {e}")
            return False
    
    def test_public_listing_after_upload(self):
        """Test GET /api/public/album/<slug> includes uploaded photo"""
        print_test("Public listing - after upload")
        try:
            resp = requests.get(f"{BASE_URL}/public/album/{self.project_slug}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get('items', [])
                if len(items) >= 1:
                    print_pass(f"Items list has {len(items)} photo(s)")
                    # Check that items include data_url for display
                    photo = items[0]
                    if 'data_url' in photo:
                        print_pass(f"Photo includes data_url for display (length: {len(photo['data_url'])})")
                    else:
                        print_fail(f"Photo should include data_url in listing, got keys: {list(photo.keys())}")
                        return False
                    if 'uploader_name' in photo:
                        print_pass(f"Photo includes uploader_name: {photo['uploader_name']}")
                    else:
                        print_fail(f"Photo missing uploader_name")
                        return False
                else:
                    print_fail(f"Expected at least 1 photo, got: {len(items)}")
                    return False
                if data.get('total') >= 1:
                    print_pass(f"Total count incremented: {data['total']}")
                else:
                    print_fail(f"Total should be >= 1, got: {data.get('total')}")
                    return False
                return True
            else:
                print_fail(f"Public listing failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Public listing exception: {e}")
            return False
    
    def test_auth_admin_list(self):
        """Test GET /api/projects/<id>/album with auth cookie"""
        print_test("Auth admin list - with cookie")
        try:
            resp = self.session.get(f"{BASE_URL}/projects/{self.project_id}/album", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                print_pass(f"Auth admin list successful: {resp.status_code}")
                items = data.get('items', [])
                if len(items) >= 1:
                    print_pass(f"Items list has {len(items)} photo(s)")
                    photo = items[0]
                    if 'data_url' in photo and 'uploader_name' in photo:
                        print_pass(f"Photo includes data_url and uploader_name")
                    else:
                        print_fail(f"Photo missing required fields: {list(photo.keys())}")
                        return False
                else:
                    print_fail(f"Expected at least 1 photo, got: {len(items)}")
                    return False
                if 'enabled' in data:
                    print_pass(f"Response includes enabled field: {data['enabled']}")
                else:
                    print_fail(f"Response missing enabled field")
                    return False
                return True
            else:
                print_fail(f"Auth admin list failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Auth admin list exception: {e}")
            return False
    
    def test_auth_required(self):
        """Test GET /api/projects/<id>/album without auth returns 401"""
        print_test("Auth required - no cookie")
        try:
            # Create a new session without auth cookie
            no_auth_session = requests.Session()
            resp = no_auth_session.get(f"{BASE_URL}/projects/{self.project_id}/album", timeout=10)
            if resp.status_code == 401:
                print_pass(f"Auth required: got 401 without cookie")
                return True
            else:
                print_fail(f"Expected 401 without auth, got: {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Auth required exception: {e}")
            return False
    
    def test_auth_delete(self):
        """Test DELETE /api/projects/<id>/album/<photoId>"""
        print_test("Auth delete - valid photo")
        try:
            if not self.photo_id:
                print_fail("No photo_id available for deletion test")
                return False
            resp = self.session.delete(f"{BASE_URL}/projects/{self.project_id}/album/{self.photo_id}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get('ok') == True:
                    print_pass(f"Photo deleted successfully: ok={data['ok']}")
                else:
                    print_fail(f"Expected ok=true, got: {data.get('ok')}")
                    return False
                return True
            else:
                print_fail(f"Delete failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Delete exception: {e}")
            return False
    
    def test_delete_unknown_id(self):
        """Test DELETE with unknown photo ID returns 404"""
        print_test("Auth delete - unknown ID")
        try:
            fake_id = "00000000-0000-0000-0000-000000000000"
            resp = self.session.delete(f"{BASE_URL}/projects/{self.project_id}/album/{fake_id}", timeout=10)
            if resp.status_code == 404:
                print_pass(f"Unknown photo ID rejected with 404: {resp.status_code}")
                return True
            else:
                print_fail(f"Expected 404 for unknown ID, got: {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Delete unknown ID exception: {e}")
            return False
    
    def test_listing_after_delete(self):
        """Test that deleted photo no longer appears in listings"""
        print_test("Listing after delete - photo removed")
        try:
            resp = requests.get(f"{BASE_URL}/public/album/{self.project_slug}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get('items', [])
                # Check that the deleted photo is not in the list
                photo_ids = [p.get('id') for p in items]
                if self.photo_id not in photo_ids:
                    print_pass(f"Deleted photo not in listing (correct)")
                else:
                    print_fail(f"Deleted photo still in listing")
                    return False
                return True
            else:
                print_fail(f"Listing after delete failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Listing after delete exception: {e}")
            return False
    
    def test_toggle_album_off(self):
        """Test PATCH /api/projects/<id> with album_enabled=false"""
        print_test("Toggle album off")
        try:
            resp = self.session.patch(
                f"{BASE_URL}/projects/{self.project_id}",
                json={"album_enabled": False},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                print_pass(f"Album toggled off: {resp.status_code}")
                return True
            else:
                print_fail(f"Toggle off failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Toggle off exception: {e}")
            return False
    
    def test_public_get_disabled(self):
        """Test GET /api/public/album/<slug> when disabled returns enabled=false, empty items"""
        print_test("Public GET when disabled")
        try:
            resp = requests.get(f"{BASE_URL}/public/album/{self.project_slug}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get('enabled') == False:
                    print_pass(f"Album disabled: enabled={data['enabled']}")
                else:
                    print_fail(f"Expected enabled=false, got: {data.get('enabled')}")
                    return False
                if data.get('items') == []:
                    print_pass(f"Items is empty list when disabled")
                else:
                    print_fail(f"Expected empty items, got: {data.get('items')}")
                    return False
                if data.get('total') == 0:
                    print_pass(f"Total is 0 when disabled")
                else:
                    print_fail(f"Expected total=0, got: {data.get('total')}")
                    return False
                return True
            else:
                print_fail(f"Public GET disabled failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Public GET disabled exception: {e}")
            return False
    
    def test_public_post_disabled(self):
        """Test POST /api/public/album/<slug> when disabled returns 403"""
        print_test("Public POST when disabled")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}",
                json={"uploader": "Test", "photos": [TINY_PNG]},
                timeout=10
            )
            if resp.status_code == 403:
                print_pass(f"Upload rejected when disabled: 403")
                return True
            else:
                print_fail(f"Expected 403 when disabled, got: {resp.status_code}")
                return False
        except Exception as e:
            print_fail(f"Public POST disabled exception: {e}")
            return False
    
    def test_toggle_album_on(self):
        """Test PATCH /api/projects/<id> with album_enabled=true"""
        print_test("Toggle album back on")
        try:
            resp = self.session.patch(
                f"{BASE_URL}/projects/{self.project_id}",
                json={"album_enabled": True},
                timeout=10
            )
            if resp.status_code == 200:
                print_pass(f"Album toggled back on: {resp.status_code}")
                # Verify it works again
                resp2 = requests.get(f"{BASE_URL}/public/album/{self.project_slug}", timeout=10)
                if resp2.status_code == 200:
                    data = resp2.json()
                    if data.get('enabled') == True:
                        print_pass(f"Album re-enabled: enabled={data['enabled']}")
                        return True
                    else:
                        print_fail(f"Album should be enabled, got: {data.get('enabled')}")
                        return False
                else:
                    print_fail(f"Verification failed: {resp2.status_code}")
                    return False
            else:
                print_fail(f"Toggle on failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Toggle on exception: {e}")
            return False
    
    def test_stats_album_count(self):
        """Test GET /api/projects/<id> returns stats.album_count"""
        print_test("Stats - album_count")
        try:
            # First upload a photo to have a count
            resp_upload = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}",
                json={"uploader": "Stats Test", "photos": [TINY_PNG]},
                timeout=10
            )
            if resp_upload.status_code != 201:
                print_fail(f"Failed to upload photo for stats test: {resp_upload.status_code}")
                return False
            
            # Now check stats
            resp = self.session.get(f"{BASE_URL}/projects/{self.project_id}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                stats = data.get('project', {}).get('stats', {})
                album_count = stats.get('album_count')
                if album_count is not None and album_count >= 1:
                    print_pass(f"Stats includes album_count: {album_count}")
                    return True
                else:
                    print_fail(f"Stats missing or incorrect album_count: {album_count}")
                    return False
            else:
                print_fail(f"Get project stats failed: {resp.status_code} - {resp.text[:200]}")
                return False
        except Exception as e:
            print_fail(f"Stats exception: {e}")
            return False
    
    def test_cascade_delete(self):
        """Test that deleting a project also deletes album_photos"""
        print_test("Cascade delete - project deletion removes photos")
        try:
            # Create a throwaway project
            resp = self.session.post(
                f"{BASE_URL}/projects",
                json={
                    "host_a": "Throwaway",
                    "host_b": "Test",
                    "date": "2025-12-31",
                    "event_type": "dugun",
                    "template_slug": "aurelia",
                    "published": True
                },
                timeout=10
            )
            if resp.status_code != 201:
                print_fail(f"Failed to create throwaway project: {resp.status_code}")
                return False
            
            data = resp.json()
            self.throwaway_project_id = data['project']['id']
            self.throwaway_slug = data['project']['slug']
            print_info(f"Created throwaway project: {self.throwaway_project_id}, slug: {self.throwaway_slug}")
            
            # Upload a photo to it
            resp_upload = requests.post(
                f"{BASE_URL}/public/album/{self.throwaway_slug}",
                json={"uploader": "Cascade Test", "photos": [TINY_PNG]},
                timeout=10
            )
            if resp_upload.status_code != 201:
                print_fail(f"Failed to upload photo to throwaway project: {resp_upload.status_code}")
                return False
            print_info(f"Uploaded photo to throwaway project")
            
            # Verify photo exists
            resp_check = requests.get(f"{BASE_URL}/public/album/{self.throwaway_slug}", timeout=10)
            if resp_check.status_code == 200:
                items = resp_check.json().get('items', [])
                if len(items) >= 1:
                    print_info(f"Verified photo exists before deletion: {len(items)} photo(s)")
                else:
                    print_fail(f"Photo not found before deletion")
                    return False
            
            # Delete the project
            resp_delete = self.session.delete(f"{BASE_URL}/projects/{self.throwaway_project_id}", timeout=10)
            if resp_delete.status_code != 200:
                print_fail(f"Failed to delete throwaway project: {resp_delete.status_code}")
                return False
            print_info(f"Deleted throwaway project")
            
            # Verify project is gone (public GET should return 404)
            resp_verify = requests.get(f"{BASE_URL}/public/album/{self.throwaway_slug}", timeout=10)
            if resp_verify.status_code == 404:
                print_pass(f"Project deletion confirmed: public GET returns 404")
                return True
            else:
                print_fail(f"Expected 404 after project deletion, got: {resp_verify.status_code}")
                return False
        except Exception as e:
            print_fail(f"Cascade delete exception: {e}")
            return False
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("\n" + "="*60)
        print("MOMENTIS ALBUM API TEST SUITE")
        print("="*60)
        
        results = []
        
        # Login
        if not self.login():
            print("\n❌ LOGIN FAILED - Cannot proceed with tests")
            return False
        
        # Create project
        if not self.create_published_project():
            print("\n❌ PROJECT CREATION FAILED - Cannot proceed with tests")
            return False
        
        # Run all test scenarios
        test_methods = [
            ("1. Public listing (empty)", self.test_public_listing_empty),
            ("2. Public upload (valid)", self.test_public_upload),
            ("3. Validation (invalid data URL)", self.test_validation_invalid_data_url),
            ("4. Validation (empty photos)", self.test_validation_empty_photos),
            ("5. Public listing (after upload)", self.test_public_listing_after_upload),
            ("6. Auth admin list", self.test_auth_admin_list),
            ("7. Auth required (no cookie)", self.test_auth_required),
            ("8. Auth delete (valid)", self.test_auth_delete),
            ("9. Auth delete (unknown ID)", self.test_delete_unknown_id),
            ("10. Listing after delete", self.test_listing_after_delete),
            ("11. Toggle album off", self.test_toggle_album_off),
            ("12. Public GET (disabled)", self.test_public_get_disabled),
            ("13. Public POST (disabled)", self.test_public_post_disabled),
            ("14. Toggle album on", self.test_toggle_album_on),
            ("15. Stats album_count", self.test_stats_album_count),
            ("16. Cascade delete", self.test_cascade_delete),
        ]
        
        for name, test_func in test_methods:
            try:
                result = test_func()
                results.append((name, result))
            except Exception as e:
                print_fail(f"Test {name} raised exception: {e}")
                results.append((name, False))
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        passed = sum(1 for _, r in results if r)
        total = len(results)
        print(f"\nTotal: {total} tests")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print("\nDetailed Results:")
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {name}")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️  {total - passed} TEST(S) FAILED")
            return False

if __name__ == "__main__":
    tester = AlbumAPITest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
