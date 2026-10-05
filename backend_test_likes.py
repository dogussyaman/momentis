#!/usr/bin/env python3
"""
Backend test for MOMENTIS Album Photo Likes API
Tests the new like/unlike endpoint for album photos
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

class AlbumLikesTest:
    def __init__(self):
        self.session = requests.Session()
        self.project_id = None
        self.project_slug = None
        self.photo_id = None
        
    def login(self):
        """Login and get auth cookie"""
        print_test("Setup: Login to get auth cookie")
        try:
            resp = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
                timeout=10
            )
            if resp.status_code == 200:
                print_pass(f"Login successful: {resp.status_code}")
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
    
    def setup_project_and_photo(self):
        """Create a published project and upload one photo"""
        print_test("Setup: Create published project and upload photo")
        try:
            # Create project
            resp = self.session.post(
                f"{BASE_URL}/projects",
                json={
                    "host_a": "Elif",
                    "host_b": "Kaan",
                    "date": "2025-07-20",
                    "time": "19:00",
                    "event_type": "dugun",
                    "template_slug": "aurelia",
                    "venue": "Like Test Venue",
                    "city": "Ankara",
                    "published": True,
                    "album_enabled": True
                },
                timeout=10
            )
            if resp.status_code != 201:
                print_fail(f"Project creation failed: {resp.status_code} - {resp.text[:200]}")
                return False
            
            data = resp.json()
            self.project_id = data['project']['id']
            self.project_slug = data['project']['slug']
            print_pass(f"Project created: id={self.project_id}, slug={self.project_slug}")
            
            # Upload one photo
            resp_upload = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}",
                json={"uploader": "Test User", "photos": [TINY_PNG]},
                timeout=10
            )
            if resp_upload.status_code != 201:
                print_fail(f"Photo upload failed: {resp_upload.status_code} - {resp_upload.text[:200]}")
                return False
            
            upload_data = resp_upload.json()
            photos = upload_data.get('photos', [])
            if len(photos) == 0:
                print_fail("No photos returned from upload")
                return False
            
            self.photo_id = photos[0]['id']
            print_pass(f"Photo uploaded: id={self.photo_id}")
            return True
            
        except Exception as e:
            print_fail(f"Setup exception: {e}")
            return False
    
    def test_1_baseline_likes_zero(self):
        """Test 1: GET /api/public/album/<slug> - confirm likes:0"""
        print_test("Test 1: Baseline - newly uploaded photo has likes:0")
        try:
            resp = requests.get(f"{BASE_URL}/public/album/{self.project_slug}", timeout=10)
            if resp.status_code != 200:
                print_fail(f"GET failed: {resp.status_code} - {resp.text[:200]}")
                return False
            
            data = resp.json()
            items = data.get('items', [])
            if len(items) == 0:
                print_fail("No photos in album")
                return False
            
            photo = items[0]
            if 'likes' not in photo:
                print_fail(f"Photo missing 'likes' field. Keys: {list(photo.keys())}")
                return False
            
            if not isinstance(photo['likes'], (int, float)):
                print_fail(f"'likes' field is not numeric: {type(photo['likes'])}")
                return False
            
            if photo['likes'] != 0:
                print_fail(f"Expected likes=0, got: {photo['likes']}")
                return False
            
            print_pass(f"Photo has numeric 'likes' field equal to 0")
            return True
            
        except Exception as e:
            print_fail(f"Test 1 exception: {e}")
            return False
    
    def test_2_like_once(self):
        """Test 2: POST /api/public/album/<slug>/like with liked:true -> likes:1"""
        print_test("Test 2: Like once - expect likes:1")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": self.photo_id, "liked": True},
                timeout=10
            )
            if resp.status_code != 200:
                print_fail(f"POST like failed: {resp.status_code} - {resp.text[:200]}")
                return False
            
            data = resp.json()
            if data.get('ok') != True:
                print_fail(f"Expected ok:true, got: {data.get('ok')}")
                return False
            
            if data.get('likes') != 1:
                print_fail(f"Expected likes:1, got: {data.get('likes')}")
                return False
            
            print_pass(f"Like successful: ok=true, likes=1")
            return True
            
        except Exception as e:
            print_fail(f"Test 2 exception: {e}")
            return False
    
    def test_3_like_again(self):
        """Test 3: Like again with liked:true -> likes:2"""
        print_test("Test 3: Like again - expect likes:2")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": self.photo_id, "liked": True},
                timeout=10
            )
            if resp.status_code != 200:
                print_fail(f"POST like failed: {resp.status_code} - {resp.text[:200]}")
                return False
            
            data = resp.json()
            if data.get('likes') != 2:
                print_fail(f"Expected likes:2, got: {data.get('likes')}")
                return False
            
            print_pass(f"Like again successful: likes=2")
            return True
            
        except Exception as e:
            print_fail(f"Test 3 exception: {e}")
            return False
    
    def test_4_unlike_sequence(self):
        """Test 4: Unlike sequence - liked:false three times (2->1->0->0 clamp)"""
        print_test("Test 4: Unlike sequence - expect 1, then 0, then 0 (clamp)")
        try:
            # First unlike: 2 -> 1
            resp1 = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": self.photo_id, "liked": False},
                timeout=10
            )
            if resp1.status_code != 200:
                print_fail(f"First unlike failed: {resp1.status_code} - {resp1.text[:200]}")
                return False
            
            data1 = resp1.json()
            if data1.get('likes') != 1:
                print_fail(f"First unlike: expected likes:1, got: {data1.get('likes')}")
                return False
            print_pass(f"First unlike: likes=1")
            
            # Second unlike: 1 -> 0
            resp2 = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": self.photo_id, "liked": False},
                timeout=10
            )
            if resp2.status_code != 200:
                print_fail(f"Second unlike failed: {resp2.status_code} - {resp2.text[:200]}")
                return False
            
            data2 = resp2.json()
            if data2.get('likes') != 0:
                print_fail(f"Second unlike: expected likes:0, got: {data2.get('likes')}")
                return False
            print_pass(f"Second unlike: likes=0")
            
            # Third unlike: 0 -> 0 (clamp, never negative)
            resp3 = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": self.photo_id, "liked": False},
                timeout=10
            )
            if resp3.status_code != 200:
                print_fail(f"Third unlike failed: {resp3.status_code} - {resp3.text[:200]}")
                return False
            
            data3 = resp3.json()
            if data3.get('likes') != 0:
                print_fail(f"Third unlike (clamp): expected likes:0, got: {data3.get('likes')}")
                return False
            print_pass(f"Third unlike (clamp): likes=0 (never negative)")
            
            return True
            
        except Exception as e:
            print_fail(f"Test 4 exception: {e}")
            return False
    
    def test_5_verify_final_count(self):
        """Test 5: GET /api/public/album/<slug> - confirm final likes count"""
        print_test("Test 5: Verify final count via GET - expect likes:0")
        try:
            resp = requests.get(f"{BASE_URL}/public/album/{self.project_slug}", timeout=10)
            if resp.status_code != 200:
                print_fail(f"GET failed: {resp.status_code} - {resp.text[:200]}")
                return False
            
            data = resp.json()
            items = data.get('items', [])
            if len(items) == 0:
                print_fail("No photos in album")
                return False
            
            photo = items[0]
            if photo.get('likes') != 0:
                print_fail(f"Expected final likes:0, got: {photo.get('likes')}")
                return False
            
            print_pass(f"Final count verified: likes=0")
            return True
            
        except Exception as e:
            print_fail(f"Test 5 exception: {e}")
            return False
    
    def test_6_unknown_photo(self):
        """Test 6: POST like with unknown photo_id -> 404"""
        print_test("Test 6: Unknown photo_id - expect 404")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": "does-not-exist", "liked": True},
                timeout=10
            )
            if resp.status_code != 404:
                print_fail(f"Expected 404 for unknown photo, got: {resp.status_code}")
                return False
            
            print_pass(f"Unknown photo_id rejected with 404")
            return True
            
        except Exception as e:
            print_fail(f"Test 6 exception: {e}")
            return False
    
    def test_7_unknown_slug(self):
        """Test 7: POST like with unknown slug -> 404"""
        print_test("Test 7: Unknown slug - expect 404")
        try:
            resp = requests.post(
                f"{BASE_URL}/public/album/no-such-slug/like",
                json={"photo_id": self.photo_id, "liked": True},
                timeout=10
            )
            if resp.status_code != 404:
                print_fail(f"Expected 404 for unknown slug, got: {resp.status_code}")
                return False
            
            print_pass(f"Unknown slug rejected with 404")
            return True
            
        except Exception as e:
            print_fail(f"Test 7 exception: {e}")
            return False
    
    def test_8_disabled_album(self):
        """Test 8: Disable album, POST like -> 403, then re-enable"""
        print_test("Test 8: Disabled album - expect 403, then re-enable")
        try:
            # Disable album
            resp_disable = self.session.patch(
                f"{BASE_URL}/projects/{self.project_id}",
                json={"album_enabled": False},
                timeout=10
            )
            if resp_disable.status_code != 200:
                print_fail(f"Disable album failed: {resp_disable.status_code} - {resp_disable.text[:200]}")
                return False
            print_pass(f"Album disabled")
            
            # Try to like while disabled
            resp_like = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": self.photo_id, "liked": True},
                timeout=10
            )
            if resp_like.status_code != 403:
                print_fail(f"Expected 403 when album disabled, got: {resp_like.status_code}")
                return False
            print_pass(f"Like rejected with 403 when album disabled")
            
            # Re-enable album
            resp_enable = self.session.patch(
                f"{BASE_URL}/projects/{self.project_id}",
                json={"album_enabled": True},
                timeout=10
            )
            if resp_enable.status_code != 200:
                print_fail(f"Re-enable album failed: {resp_enable.status_code} - {resp_enable.text[:200]}")
                return False
            print_pass(f"Album re-enabled")
            
            # Verify like works again
            resp_verify = requests.post(
                f"{BASE_URL}/public/album/{self.project_slug}/like",
                json={"photo_id": self.photo_id, "liked": True},
                timeout=10
            )
            if resp_verify.status_code != 200:
                print_fail(f"Like after re-enable failed: {resp_verify.status_code}")
                return False
            print_pass(f"Like works after re-enable")
            
            return True
            
        except Exception as e:
            print_fail(f"Test 8 exception: {e}")
            return False
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("\n" + "="*60)
        print("MOMENTIS ALBUM PHOTO LIKES API TEST SUITE")
        print("="*60)
        
        results = []
        
        # Setup: Login
        if not self.login():
            print("\n❌ LOGIN FAILED - Cannot proceed with tests")
            return False
        
        # Setup: Create project and upload photo
        if not self.setup_project_and_photo():
            print("\n❌ SETUP FAILED - Cannot proceed with tests")
            return False
        
        # Run all test scenarios
        test_methods = [
            ("Test 1: Baseline - likes:0", self.test_1_baseline_likes_zero),
            ("Test 2: Like once - likes:1", self.test_2_like_once),
            ("Test 3: Like again - likes:2", self.test_3_like_again),
            ("Test 4: Unlike sequence (clamp at 0)", self.test_4_unlike_sequence),
            ("Test 5: Verify final count", self.test_5_verify_final_count),
            ("Test 6: Unknown photo_id -> 404", self.test_6_unknown_photo),
            ("Test 7: Unknown slug -> 404", self.test_7_unknown_slug),
            ("Test 8: Disabled album -> 403", self.test_8_disabled_album),
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
    tester = AlbumLikesTest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
