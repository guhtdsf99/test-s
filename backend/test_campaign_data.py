#!/usr/bin/env python
"""
Test script to check campaign data calculation
Run this from the backend directory: python test_campaign_data.py
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
from email_service.ai_report_utils import get_finished_campaigns_data, convert_campaigns_to_mockup_format
from accounts.models import Company, Email, User, Department

def test_campaign_data():
    """Test campaign data calculation for all companies"""
    
    companies = Company.objects.all()
    
    for company in companies:
        print(f"\n{'='*50}")
        print(f"Testing company: {company.name}")
        print(f"{'='*50}")
        
        # Get all campaigns for this company
        all_campaigns = PhishingCampaign.objects.filter(company=company)
        print(f"Total campaigns: {all_campaigns.count()}")
        
        if all_campaigns.exists():
            print("\nAll campaigns details:")
            for i, campaign in enumerate(all_campaigns, 1):
                emails_count = Email.objects.filter(
                    phishing_campaign=campaign,
                    sent=True
                ).count()
                is_finished = campaign.end_date < timezone.now().date()
                is_excluded = ('deleted' in campaign.campaign_name.lower() or 
                              'draft' in campaign.campaign_name.lower())
                # Removed 'test' exclusion to include test campaigns in reports
                
                print(f"  {i}. {campaign.campaign_name}")
                print(f"     Start: {campaign.start_date}, End: {campaign.end_date}")
                print(f"     Emails sent: {emails_count}")
                print(f"     Is finished: {is_finished}")
                print(f"     Is excluded: {is_excluded}")
                print(f"     Status: {'✅ INCLUDED' if is_finished and not is_excluded else '❌ EXCLUDED'}")
                print()
        
        # Get finished campaigns
        finished_campaigns = PhishingCampaign.objects.filter(
            company=company,
            end_date__lt=timezone.now().date()
        ).exclude(
            campaign_name__icontains='deleted'
        ).exclude(
            campaign_name__icontains='draft'
        ).order_by('start_date')
        # Removed 'test' exclusion to include test campaigns in reports
        
        print(f"Finished campaigns (after filtering): {finished_campaigns.count()}")
        
        if finished_campaigns.exists():
            print("\nFinished campaigns details:")
            for i, campaign in enumerate(finished_campaigns, 1):
                emails_count = Email.objects.filter(
                    phishing_campaign=campaign,
                    sent=True
                ).count()
                print(f"  {i}. {campaign.campaign_name}")
                print(f"     Start: {campaign.start_date}, End: {campaign.end_date}")
                print(f"     Emails sent: {emails_count}")
            
            # Test the data conversion
            try:
                finished_campaigns_data, emails = get_finished_campaigns_data(company)
                if finished_campaigns_data:
                    print(f"\nData processing results:")
                    print(f"Campaigns found: {finished_campaigns_data.count()}")
                    print(f"Emails found: {emails.count()}")
                    
                    # Test mockup conversion
                    mockup_data = convert_campaigns_to_mockup_format(company, finished_campaigns_data, emails)
                    
                    print(f"\nMockup data summary:")
                    print(f"Total campaigns: {mockup_data['total_campaigns']}")
                    print(f"Total emails: {mockup_data['total_emails']}")
                    print(f"Click rate: {mockup_data['avg_click_rate']:.2%}")
                    print(f"Report rate: {mockup_data['avg_report_rate']:.2%}")
                    print(f"Most vulnerable group: {mockup_data['most_vulnerable_group_name']}")
                    print(f"Most effective group: {mockup_data['most_effective_group_name']}")
                    
                    print(f"\nDepartment statistics:")
                    for dept, count in mockup_data['dep_stats']['Emails Sent'].items():
                        click_rate = mockup_data['dep_stats']['Click Rate'][dept]
                        report_rate = mockup_data['dep_stats']['Report Rate'][dept]
                        print(f"  {dept}: {count} emails, {click_rate:.2%} clicks, {report_rate:.2%} reports")
                    
                else:
                    print("No finished campaigns data found")
                    
            except Exception as e:
                print(f"Error processing data: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("No finished campaigns found")

if __name__ == '__main__':
    test_campaign_data()