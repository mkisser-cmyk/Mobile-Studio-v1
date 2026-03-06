#!/usr/bin/env python3
"""
RailStream Studio External API Integration Tests

This test suite verifies the external API endpoints at https://studio.railstream.net/api
for the RailStream Studio mobile app.

Test Coverage:
1. Login with 2FA authentication flow
2. 2FA verification endpoint behavior
3. Sites API with authentication
4. Unauthorized access validation
"""

import requests
import json
import sys
from typing import Dict, Any, Optional
import time

class RailStreamAPITester:
    def __init__(self):
        self.base_url = "https://studio.railstream.net/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'RailStreamStudio-MobileApp/1.0'
        })
        self.temp_token: Optional[str] = None
        self.access_token: Optional[str] = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_login_with_2fa(self) -> Dict[str, Any]:
        """
        Test the login endpoint that should trigger 2FA requirement.
        Expected behavior: returns requires_2fa=true and temp_token
        """
        self.log("Testing Login with 2FA Authentication")
        
        try:
            url = f"{self.base_url}/auth/login"
            payload = {
                "username": "railstream",
                "password": "Yea$uFTdx(10"
            }
            
            self.log(f"POST {url}")
            self.log(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = self.session.post(url, json=payload, timeout=30)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                self.log(f"Response Body: {json.dumps(response_data, indent=2)}")
            except json.JSONDecodeError:
                response_data = {"error": "Invalid JSON response", "raw": response.text}
                self.log(f"Raw Response: {response.text}")
            
            # Analyze response
            test_result = {
                "endpoint": "/auth/login",
                "status_code": response.status_code,
                "success": False,
                "data": response_data,
                "issues": []
            }
            
            if response.status_code == 200:
                if isinstance(response_data, dict):
                    if response_data.get("requires_2fa") is True:
                        if "temp_token" in response_data and response_data["temp_token"]:
                            self.temp_token = response_data["temp_token"]
                            test_result["success"] = True
                            self.log("✅ Login correctly returned 2FA requirement with temp_token")
                        else:
                            test_result["issues"].append("Missing or empty temp_token in response")
                    elif response_data.get("access_token"):
                        test_result["issues"].append("Login succeeded without 2FA - this may indicate 2FA is disabled")
                    else:
                        test_result["issues"].append("Unexpected response format - no requires_2fa or access_token")
                else:
                    test_result["issues"].append("Response is not a JSON object")
            elif response.status_code == 401:
                test_result["issues"].append("Authentication failed - check credentials")
            elif response.status_code == 400:
                test_result["issues"].append("Bad request - check payload format")
            else:
                test_result["issues"].append(f"Unexpected status code: {response.status_code}")
            
            return test_result
            
        except requests.exceptions.RequestException as e:
            error_result = {
                "endpoint": "/auth/login",
                "success": False,
                "error": str(e),
                "issues": [f"Network/connection error: {str(e)}"]
            }
            self.log(f"❌ Request failed: {e}")
            return error_result
    
    def test_2fa_verification_behavior(self) -> Dict[str, Any]:
        """
        Test 2FA verification endpoint behavior.
        Since we don't have an actual 2FA code, we test the expected error responses.
        """
        self.log("Testing 2FA Verification Endpoint Behavior")
        
        if not self.temp_token:
            return {
                "endpoint": "/auth/verify-2fa",
                "success": False,
                "skipped": True,
                "issues": ["No temp_token available from login - cannot test 2FA verification"]
            }
        
        try:
            url = f"{self.base_url}/auth/verify-2fa"
            
            # Test with invalid 2FA code
            payload = {
                "temp_token": self.temp_token,
                "code": "123456"  # Obviously invalid code
            }
            
            self.log(f"POST {url}")
            self.log(f"Testing with temp_token: {self.temp_token[:20]}...")
            self.log("Testing with invalid 2FA code: 123456")
            
            response = self.session.post(url, json=payload, timeout=30)
            
            self.log(f"Response Status: {response.status_code}")
            
            try:
                response_data = response.json()
                self.log(f"Response Body: {json.dumps(response_data, indent=2)}")
            except json.JSONDecodeError:
                response_data = {"error": "Invalid JSON response", "raw": response.text}
                self.log(f"Raw Response: {response.text}")
            
            test_result = {
                "endpoint": "/auth/verify-2fa",
                "status_code": response.status_code,
                "success": False,
                "data": response_data,
                "issues": []
            }
            
            # Expected behavior: should reject invalid code
            if response.status_code in [400, 401, 422]:
                test_result["success"] = True
                self.log("✅ 2FA endpoint correctly rejected invalid code")
            elif response.status_code == 200:
                test_result["issues"].append("Warning: 2FA endpoint accepted invalid code - security concern")
            else:
                test_result["issues"].append(f"Unexpected status code: {response.status_code}")
            
            # Note: We cannot test successful 2FA without actual code from authenticator
            test_result["note"] = "Cannot test successful 2FA verification without actual authenticator code"
            
            return test_result
            
        except requests.exceptions.RequestException as e:
            error_result = {
                "endpoint": "/auth/verify-2fa",
                "success": False,
                "error": str(e),
                "issues": [f"Network/connection error: {str(e)}"]
            }
            self.log(f"❌ Request failed: {e}")
            return error_result
    
    def test_unauthorized_sites_access(self) -> Dict[str, Any]:
        """
        Test that /sites endpoint properly rejects requests without authentication.
        """
        self.log("Testing Unauthorized Access to Sites Endpoint")
        
        try:
            url = f"{self.base_url}/sites"
            
            # Create session without auth token
            unauth_session = requests.Session()
            unauth_session.headers.update({
                'Content-Type': 'application/json',
                'User-Agent': 'RailStreamStudio-MobileApp/1.0'
            })
            
            self.log(f"GET {url} (without authentication)")
            
            response = unauth_session.get(url, timeout=30)
            
            self.log(f"Response Status: {response.status_code}")
            
            try:
                response_data = response.json()
                self.log(f"Response Body: {json.dumps(response_data, indent=2)}")
            except json.JSONDecodeError:
                response_data = {"error": "Invalid JSON response", "raw": response.text}
                self.log(f"Raw Response: {response.text}")
            
            test_result = {
                "endpoint": "/sites",
                "status_code": response.status_code,
                "success": False,
                "data": response_data,
                "issues": []
            }
            
            # Expected: should return 401 Unauthorized
            if response.status_code == 401:
                test_result["success"] = True
                self.log("✅ Sites endpoint correctly rejected unauthorized access")
            elif response.status_code == 200:
                test_result["issues"].append("Security issue: Sites endpoint allowed unauthorized access")
            elif response.status_code == 403:
                test_result["success"] = True
                self.log("✅ Sites endpoint correctly rejected access (403 Forbidden)")
            else:
                test_result["issues"].append(f"Unexpected status code for unauthorized request: {response.status_code}")
            
            return test_result
            
        except requests.exceptions.RequestException as e:
            error_result = {
                "endpoint": "/sites",
                "success": False,
                "error": str(e),
                "issues": [f"Network/connection error: {str(e)}"]
            }
            self.log(f"❌ Request failed: {e}")
            return error_result
    
    def test_sites_with_invalid_token(self) -> Dict[str, Any]:
        """
        Test sites endpoint with invalid/expired token.
        """
        self.log("Testing Sites Endpoint with Invalid Token")
        
        try:
            url = f"{self.base_url}/sites"
            
            # Create session with invalid token
            invalid_session = requests.Session()
            invalid_session.headers.update({
                'Content-Type': 'application/json',
                'User-Agent': 'RailStreamStudio-MobileApp/1.0',
                'Authorization': 'Bearer invalid_token_12345'
            })
            
            self.log(f"GET {url} (with invalid token)")
            
            response = invalid_session.get(url, timeout=30)
            
            self.log(f"Response Status: {response.status_code}")
            
            try:
                response_data = response.json()
                self.log(f"Response Body: {json.dumps(response_data, indent=2)}")
            except json.JSONDecodeError:
                response_data = {"error": "Invalid JSON response", "raw": response.text}
                self.log(f"Raw Response: {response.text}")
            
            test_result = {
                "endpoint": "/sites (invalid token)",
                "status_code": response.status_code,
                "success": False,
                "data": response_data,
                "issues": []
            }
            
            # Expected: should return 401 Unauthorized
            if response.status_code == 401:
                test_result["success"] = True
                self.log("✅ Sites endpoint correctly rejected invalid token")
            elif response.status_code == 403:
                test_result["success"] = True
                self.log("✅ Sites endpoint correctly rejected invalid token (403 Forbidden)")
            else:
                test_result["issues"].append(f"Unexpected status code for invalid token: {response.status_code}")
            
            return test_result
            
        except requests.exceptions.RequestException as e:
            error_result = {
                "endpoint": "/sites (invalid token)",
                "success": False,
                "error": str(e),
                "issues": [f"Network/connection error: {str(e)}"]
            }
            self.log(f"❌ Request failed: {e}")
            return error_result
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests and return comprehensive results"""
        self.log("=" * 60)
        self.log("STARTING RAILSTREAM STUDIO API INTEGRATION TESTS")
        self.log("=" * 60)
        
        results = {
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0
            },
            "tests": {},
            "critical_issues": [],
            "warnings": []
        }
        
        # Test 1: Login with 2FA
        self.log("\n" + "=" * 40)
        test1_result = self.test_login_with_2fa()
        results["tests"]["login_2fa"] = test1_result
        results["summary"]["total_tests"] += 1
        
        if test1_result["success"]:
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1
            if test1_result.get("issues"):
                results["critical_issues"].extend(test1_result["issues"])
        
        # Test 2: 2FA Verification
        self.log("\n" + "=" * 40)
        test2_result = self.test_2fa_verification_behavior()
        results["tests"]["2fa_verification"] = test2_result
        results["summary"]["total_tests"] += 1
        
        if test2_result.get("skipped"):
            results["summary"]["skipped"] += 1
        elif test2_result["success"]:
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1
            if test2_result.get("issues"):
                results["critical_issues"].extend(test2_result["issues"])
        
        # Test 3: Unauthorized Sites Access
        self.log("\n" + "=" * 40)
        test3_result = self.test_unauthorized_sites_access()
        results["tests"]["unauthorized_sites"] = test3_result
        results["summary"]["total_tests"] += 1
        
        if test3_result["success"]:
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1
            if test3_result.get("issues"):
                results["critical_issues"].extend(test3_result["issues"])
        
        # Test 4: Invalid Token Access
        self.log("\n" + "=" * 40)
        test4_result = self.test_sites_with_invalid_token()
        results["tests"]["invalid_token_sites"] = test4_result
        results["summary"]["total_tests"] += 1
        
        if test4_result["success"]:
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1
            if test4_result.get("issues"):
                results["critical_issues"].extend(test4_result["issues"])
        
        # Final Summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        self.log(f"Total Tests: {results['summary']['total_tests']}")
        self.log(f"Passed: {results['summary']['passed']}")
        self.log(f"Failed: {results['summary']['failed']}")
        self.log(f"Skipped: {results['summary']['skipped']}")
        
        if results["critical_issues"]:
            self.log("\n❌ CRITICAL ISSUES FOUND:")
            for issue in results["critical_issues"]:
                self.log(f"  - {issue}")
        
        if results["summary"]["failed"] == 0 and results["summary"]["passed"] > 0:
            self.log("\n✅ ALL TESTS PASSED!")
        elif results["summary"]["failed"] > 0:
            self.log(f"\n⚠️  {results['summary']['failed']} TESTS FAILED")
        
        return results

def main():
    """Main test execution"""
    tester = RailStreamAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    if results["summary"]["failed"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()