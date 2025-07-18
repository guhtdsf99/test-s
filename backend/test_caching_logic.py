#!/usr/bin/env python
"""
Test script to verify caching logic works correctly
Run this from the backend directory: python test_caching_logic.py
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

from django.utils import timezone
from email_service.models import PhishingCampaign
from email_service.ai_report_models import AIPhishingReport
from email_service.ai_report_utils import check_if_new_report_needed
from accounts.models import Company

def test_caching_logic():
    """Test the caching logic for AI reports"""
    
    companies = Company.objects.all()
    
    for company in companies:
        print(f"\n{'='*60}")
        print(f"Testing caching logic for company: {company.name}")
        print(f"{'='*60}")
        
        # Get finished campaigns
        finished_campaigns = PhishingCampaign.objects.filter(
            company=company,
            end_date__lt=timezone.now().date()
        ).exclude(
            campaign_name__icontains='deleted'
        ).exclude(
            campaign_name__icontains='draft'
        ).order_by('start_date')
        
        print(f"Finished campaigns: {finished_campaigns.count()}")
        
        if finished_campaigns.exists():
            latest_campaign = finished_campaigns.last()
            print(f"Latest campaign: {latest_campaign.campaign_name}")
            print(f"Latest campaign end date: {latest_campaign.end_date}")
            
            # Get existing reports
            existing_reports = AIPhishingReport.objects.filter(
                company=company
            ).order_by('-created_at')
            
            print(f"\nExisting reports: {existing_reports.count()}")
            
            for i, report in enumerate(existing_reports, 1):
                print(f"  {i}. {report.report_name}")
                print(f"     Status: {report.status}")
                print(f"     Campaigns count: {report.campaigns_count}")
                print(f"     End date: {report.end_date}")
                print(f"     Created: {report.created_at}")
                print()
            
            # Test the caching logic
            needs_new_report, data, message = check_if_new_report_needed(company)
            
            print(f"🔍 Caching Logic Results:")
            print(f"   Needs new report: {needs_new_report}")
            print(f"   Message: {message}")
            
            if needs_new_report:
                print(f"   ✅ Will generate NEW report")
                if hasattr(data, 'count'):
                    print(f"   📊 Will include {data.count()} campaigns")
            else:
                print(f"   📥 Will use EXISTING report")
                if hasattr(data, 'report_name'):
                    print(f"   📄 Report: {data.report_name}")
                    print(f"   📅 Created: {data.created_at}")
                    print(f"   📊 Campaigns: {data.campaigns_count}")
            
            # Detailed analysis
            print(f"\n📋 Detailed Analysis:")
            current_count = finished_campaigns.count()
            latest_end_date = finished_campaigns.last().end_date
            
            latest_completed_report = AIPhishingReport.objects.filter(
                company=company,
                status='completed'
            ).order_by('-created_at').first()
            
            if latest_completed_report:
                print(f"   Current campaigns: {current_count}")
                print(f"   Last report campaigns: {latest_completed_report.campaigns_count}")
                print(f"   Current latest end date: {latest_end_date}")
                print(f"   Last report end date: {latest_completed_report.end_date}")
                
                count_changed = current_count > latest_completed_report.campaigns_count
                date_changed = latest_end_date > latest_completed_report.end_date
                
                print(f"   Count changed: {count_changed}")
                print(f"   Date changed: {date_changed}")
                print(f"   Should generate new: {count_changed or date_changed}")
            else:
                print(f"   No completed reports found - will generate new report")
        
        else:
            print("No finished campaigns found")

if __name__ == '__main__':
    test_caching_logic()