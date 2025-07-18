#!/usr/bin/env python
"""
Test script to verify AI report integration
Run this from the backend directory: python test_ai_report_integration.py
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

def test_imports():
    """Test that all AI report modules can be imported"""
    print("Testing imports...")
    
    try:
        from email_service.ai_report_models import AIPhishingReport
        print("✓ AI report models imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import AI report models: {e}")
        return False
    
    try:
        from email_service.ai_report_utils import (
            get_finished_campaigns_data, convert_campaigns_to_mockup_format,
            check_if_new_report_needed
        )
        print("✓ AI report utilities imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import AI report utilities: {e}")
        return False
    
    try:
        from email_service.ai_report_views import (
            generate_ai_report, get_report_status, download_ai_report, list_ai_reports
        )
        print("✓ AI report views imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import AI report views: {e}")
        return False
    
    try:
        from email_service.ai_utils import generate_analysis, get_kpi_analysis_prompt
        print("✓ AI utilities imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import AI utilities: {e}")
        return False
    
    try:
        from email_service.visualizations import create_trend_chart, create_group_assessment_chart
        print("✓ Visualization utilities imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import visualization utilities: {e}")
        return False
    
    try:
        from email_service.pdf_generator import build_pdf
        print("✓ PDF generator imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import PDF generator: {e}")
        return False
    
    return True

def test_database_model():
    """Test that the AI report model is properly registered"""
    print("\nTesting database model...")
    
    try:
        from email_service.ai_report_models import AIPhishingReport
        from accounts.models import Company
        
        # Check if we can query the model (this will fail if migration hasn't run)
        count = AIPhishingReport.objects.count()
        print(f"✓ AI report model is accessible (found {count} reports)")
        
        # Check if we can access the Company relationship
        companies = Company.objects.count()
        print(f"✓ Company model relationship is accessible (found {companies} companies)")
        
        return True
    except Exception as e:
        print(f"✗ Database model test failed: {e}")
        print("  Make sure to run: python manage.py migrate")
        return False

def test_environment():
    """Test environment setup"""
    print("\nTesting environment...")
    
    # Check for required environment variables
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key and gemini_key != 'your-gemini-api-key-here':
        print("✓ GEMINI_API_KEY is set")
    else:
        print("✗ GEMINI_API_KEY is not set or using placeholder value")
        print("  Set your actual Gemini API key in backend/.env")
        return False
    
    # Check media directory
    from django.conf import settings
    media_root = getattr(settings, 'MEDIA_ROOT', None)
    if media_root:
        ai_reports_dir = Path(media_root) / 'ai_reports'
        ai_reports_dir.mkdir(parents=True, exist_ok=True)
        print(f"✓ Media directory created: {ai_reports_dir}")
    else:
        print("✗ MEDIA_ROOT not configured in settings")
        return False
    
    return True

def test_dependencies():
    """Test that required dependencies are installed"""
    print("\nTesting dependencies...")
    
    required_packages = [
        'google.genai',
        'matplotlib',
        'pandas',
        'reportlab',
        'markdown'
    ]
    
    all_installed = True
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package} is installed")
        except ImportError:
            print(f"✗ {package} is not installed")
            all_installed = False
    
    if not all_installed:
        print("  Install missing packages with: pip install -r requirements.txt")
    
    return all_installed

def main():
    """Run all tests"""
    print("AI Report Integration Test")
    print("=" * 40)
    
    tests = [
        test_imports,
        test_database_model,
        test_environment,
        test_dependencies
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 40)
    if all(results):
        print("✓ All tests passed! AI report integration is ready.")
        print("\nNext steps:")
        print("1. Start the Django server: python manage.py runserver")
        print("2. Navigate to the Campaigns page in your frontend")
        print("3. Click 'Download a full AI report now' to test report generation")
    else:
        print("✗ Some tests failed. Please fix the issues above before using AI reports.")
    
    return all(results)

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)