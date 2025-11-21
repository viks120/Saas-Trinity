#!/usr/bin/env python3
"""
Simple test script for registration and login functionality.
"""

import requests
import time
import sys

BASE_URL = "http://localhost/api"

def test_health():
    """Test that the API is responding."""
    print("\n=== Testing Health Endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        print("✓ Health check passed")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_registration():
    """Test user registration."""
    print("\n=== Testing User Registration ===")
    
    # Use a unique email with timestamp
    email = f"testuser_{int(time.time())}@example.com"
    password = "testpass123"
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={"email": email, "password": password},
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "email" in data
            assert data["email"] == email.lower()
            assert "id" in data
            print(f"✓ Registration successful - User ID: {data['id']}")
            
            # Check if session cookie was set
            if 'session' in response.cookies:
                print("✓ Session cookie set")
            else:
                print("⚠ No session cookie in response")
            
            return email, password, response.cookies
        else:
            print(f"✗ Registration failed: {response.text}")
            return None, None, None
            
    except Exception as e:
        print(f"✗ Registration error: {e}")
        return None, None, None

def test_login(email, password):
    """Test user login."""
    print("\n=== Testing User Login ===")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            assert "user" in data
            assert data["user"]["email"] == email.lower()
            print(f"✓ Login successful - User: {data['user']['email']}")
            
            # Check if session cookie was set
            if 'session' in response.cookies:
                print("✓ Session cookie set")
            else:
                print("⚠ No session cookie in response")
            
            return response.cookies
        else:
            print(f"✗ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Login error: {e}")
        return None

def test_protected_endpoint(cookies):
    """Test accessing a protected endpoint with session."""
    print("\n=== Testing Protected Endpoint ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            cookies=cookies,
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            assert "email" in data
            print(f"✓ Protected endpoint accessible - User: {data['email']}")
            return True
        else:
            print(f"✗ Protected endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Protected endpoint error: {e}")
        return False

def test_protected_endpoint_without_auth():
    """Test that protected endpoints reject unauthenticated requests."""
    print("\n=== Testing Protected Endpoint Without Auth ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Unauthenticated request correctly rejected")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Test error: {e}")
        return False

def test_invalid_login():
    """Test login with invalid credentials."""
    print("\n=== Testing Invalid Login ===")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpass"},
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Invalid credentials correctly rejected")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Test error: {e}")
        return False

def test_admin_login():
    """Test admin login with default credentials."""
    print("\n=== Testing Admin Login ===")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@example.com", "password": "admin123"},
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            assert data["user"]["is_admin"] == True
            print("✓ Admin login successful")
            return response.cookies
        else:
            print(f"✗ Admin login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Admin login error: {e}")
        return None

def test_logout(cookies):
    """Test logout functionality."""
    print("\n=== Testing Logout ===")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/logout",
            cookies=cookies,
            timeout=5
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✓ Logout successful")
            return True
        else:
            print(f"✗ Logout failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Logout error: {e}")
        return False

def main():
    """Run all authentication tests."""
    print("="*60)
    print("Authentication Flow Tests")
    print("="*60)
    
    results = []
    
    # Test 1: Health check
    results.append(("Health Check", test_health()))
    
    # Test 2: Registration
    email, password, cookies = test_registration()
    results.append(("Registration", email is not None))
    
    if email and password:
        # Test 3: Login
        login_cookies = test_login(email, password)
        results.append(("Login", login_cookies is not None))
        
        if login_cookies:
            # Test 4: Protected endpoint with auth
            results.append(("Protected Endpoint (Authenticated)", test_protected_endpoint(login_cookies)))
            
            # Test 5: Logout
            results.append(("Logout", test_logout(login_cookies)))
    
    # Test 6: Protected endpoint without auth
    results.append(("Protected Endpoint (Unauthenticated)", test_protected_endpoint_without_auth()))
    
    # Test 7: Invalid login
    results.append(("Invalid Login", test_invalid_login()))
    
    # Test 8: Admin login
    admin_cookies = test_admin_login()
    results.append(("Admin Login", admin_cookies is not None))
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed!")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
