#!/usr/bin/env python3
"""
Automated verification script for SaaS Starter Kit.
Tests all requirements from task 27.
"""

import requests
import time
import sys
import json
from typing import Dict, Optional

# Configuration
BASE_URL = "http://localhost"
API_URL = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "testpass123"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

class VerificationTest:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.session = requests.Session()
        self.admin_session = requests.Session()
        
    def log(self, message: str, status: str = "info"):
        """Log a message with color."""
        if status == "pass":
            print(f"{GREEN}✓{RESET} {message}")
            self.passed += 1
        elif status == "fail":
            print(f"{RED}✗{RESET} {message}")
            self.failed += 1
        elif status == "warn":
            print(f"{YELLOW}⚠{RESET} {message}")
        else:
            print(f"  {message}")
    
    def test_health_check(self) -> bool:
        """Test health endpoint is accessible."""
        try:
            response = self.session.get(f"{API_URL}/health", timeout=5)
            if response.status_code == 200 and response.json().get("status") == "ok":
                self.log("Health check endpoint responds correctly", "pass")
                return True
            else:
                self.log(f"Health check failed: {response.status_code}", "fail")
                return False
        except Exception as e:
            self.log(f"Health check error: {str(e)}", "fail")
            return False
    
    def test_register_user(self) -> bool:
        """Test user registration."""
        try:
            response = self.session.post(
                f"{API_URL}/auth/register",
                json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
                timeout=5
            )
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("email") == TEST_USER_EMAIL:
                    self.log("User registration successful", "pass")
                    return True
            elif response.status_code == 409:
                # User already exists, try to login instead
                self.log("User already exists (409), will test login", "warn")
                return True
            
            self.log(f"Registration failed: {response.status_code} - {response.text}", "fail")
            return False
        except Exception as e:
            self.log(f"Registration error: {str(e)}", "fail")
            return False
    
    def test_login(self, email: str, password: str, session: requests.Session) -> bool:
        """Test user login."""
        try:
            response = session.post(
                f"{API_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("user", {}).get("email") == email:
                    self.log(f"Login successful for {email}", "pass")
                    return True
            
            self.log(f"Login failed: {response.status_code} - {response.text}", "fail")
            return False
        except Exception as e:
            self.log(f"Login error: {str(e)}", "fail")
            return False
    
    def test_protected_endpoint_with_auth(self) -> bool:
        """Test accessing protected endpoint with valid session."""
        try:
            response = self.session.get(f"{API_URL}/tiers", timeout=5)
            if response.status_code == 200:
                self.log("Protected endpoint accessible with valid session", "pass")
                return True
            else:
                self.log(f"Protected endpoint failed: {response.status_code}", "fail")
                return False
        except Exception as e:
            self.log(f"Protected endpoint error: {str(e)}", "fail")
            return False
    
    def test_protected_endpoint_without_auth(self) -> bool:
        """Test accessing protected endpoint without session."""
        try:
            # Create new session without cookies
            no_auth_session = requests.Session()
            response = no_auth_session.get(f"{API_URL}/admin/users", timeout=5)
            if response.status_code == 401:
                self.log("Protected endpoint correctly rejects unauthenticated requests", "pass")
                return True
            else:
                self.log(f"Protected endpoint should return 401, got {response.status_code}", "fail")
                return False
        except Exception as e:
            self.log(f"Unauthenticated test error: {str(e)}", "fail")
            return False
    
    def test_admin_create_tier(self) -> Dict:
        """Test admin creating a new tier."""
        try:
            tier_data = {
                "name": f"Test Tier {int(time.time())}",
                "price_cents": 1999,
                "features": {
                    "max_projects": 10,
                    "advanced_reports": True,
                    "api_access": True
                }
            }
            response = self.admin_session.post(
                f"{API_URL}/tiers",
                json=tier_data,
                timeout=5
            )
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("name") == tier_data["name"]:
                    self.log("Admin successfully created tier", "pass")
                    return data
            
            self.log(f"Tier creation failed: {response.status_code} - {response.text}", "fail")
            return None
        except Exception as e:
            self.log(f"Tier creation error: {str(e)}", "fail")
            return None
    
    def test_admin_list_users(self) -> list:
        """Test admin listing users."""
        try:
            response = self.admin_session.get(f"{API_URL}/admin/users", timeout=5)
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list) and len(users) > 0:
                    self.log(f"Admin successfully listed {len(users)} users", "pass")
                    return users
            
            self.log(f"User listing failed: {response.status_code}", "fail")
            return []
        except Exception as e:
            self.log(f"User listing error: {str(e)}", "fail")
            return []
    
    def test_admin_assign_tier(self, user_id: int, tier_id: int) -> bool:
        """Test admin assigning tier to user."""
        try:
            response = self.admin_session.post(
                f"{API_URL}/users/{user_id}/tier",
                json={"tier_id": tier_id},
                timeout=5
            )
            if response.status_code == 200:
                self.log("Admin successfully assigned tier to user", "pass")
                return True
            
            self.log(f"Tier assignment failed: {response.status_code} - {response.text}", "fail")
            return False
        except Exception as e:
            self.log(f"Tier assignment error: {str(e)}", "fail")
            return False
    
    def test_feature_flags_list(self) -> list:
        """Test listing feature flags."""
        try:
            response = self.admin_session.get(f"{API_URL}/features", timeout=5)
            if response.status_code == 200:
                flags = response.json()
                if isinstance(flags, list):
                    self.log(f"Successfully listed {len(flags)} feature flags", "pass")
                    return flags
            
            self.log(f"Feature flag listing failed: {response.status_code}", "fail")
            return []
        except Exception as e:
            self.log(f"Feature flag listing error: {str(e)}", "fail")
            return []
    
    def test_feature_flag_toggle(self, flag_name: str, enabled: bool) -> bool:
        """Test toggling a feature flag."""
        try:
            response = self.admin_session.put(
                f"{API_URL}/features/{flag_name}",
                json={"enabled": enabled},
                timeout=5
            )
            if response.status_code == 200:
                self.log(f"Successfully toggled feature flag '{flag_name}' to {enabled}", "pass")
                return True
            
            self.log(f"Feature flag toggle failed: {response.status_code}", "fail")
            return False
        except Exception as e:
            self.log(f"Feature flag toggle error: {str(e)}", "fail")
            return False
    
    def test_feature_gating_disabled(self) -> bool:
        """Test that disabled feature flags return 404."""
        try:
            # First ensure the flag is disabled
            self.admin_session.put(
                f"{API_URL}/features/advanced_feature",
                json={"enabled": False},
                timeout=5
            )
            time.sleep(0.5)
            
            # Try to access the gated endpoint
            response = self.admin_session.get(f"{API_URL}/example/advanced-feature", timeout=5)
            if response.status_code == 404:
                self.log("Disabled feature flag correctly returns 404", "pass")
                return True
            else:
                self.log(f"Expected 404 for disabled flag, got {response.status_code}", "fail")
                return False
        except Exception as e:
            self.log(f"Feature gating test error: {str(e)}", "fail")
            return False
    
    def test_feature_gating_enabled_with_access(self) -> bool:
        """Test that enabled feature flags with tier access grant access."""
        try:
            # Enable the flag
            self.admin_session.put(
                f"{API_URL}/features/advanced_feature",
                json={"enabled": True},
                timeout=5
            )
            time.sleep(0.5)
            
            # Admin should have access (assuming Enterprise tier with advanced_reports)
            response = self.admin_session.get(f"{API_URL}/example/advanced-feature", timeout=5)
            if response.status_code == 200:
                self.log("Enabled feature flag with tier access grants access", "pass")
                return True
            else:
                self.log(f"Expected 200 for enabled flag with access, got {response.status_code}", "fail")
                return False
        except Exception as e:
            self.log(f"Feature gating with access test error: {str(e)}", "fail")
            return False
    
    def test_non_admin_access_denied(self) -> bool:
        """Test that non-admin users cannot access admin endpoints."""
        try:
            response = self.session.get(f"{API_URL}/admin/users", timeout=5)
            if response.status_code == 403:
                self.log("Non-admin correctly denied access to admin endpoints", "pass")
                return True
            else:
                self.log(f"Expected 403 for non-admin, got {response.status_code}", "fail")
                return False
        except Exception as e:
            self.log(f"Non-admin access test error: {str(e)}", "fail")
            return False
    
    def run_all_tests(self):
        """Run all verification tests."""
        print("\n" + "="*60)
        print("SaaS Starter Kit - Automated Verification")
        print("="*60 + "\n")
        
        # Wait for services to be ready
        print("Waiting for services to be ready...")
        max_retries = 30
        for i in range(max_retries):
            try:
                response = requests.get(f"{API_URL}/health", timeout=2)
                if response.status_code == 200:
                    print(f"{GREEN}Services are ready!{RESET}\n")
                    break
            except:
                pass
            time.sleep(2)
            if i == max_retries - 1:
                print(f"{RED}Services did not start in time{RESET}")
                sys.exit(1)
        
        # Test 1: Health Check
        print("\n--- Test 1: Health Check ---")
        self.test_health_check()
        
        # Test 2: Authentication Flow
        print("\n--- Test 2: Authentication Flow ---")
        self.test_register_user()
        self.test_login(TEST_USER_EMAIL, TEST_USER_PASSWORD, self.session)
        self.test_login(ADMIN_EMAIL, ADMIN_PASSWORD, self.admin_session)
        
        # Test 3: Protected Endpoints
        print("\n--- Test 3: Protected Endpoints ---")
        self.test_protected_endpoint_with_auth()
        self.test_protected_endpoint_without_auth()
        
        # Test 4: Admin Workflow
        print("\n--- Test 4: Admin Workflow ---")
        tier = self.test_admin_create_tier()
        users = self.test_admin_list_users()
        
        if tier and users:
            # Find test user and assign tier
            test_user = next((u for u in users if u.get("email") == TEST_USER_EMAIL), None)
            if test_user:
                self.test_admin_assign_tier(test_user["id"], tier["id"])
        
        # Test 5: Feature Gating
        print("\n--- Test 5: Feature Gating ---")
        self.test_feature_flags_list()
        self.test_feature_gating_disabled()
        self.test_feature_gating_enabled_with_access()
        
        # Test 6: Authorization
        print("\n--- Test 6: Authorization ---")
        self.test_non_admin_access_denied()
        
        # Summary
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)
        print(f"{GREEN}Passed: {self.passed}{RESET}")
        print(f"{RED}Failed: {self.failed}{RESET}")
        print(f"Total: {self.passed + self.failed}")
        
        if self.failed == 0:
            print(f"\n{GREEN}✓ All tests passed!{RESET}\n")
            return 0
        else:
            print(f"\n{RED}✗ Some tests failed{RESET}\n")
            return 1

if __name__ == "__main__":
    tester = VerificationTest()
    sys.exit(tester.run_all_tests())
