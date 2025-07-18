#!/usr/bin/env python
"""
Test script to verify PDF images are working correctly
Run this from the backend directory: python test_pdf_images.py
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Company

def test_pdf_images():
    """Test that all required images are available for PDF generation"""
    
    print("🖼️  Testing PDF Images Availability")
    print("=" * 50)
    
    # Test CSword Logo
    csword_logo_paths = [
        os.path.join(os.path.dirname(__file__), 'static', 'images', 'cs-logo.png'),
        'backend/static/images/cs-logo.png',
        'backend/media/cs-logo.png',
        'backend/static/cs-logo.png'
    ]
    
    print("1. CSword Logo:")
    csword_logo_found = False
    for path in csword_logo_paths:
        if os.path.exists(path):
            print(f"   ✅ Found: {path}")
            csword_logo_found = True
            break
        else:
            print(f"   ❌ Not found: {path}")
    
    if not csword_logo_found:
        print("   ⚠️  No CSword logo found!")
    
    # Test CSword Stamp
    stamp_paths = [
        os.path.join(os.path.dirname(__file__), 'static', 'images', 'stamp.png'),
        'backend/static/images/stamp.png',
        'backend/media/stamp.png',
        'backend/static/stamp.png'
    ]
    
    print("\n2. CSword Official Stamp:")
    stamp_found = False
    for path in stamp_paths:
        if os.path.exists(path):
            print(f"   ✅ Found: {path}")
            stamp_found = True
            break
        else:
            print(f"   ❌ Not found: {path}")
    
    if not stamp_found:
        print("   ⚠️  No CSword stamp found!")
    
    # Test Company Logos
    print("\n3. Company Logos:")
    companies = Company.objects.all()
    
    for company in companies:
        print(f"\n   Company: {company.name}")
        if company.company_logo:
            logo_path = company.company_logo.path
            if os.path.exists(logo_path):
                print(f"   ✅ Logo found: {logo_path}")
                
                # Check file size
                file_size = os.path.getsize(logo_path)
                print(f"   📏 File size: {file_size} bytes")
                
                # Check if it's a valid image file
                valid_extensions = ['.png', '.jpg', '.jpeg', '.gif']
                file_ext = os.path.splitext(logo_path)[1].lower()
                if file_ext in valid_extensions:
                    print(f"   ✅ Valid image format: {file_ext}")
                else:
                    print(f"   ⚠️  Unknown format: {file_ext}")
            else:
                print(f"   ❌ Logo file not found: {logo_path}")
        else:
            print(f"   ⚠️  No logo uploaded for {company.name}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print(f"   CSword Logo: {'✅ Available' if csword_logo_found else '❌ Missing'}")
    print(f"   CSword Stamp: {'✅ Available' if stamp_found else '❌ Missing'}")
    
    companies_with_logos = Company.objects.exclude(company_logo='').count()
    total_companies = Company.objects.count()
    print(f"   Company Logos: {companies_with_logos}/{total_companies} companies have logos")
    
    if csword_logo_found and stamp_found:
        print("\n🎉 All CSword images are ready for PDF generation!")
    else:
        print("\n⚠️  Some images are missing. PDF will show text placeholders.")
    
    print("\n📝 Note: Company logos will be loaded dynamically from each company's uploaded logo.")

if __name__ == '__main__':
    test_pdf_images()