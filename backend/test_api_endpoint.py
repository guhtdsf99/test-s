#!/usr/bin/env python
"""
Test script to verify the API endpoint works with HTTP requests
Run this from the backend directory: python test_api_endpoint.py
"""

import requests
import json

def test_api_endpoint():
    """Test the API endpoint with actual HTTP requests"""
    
    print("🌐 Testing API Endpoint with HTTP Requests")
    print("=" * 50)
    
    # Test endpoint
    base_url = "http://localhost:8000"
    endpoint = "/api/auth/egypt/users/2/update-department/"
    url = base_url + endpoint
    
    print(f"Testing URL: {url}")
    
    # Test data
    test_data = {
        "departments": ["1"]  # IT department
    }
    
    print(f"Test payload: {json.dumps(test_data, indent=2)}")
    
    # Test different HTTP methods
    methods_to_test = ['PATCH', 'PUT']
    
    for method in methods_to_test:
        print(f"\n🔧 Testing {method} method:")
        
        try:
            if method == 'PATCH':
                response = requests.patch(url, json=test_data)
            else:
                response = requests.put(url, json=test_data)
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ {method} method works!")
                try:
                    data = response.json()
                    print(f"   📝 Response: User departments updated")
                except:
                    print(f"   📝 Response: {response.text[:100]}...")
            elif response.status_code == 401:
                print(f"   🔐 Authentication required (expected)")
            elif response.status_code == 405:
                print(f"   ❌ Method not allowed")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
                print(f"   📝 Response: {response.text[:200]}...")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection failed - make sure Django server is running")
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == '__main__':
    test_api_endpoint()