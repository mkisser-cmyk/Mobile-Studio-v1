#!/usr/bin/env python3
"""
Additional API Integration Tests for RailStream Studio
Testing correct field formats and API service compatibility
"""

import requests
import json
import sys
from typing import Dict, Any
import time

class AdditionalAPITester:
    def __init__(self):
        self.base_url = "https://studio.railstream.net/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'RailStreamStudio-MobileApp/1.0'
        })
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_2fa_correct_field_format(self) -> Dict[str, Any]:
        """
        Test 2FA verification with correct field name (totp_code vs code)
        This addresses the field mismatch found in previous test.
        """
        self.log("Testing 2FA Verification with Correct Field Format")
        
        # First get temp_token from login
        try:
            login_url = f"{self.base_url}/auth/login"
            login_payload = {
                "username": "railstream",
                "password": "Yea$uFTdx(10"
            }
            
            login_response = self.session.post(login_url, json=login_payload, timeout=30)
            
            if login_response.status_code != 200:
                return {
                    "test": "2fa_correct_field",
                    "success": False,
                    "issues": ["Failed to get temp_token from login"]
                }
            
            login_data = login_response.json()
            temp_token = login_data.get("temp_token")
            
            if not temp_token:
                return {
                    "test": "2fa_correct_field",
                    "success": False,
                    "issues": ["No temp_token received from login"]
                }
            
            # Now test 2FA with correct field name
            verify_url = f"{self.base_url}/auth/verify-2fa"
            
            # Test with totp_code field (correct format)
            correct_payload = {
                "temp_token": temp_token,
                "totp_code": "123456"  # Still invalid code but correct field name
            }
            
            self.log(f"POST {verify_url}")
            self.log("Testing with correct field: totp_code")
            
            response = self.session.post(verify_url, json=correct_payload, timeout=30)
            
            self.log(f"Response Status: {response.status_code}")
            
            try:
                response_data = response.json()
                self.log(f"Response Body: {json.dumps(response_data, indent=2)}")
            except json.JSONDecodeError:
                response_data = {"error": "Invalid JSON response", "raw": response.text}
            
            test_result = {
                "test": "2fa_correct_field",
                "status_code": response.status_code,
                "success": False,
                "data": response_data,
                "issues": []
            }
            
            # Should get different error (invalid code, not missing field)
            if response.status_code == 422:
                error_detail = response_data.get("detail", [])
                if isinstance(error_detail, list):
                    # Check if error is about invalid code vs missing field
                    field_missing = any(item.get("type") == "missing" and "totp_code" in item.get("loc", []) for item in error_detail)
                    if not field_missing:
                        test_result["success"] = True
                        self.log("✅ Correct field format - no missing field error")
                    else:
                        test_result["issues"].append("Still getting missing field error with totp_code")
                else:
                    # Could be invalid code error message
                    test_result["success"] = True
                    self.log("✅ Correct field format - different error response")
            elif response.status_code == 400:
                # Could be invalid TOTP code error
                test_result["success"] = True
                self.log("✅ Correct field format - invalid TOTP code error")
            elif response.status_code == 401 and "Invalid 2FA code" in str(response_data.get("detail", "")):
                # Perfect! API received correct field and rejected invalid code
                test_result["success"] = True
                self.log("✅ Correct field format - API properly rejected invalid 2FA code")
            else:
                test_result["issues"].append(f"Unexpected status code: {response.status_code}")
            
            return test_result
            
        except requests.exceptions.RequestException as e:
            return {
                "test": "2fa_correct_field",
                "success": False,
                "error": str(e),
                "issues": [f"Network error: {str(e)}"]
            }
    
    def test_api_service_compatibility(self) -> Dict[str, Any]:
        """
        Test if the TypeScript API service is compatible with actual API responses
        """
        self.log("Testing API Service Compatibility")
        
        issues_found = []
        
        # Check login response format compatibility
        try:
            login_url = f"{self.base_url}/auth/login"
            login_payload = {
                "username": "railstream",
                "password": "Yea$uFTdx(10"
            }
            
            response = self.session.post(login_url, json=login_payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check TwoFactorResponse interface compatibility
                expected_fields = ["requires_2fa", "temp_token", "access_token", "user"]
                missing_fields = []
                
                for field in expected_fields:
                    if field not in data:
                        missing_fields.append(field)
                
                if missing_fields:
                    issues_found.append(f"Login response missing expected fields: {missing_fields}")
                else:
                    self.log("✅ Login response format matches TypeScript interface")
                
                # Check field types
                if not isinstance(data.get("requires_2fa"), bool):
                    issues_found.append("requires_2fa is not a boolean")
                
                if data.get("temp_token") and not isinstance(data["temp_token"], str):
                    issues_found.append("temp_token is not a string")
            
        except Exception as e:
            issues_found.append(f"Error testing login compatibility: {str(e)}")
        
        return {
            "test": "api_service_compatibility",
            "success": len(issues_found) == 0,
            "issues": issues_found
        }

def main():
    """Run additional tests"""
    print("=" * 60)
    print("ADDITIONAL API INTEGRATION TESTS")
    print("=" * 60)
    
    tester = AdditionalAPITester()
    
    # Test 1: Correct 2FA field format
    test1_result = tester.test_2fa_correct_field_format()
    print(f"\n2FA Field Format Test: {'✅ PASSED' if test1_result['success'] else '❌ FAILED'}")
    if test1_result.get('issues'):
        for issue in test1_result['issues']:
            print(f"  - {issue}")
    
    # Test 2: API Service compatibility
    test2_result = tester.test_api_service_compatibility()
    print(f"\nAPI Service Compatibility Test: {'✅ PASSED' if test2_result['success'] else '❌ FAILED'}")
    if test2_result.get('issues'):
        for issue in test2_result['issues']:
            print(f"  - {issue}")
    
    # Check if we found any critical issues
    total_issues = len(test1_result.get('issues', [])) + len(test2_result.get('issues', []))
    
    if total_issues > 0:
        print(f"\n⚠️  Found {total_issues} compatibility issues that need attention")
        return 1
    else:
        print(f"\n✅ All compatibility tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())