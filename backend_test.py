#!/usr/bin/env python3
"""
MOMENTIS Backend API Test Suite
Tests all endpoints in /app/app/api/[[...path]]/route.js
"""

import requests
import json
import random
import string
from datetime import datetime

# Base URL from .env
BASE_URL = "https://ozel-anlar-tasarimi.preview.emergentagent.com/api"

def generate_random_email():
    """Generate a random test email"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test+{random_str}@example.com"

def print_test_header(test_name):
    """Print a formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(passed, message, response=None):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")
    if response:
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        except:
            print(f"Response Text: {response.text[:500]}")
    print()

# Track email send attempts
email_send_count = 0
MAX_EMAIL_SENDS = 2

def main():
    global email_send_count
    
    print(f"\n{'#'*80}")
    print(f"# MOMENTIS Backend API Test Suite")
    print(f"# Base URL: {BASE_URL}")
    print(f"# Started: {datetime.now().isoformat()}")
    print(f"{'#'*80}\n")

    # ========================================================================
    # TEST 1: GET /api/health
    # ========================================================================
    print_test_header("1. GET /api/health")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        data = response.json()
        passed = response.status_code == 200 and data.get('ok') == True
        print_result(passed, "Health check endpoint", response)
    except Exception as e:
        print_result(False, f"Health check failed with exception: {str(e)}")

    # ========================================================================
    # TEST 2: GET /api/event-types
    # ========================================================================
    print_test_header("2. GET /api/event-types")
    try:
        response = requests.get(f"{BASE_URL}/event-types", timeout=10)
        data = response.json()
        
        has_items = 'items' in data
        has_styles = 'styles' in data
        items_count = len(data.get('items', []))
        styles_count = len(data.get('styles', []))
        
        passed = (response.status_code == 200 and 
                 has_items and has_styles and 
                 items_count == 7 and styles_count == 5)
        
        msg = f"Event types: {items_count} items, {styles_count} styles (expected 7 items, 5 styles)"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Event types failed with exception: {str(e)}")

    # ========================================================================
    # TEST 3: GET /api/packages
    # ========================================================================
    print_test_header("3. GET /api/packages")
    try:
        response = requests.get(f"{BASE_URL}/packages", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check for expected package names
        package_names = [item.get('name', '').lower() for item in items]
        has_baslangic = any('baslangic' in name or 'başlangıç' in name for name in package_names)
        has_premium = any('premium' in name for name in package_names)
        has_atolye = any('atolye' in name or 'atölye' in name for name in package_names)
        
        passed = (response.status_code == 200 and 
                 items_count == 3 and 
                 has_baslangic and has_premium and has_atolye)
        
        msg = f"Packages: {items_count} items (expected 3: baslangic, premium, atolye)"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Packages failed with exception: {str(e)}")

    # ========================================================================
    # TEST 4: GET /api/templates (basic)
    # ========================================================================
    print_test_header("4. GET /api/templates (basic)")
    try:
        response = requests.get(f"{BASE_URL}/templates", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        total = data.get('total', 0)
        items_count = len(items)
        
        # Check that items don't contain _id
        has_id_field = any('_id' in item for item in items)
        
        passed = (response.status_code == 200 and 
                 items_count == 13 and 
                 total == 13 and 
                 not has_id_field)
        
        msg = f"Templates: {items_count} items, total={total} (expected 13), _id field present: {has_id_field}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Templates basic failed with exception: {str(e)}")

    # ========================================================================
    # TEST 5: GET /api/templates?category=dugun
    # ========================================================================
    print_test_header("5. GET /api/templates?category=dugun")
    try:
        response = requests.get(f"{BASE_URL}/templates?category=dugun", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check all items have category=dugun
        all_dugun = all(item.get('category') == 'dugun' for item in items)
        
        passed = (response.status_code == 200 and 
                 items_count == 7 and 
                 all_dugun)
        
        msg = f"Templates filtered by category=dugun: {items_count} items (expected 7), all have category=dugun: {all_dugun}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Templates category filter failed with exception: {str(e)}")

    # ========================================================================
    # TEST 6: GET /api/templates?style=botanik
    # ========================================================================
    print_test_header("6. GET /api/templates?style=botanik")
    try:
        response = requests.get(f"{BASE_URL}/templates?style=botanik", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check all items have style=botanik
        all_botanik = all(item.get('style') == 'botanik' for item in items)
        
        passed = (response.status_code == 200 and 
                 items_count > 0 and 
                 all_botanik)
        
        msg = f"Templates filtered by style=botanik: {items_count} items, all have style=botanik: {all_botanik}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Templates style filter failed with exception: {str(e)}")

    # ========================================================================
    # TEST 7: GET /api/templates?tier=free
    # ========================================================================
    print_test_header("7. GET /api/templates?tier=free")
    try:
        response = requests.get(f"{BASE_URL}/templates?tier=free", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check all items have tier=free
        all_free = all(item.get('tier') == 'free' for item in items)
        
        passed = (response.status_code == 200 and 
                 items_count > 0 and 
                 all_free)
        
        msg = f"Templates filtered by tier=free: {items_count} items, all have tier=free: {all_free}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Templates tier filter failed with exception: {str(e)}")

    # ========================================================================
    # TEST 8: GET /api/templates?q=aurelia
    # ========================================================================
    print_test_header("8. GET /api/templates?q=aurelia")
    try:
        response = requests.get(f"{BASE_URL}/templates?q=aurelia", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check that aurelia is in the results
        has_aurelia = any('aurelia' in item.get('slug', '').lower() or 
                         'aurelia' in item.get('name', '').lower() 
                         for item in items)
        
        passed = (response.status_code == 200 and 
                 items_count == 1 and 
                 has_aurelia)
        
        msg = f"Templates search q=aurelia: {items_count} items (expected 1), has aurelia: {has_aurelia}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Templates search failed with exception: {str(e)}")

    # ========================================================================
    # TEST 9: GET /api/templates with combined filters
    # ========================================================================
    print_test_header("9. GET /api/templates?category=dugun&style=botanik")
    try:
        response = requests.get(f"{BASE_URL}/templates?category=dugun&style=botanik", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check all items match both filters
        all_match = all(item.get('category') == 'dugun' and item.get('style') == 'botanik' 
                       for item in items)
        
        passed = (response.status_code == 200 and 
                 items_count >= 0 and 
                 all_match)
        
        msg = f"Templates combined filters: {items_count} items, all match filters: {all_match}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Templates combined filters failed with exception: {str(e)}")

    # ========================================================================
    # TEST 10: GET /api/templates?category=nonexistent
    # ========================================================================
    print_test_header("10. GET /api/templates?category=nonexistent")
    try:
        response = requests.get(f"{BASE_URL}/templates?category=nonexistent", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        passed = (response.status_code == 200 and items_count == 0)
        
        msg = f"Templates nonexistent category: {items_count} items (expected 0)"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Templates nonexistent category failed with exception: {str(e)}")

    # ========================================================================
    # TEST 11: GET /api/templates/aurelia
    # ========================================================================
    print_test_header("11. GET /api/templates/aurelia")
    try:
        response = requests.get(f"{BASE_URL}/templates/aurelia", timeout=10)
        data = response.json()
        
        has_slug = data.get('slug') == 'aurelia'
        has_palette = 'palette' in data
        has_features = 'features' in data and isinstance(data.get('features'), list)
        
        passed = (response.status_code == 200 and 
                 has_slug and has_palette and has_features)
        
        msg = f"Template aurelia: slug correct: {has_slug}, has palette: {has_palette}, has features array: {has_features}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Template aurelia failed with exception: {str(e)}")

    # ========================================================================
    # TEST 12: GET /api/templates/does-not-exist
    # ========================================================================
    print_test_header("12. GET /api/templates/does-not-exist")
    try:
        response = requests.get(f"{BASE_URL}/templates/does-not-exist", timeout=10)
        
        passed = response.status_code == 404
        
        msg = f"Template not found returns 404"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Template not found test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 13: POST /api/leads (new email)
    # ========================================================================
    print_test_header("13. POST /api/leads (new email)")
    try:
        test_email = generate_random_email()
        payload = {
            "email": test_email,
            "source": "footer"
        }
        response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
        data = response.json()
        
        has_ok = data.get('ok') == True
        has_lead = 'lead' in data
        lead = data.get('lead', {})
        has_id = 'id' in lead and lead.get('id')
        email_match = lead.get('email') == test_email
        source_match = lead.get('source') == 'footer'
        
        passed = (response.status_code == 201 and 
                 has_ok and has_lead and has_id and 
                 email_match and source_match)
        
        msg = f"Lead created: status 201, ok: {has_ok}, has id: {has_id}, email match: {email_match}, source match: {source_match}"
        print_result(passed, msg, response)
        
        # Store email for duplicate test
        duplicate_test_email = test_email
    except Exception as e:
        print_result(False, f"Lead creation failed with exception: {str(e)}")
        duplicate_test_email = None

    # ========================================================================
    # TEST 14: POST /api/leads (duplicate email)
    # ========================================================================
    print_test_header("14. POST /api/leads (duplicate email)")
    try:
        if duplicate_test_email:
            payload = {
                "email": duplicate_test_email,
                "source": "footer"
            }
            response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
            data = response.json()
            
            has_ok = data.get('ok') == True
            has_duplicate = data.get('duplicate') == True
            
            passed = (response.status_code == 200 and 
                     has_ok and has_duplicate)
            
            msg = f"Lead duplicate: status 200, ok: {has_ok}, duplicate: {has_duplicate}"
            print_result(passed, msg, response)
        else:
            print_result(False, "Skipped: previous test failed")
    except Exception as e:
        print_result(False, f"Lead duplicate test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 15: POST /api/leads (invalid email)
    # ========================================================================
    print_test_header("15. POST /api/leads (invalid email)")
    try:
        payload = {
            "email": "notanemail",
            "source": "footer"
        }
        response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
        
        passed = response.status_code == 400
        
        msg = f"Lead invalid email returns 400"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Lead invalid email test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 16: POST /api/leads (empty body)
    # ========================================================================
    print_test_header("16. POST /api/leads (empty body)")
    try:
        response = requests.post(f"{BASE_URL}/leads", json={}, timeout=10)
        
        passed = response.status_code == 400
        
        msg = f"Lead empty body returns 400"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Lead empty body test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 17: GET /api/messaging/status
    # ========================================================================
    print_test_header("17. GET /api/messaging/status")
    try:
        response = requests.get(f"{BASE_URL}/messaging/status", timeout=10)
        data = response.json()
        
        email_config = data.get('email', {})
        sms_config = data.get('sms', {})
        types = data.get('types', [])
        
        email_configured = email_config.get('configured') == True
        email_sender = email_config.get('sender', '')
        has_resend_dev = 'resend.dev' in email_sender
        email_provider = email_config.get('provider') == 'resend'
        
        sms_configured = sms_config.get('configured') == False
        sms_provider = sms_config.get('provider') == 'twilio'
        
        has_types = len(types) == 3 and 'invitation' in types and 'rsvp' in types and 'reminder' in types
        
        passed = (response.status_code == 200 and 
                 email_configured and has_resend_dev and email_provider and
                 sms_configured and sms_provider and has_types)
        
        msg = f"Messaging status: email configured: {email_configured}, sender has resend.dev: {has_resend_dev}, sms not configured: {sms_configured}, types: {types}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Messaging status failed with exception: {str(e)}")

    # ========================================================================
    # TEST 18: POST /api/messaging/preview (email invitation)
    # ========================================================================
    print_test_header("18. POST /api/messaging/preview (email invitation)")
    try:
        payload = {
            "channel": "email",
            "type": "invitation",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/preview", json=payload, timeout=10)
        data = response.json()
        
        channel_match = data.get('channel') == 'email'
        has_subject = 'subject' in data and isinstance(data.get('subject'), str)
        has_html = 'html' in data and isinstance(data.get('html'), str)
        html_contains_name = 'Ayşe' in data.get('html', '')
        
        passed = (response.status_code == 200 and 
                 channel_match and has_subject and has_html and html_contains_name)
        
        msg = f"Email preview: channel: {data.get('channel')}, has subject: {has_subject}, has html: {has_html}, contains name: {html_contains_name}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Email preview failed with exception: {str(e)}")

    # ========================================================================
    # TEST 19: POST /api/messaging/preview (sms invitation)
    # ========================================================================
    print_test_header("19. POST /api/messaging/preview (sms invitation)")
    try:
        payload = {
            "channel": "sms",
            "type": "invitation",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/preview", json=payload, timeout=10)
        data = response.json()
        
        channel_match = data.get('channel') == 'sms'
        has_body = 'body' in data and isinstance(data.get('body'), str)
        body_contains_name = 'Ayşe' in data.get('body', '')
        body_contains_url = 'https://example.com/d/x' in data.get('body', '')
        
        passed = (response.status_code == 200 and 
                 channel_match and has_body and body_contains_name and body_contains_url)
        
        msg = f"SMS preview: channel: {data.get('channel')}, has body: {has_body}, contains name: {body_contains_name}, contains URL: {body_contains_url}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"SMS preview failed with exception: {str(e)}")

    # ========================================================================
    # TEST 20: POST /api/messaging/preview (rsvp)
    # ========================================================================
    print_test_header("20. POST /api/messaging/preview (email rsvp)")
    try:
        payload = {
            "channel": "email",
            "type": "rsvp",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün"
        }
        response = requests.post(f"{BASE_URL}/messaging/preview", json=payload, timeout=10)
        data = response.json()
        
        channel_match = data.get('channel') == 'email'
        has_subject = 'subject' in data
        has_html = 'html' in data
        
        passed = (response.status_code == 200 and 
                 channel_match and has_subject and has_html)
        
        msg = f"RSVP preview: channel: {data.get('channel')}, has subject: {has_subject}, has html: {has_html}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"RSVP preview failed with exception: {str(e)}")

    # ========================================================================
    # TEST 21: POST /api/messaging/preview (reminder)
    # ========================================================================
    print_test_header("21. POST /api/messaging/preview (email reminder)")
    try:
        payload = {
            "channel": "email",
            "type": "reminder",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/preview", json=payload, timeout=10)
        data = response.json()
        
        channel_match = data.get('channel') == 'email'
        has_subject = 'subject' in data
        has_html = 'html' in data
        
        passed = (response.status_code == 200 and 
                 channel_match and has_subject and has_html)
        
        msg = f"Reminder preview: channel: {data.get('channel')}, has subject: {has_subject}, has html: {has_html}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Reminder preview failed with exception: {str(e)}")

    # ========================================================================
    # TEST 22: POST /api/messaging/send (missing channel)
    # ========================================================================
    print_test_header("22. POST /api/messaging/send (missing channel)")
    try:
        payload = {
            "type": "invitation",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/send", json=payload, timeout=10)
        
        passed = response.status_code == 400
        
        msg = f"Send missing channel returns 400"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Send missing channel test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 23: POST /api/messaging/send (invalid channel)
    # ========================================================================
    print_test_header("23. POST /api/messaging/send (invalid channel)")
    try:
        payload = {
            "channel": "invalid",
            "type": "invitation",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/send", json=payload, timeout=10)
        
        passed = response.status_code == 400
        
        msg = f"Send invalid channel returns 400"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Send invalid channel test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 24: POST /api/messaging/send (invalid type)
    # ========================================================================
    print_test_header("24. POST /api/messaging/send (invalid type)")
    try:
        payload = {
            "channel": "email",
            "type": "invalid_type",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/send", json=payload, timeout=10)
        
        passed = response.status_code == 400
        
        msg = f"Send invalid type returns 400"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Send invalid type test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 25: POST /api/messaging/send (email invitation without URL)
    # ========================================================================
    print_test_header("25. POST /api/messaging/send (email invitation without URL)")
    try:
        payload = {
            "channel": "email",
            "type": "invitation",
            "to": "test@example.com",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün"
        }
        response = requests.post(f"{BASE_URL}/messaging/send", json=payload, timeout=10)
        
        passed = response.status_code == 400
        
        msg = f"Send email invitation without URL returns 400"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Send email invitation without URL test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 26: POST /api/messaging/send (invalid email)
    # ========================================================================
    print_test_header("26. POST /api/messaging/send (invalid email)")
    try:
        payload = {
            "channel": "email",
            "type": "invitation",
            "to": "notanemail",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/send", json=payload, timeout=10)
        
        passed = response.status_code == 400
        
        msg = f"Send invalid email returns 400"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Send invalid email test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 27: POST /api/messaging/send (SMS - Twilio not configured)
    # ========================================================================
    print_test_header("27. POST /api/messaging/send (SMS - Twilio not configured)")
    try:
        payload = {
            "channel": "sms",
            "type": "invitation",
            "to": "+905551234567",
            "guestName": "Ayşe",
            "eventTitle": "Test Düğün",
            "invitationUrl": "https://example.com/d/x"
        }
        response = requests.post(f"{BASE_URL}/messaging/send", json=payload, timeout=10)
        
        passed = response.status_code == 503
        
        msg = f"Send SMS with Twilio not configured returns 503"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Send SMS test failed with exception: {str(e)}")

    # ========================================================================
    # TEST 28: POST /api/messaging/send (REAL EMAIL SEND - LIMITED TO 1 ATTEMPT)
    # ========================================================================
    print_test_header("28. POST /api/messaging/send (REAL EMAIL SEND)")
    print("⚠️  WARNING: This will make a REAL email send attempt via Resend")
    print("⚠️  Expected: Either 201 (sent) or 502 (failed due to test sender restriction)")
    try:
        if email_send_count >= MAX_EMAIL_SENDS:
            print_result(False, f"Skipped: Already made {email_send_count} email send attempts (max {MAX_EMAIL_SENDS})")
        else:
            email_send_count += 1
            payload = {
                "channel": "email",
                "type": "invitation",
                "to": "test@example.com",
                "guestName": "Ayşe Yılmaz",
                "eventTitle": "Test Düğün Davetiyesi",
                "invitationUrl": "https://example.com/d/test123"
            }
            response = requests.post(f"{BASE_URL}/messaging/send", json=payload, timeout=15)
            data = response.json()
            
            # Both 201 (sent) and 502 (failed) are acceptable
            status_ok = response.status_code in [201, 502]
            has_message = 'message' in data
            message = data.get('message', {})
            message_status = message.get('status')
            
            if response.status_code == 201:
                # Success case
                passed = (data.get('ok') == True and 
                         message_status == 'sent' and 
                         'provider_id' in message)
                msg = f"Email sent successfully: status {response.status_code}, message status: {message_status}, provider_id: {message.get('provider_id')}"
            else:
                # Expected failure case (502)
                passed = (data.get('ok') == False and 
                         message_status == 'failed' and 
                         'error' in data)
                error_msg = data.get('error', '')
                msg = f"Email send failed as expected (test sender restriction): status {response.status_code}, message status: {message_status}, error: {error_msg}"
            
            print_result(passed, msg, response)
            
            # Store for log verification
            real_send_status = message_status
            real_send_to = "test@example.com"
    except Exception as e:
        print_result(False, f"Real email send test failed with exception: {str(e)}")
        real_send_status = None
        real_send_to = None

    # ========================================================================
    # TEST 29: GET /api/messaging/logs (basic)
    # ========================================================================
    print_test_header("29. GET /api/messaging/logs?limit=5")
    try:
        response = requests.get(f"{BASE_URL}/messaging/logs?limit=5", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check that items don't contain _id
        has_id_field = any('_id' in item for item in items)
        
        # Check if our real send is in the logs
        found_real_send = False
        if real_send_status and real_send_to:
            for item in items:
                if (item.get('channel') == 'email' and 
                    item.get('type') == 'invitation' and 
                    item.get('to') == real_send_to):
                    found_real_send = True
                    print(f"Found real send log: status={item.get('status')}, to={item.get('to')}")
                    break
        
        passed = (response.status_code == 200 and 
                 items_count <= 5 and 
                 not has_id_field)
        
        msg = f"Messaging logs: {items_count} items (limit 5), _id field present: {has_id_field}, found real send: {found_real_send}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Messaging logs failed with exception: {str(e)}")

    # ========================================================================
    # TEST 30: GET /api/messaging/logs?channel=sms
    # ========================================================================
    print_test_header("30. GET /api/messaging/logs?channel=sms")
    try:
        response = requests.get(f"{BASE_URL}/messaging/logs?channel=sms", timeout=10)
        data = response.json()
        
        items = data.get('items', [])
        items_count = len(items)
        
        # Check all items are SMS (or empty)
        all_sms = all(item.get('channel') == 'sms' for item in items) if items else True
        
        passed = (response.status_code == 200 and all_sms)
        
        msg = f"Messaging logs filtered by SMS: {items_count} items, all SMS: {all_sms}"
        print_result(passed, msg, response)
    except Exception as e:
        print_result(False, f"Messaging logs SMS filter failed with exception: {str(e)}")

    # ========================================================================
    # SUMMARY
    # ========================================================================
    print(f"\n{'#'*80}")
    print(f"# Test Suite Complete")
    print(f"# Completed: {datetime.now().isoformat()}")
    print(f"# Total email send attempts: {email_send_count}/{MAX_EMAIL_SENDS}")
    print(f"{'#'*80}\n")

if __name__ == "__main__":
    main()
