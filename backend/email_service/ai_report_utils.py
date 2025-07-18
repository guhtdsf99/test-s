from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from .models import PhishingCampaign
from .ai_report_models import AIPhishingReport
from accounts.models import Email, User, Department
import pandas as pd
import json


def get_finished_campaigns_data(company):
    """Get all finished campaigns data for a company"""
    
    # Get all finished campaigns for the company (only completed ones)
    finished_campaigns = PhishingCampaign.objects.filter(
        company=company,
        end_date__lt=timezone.now().date()
    ).exclude(
        Q(campaign_name__icontains='deleted') | 
        Q(campaign_name__icontains='draft')
        # Removed 'test' exclusion to include test campaigns in reports
    ).order_by('start_date')
    
    if not finished_campaigns.exists():
        return None, "No finished campaigns available"
    
    # Get all emails for these campaigns (only sent emails)
    emails = Email.objects.filter(
        phishing_campaign__in=finished_campaigns,
        sent=True
    ).select_related('recipient', 'phishing_campaign').prefetch_related('recipient__departments')
    
    if not emails.exists():
        return None, "No emails found for finished campaigns"
    
    print(f"Found {finished_campaigns.count()} finished campaigns with {emails.count()} sent emails")
    
    return finished_campaigns, emails


def convert_campaigns_to_mockup_format(company, finished_campaigns, emails):
    """Convert real campaign data to mockup JSON format for AI analysis"""
    
    # Calculate basic KPIs
    total_emails = emails.count()
    total_campaigns = finished_campaigns.count()
    
    print(f"Processing {total_campaigns} campaigns with {total_emails} emails")
    
    clicked_emails = emails.filter(clicked=True)
    reported_emails = emails.filter(read=True)  # Using 'read' as proxy for 'reported'
    
    avg_click_rate = clicked_emails.count() / total_emails if total_emails > 0 else 0
    avg_report_rate = reported_emails.count() / total_emails if total_emails > 0 else 0
    
    # Calculate repeat clickers - users who clicked in multiple campaigns or multiple times
    repeat_clickers_count = 0
    user_click_counts = {}
    
    for email in emails.filter(clicked=True):
        user_id = email.recipient.id
        if user_id in user_click_counts:
            user_click_counts[user_id] += 1
        else:
            user_click_counts[user_id] = 1
    
    repeat_clickers_count = sum(1 for count in user_click_counts.values() if count > 1)
    
    # Get department statistics
    departments = Department.objects.filter(company=company)
    dep_stats = {
        "Emails Sent": {},
        "Click Rate": {},
        "Report Rate": {}
    }
    
    most_vulnerable_group_name = "Unknown"
    most_vulnerable_group_click_rate = 0
    most_effective_group_name = "Unknown"
    most_effective_group_report_rate = 0
    
    # Process each department
    for dept in departments:
        # Get emails sent to users in this department
        dept_emails = emails.filter(recipient__departments=dept)
        dept_count = dept_emails.count()
        
        if dept_count > 0:
            dept_clicks = dept_emails.filter(clicked=True).count()
            dept_reports = dept_emails.filter(read=True).count()
            
            click_rate = dept_clicks / dept_count
            report_rate = dept_reports / dept_count
            
            dep_stats["Emails Sent"][dept.name] = dept_count
            dep_stats["Click Rate"][dept.name] = click_rate
            dep_stats["Report Rate"][dept.name] = report_rate
            
            print(f"Department {dept.name}: {dept_count} emails, {click_rate:.2%} click rate, {report_rate:.2%} report rate")
            
            # Track most vulnerable and effective groups
            if click_rate > most_vulnerable_group_click_rate:
                most_vulnerable_group_name = dept.name
                most_vulnerable_group_click_rate = click_rate
            
            if report_rate > most_effective_group_report_rate:
                most_effective_group_name = dept.name
                most_effective_group_report_rate = report_rate
    
    # Handle users with no department
    no_dept_emails = emails.filter(recipient__departments__isnull=True)
    if no_dept_emails.exists():
        no_dept_count = no_dept_emails.count()
        no_dept_clicks = no_dept_emails.filter(clicked=True).count()
        no_dept_reports = no_dept_emails.filter(read=True).count()
        
        click_rate = no_dept_clicks / no_dept_count if no_dept_count > 0 else 0
        report_rate = no_dept_reports / no_dept_count if no_dept_count > 0 else 0
        
        dep_stats["Emails Sent"]["No Department"] = no_dept_count
        dep_stats["Click Rate"]["No Department"] = click_rate
        dep_stats["Report Rate"]["No Department"] = report_rate
        
        print(f"No Department: {no_dept_count} emails, {click_rate:.2%} click rate, {report_rate:.2%} report rate")
        
        if click_rate > most_vulnerable_group_click_rate:
            most_vulnerable_group_name = "No Department"
            most_vulnerable_group_click_rate = click_rate
        
        if report_rate > most_effective_group_report_rate:
            most_effective_group_name = "No Department"
            most_effective_group_report_rate = report_rate
    
    # Calculate weekly statistics based on campaign dates
    start_date = finished_campaigns.first().start_date
    end_date = finished_campaigns.last().end_date
    
    print(f"Date range: {start_date} to {end_date}")
    
    # Create weekly buckets from start to end date
    weekly_stats = {"Clicked": {}, "Reported": {}}
    current_date = start_date
    
    while current_date <= end_date:
        # Get start of week (Monday)
        week_start = current_date - timedelta(days=current_date.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Get emails from campaigns that started in this week
        week_campaigns = finished_campaigns.filter(
            start_date__gte=week_start,
            start_date__lte=week_end
        )
        
        if week_campaigns.exists():
            week_emails = emails.filter(phishing_campaign__in=week_campaigns)
            week_total = week_emails.count()
            
            if week_total > 0:
                week_clicks = week_emails.filter(clicked=True).count()
                week_reports = week_emails.filter(read=True).count()
                
                week_key = week_start.isoformat()
                weekly_stats["Clicked"][week_key] = week_clicks / week_total
                weekly_stats["Reported"][week_key] = week_reports / week_total
        
        current_date = week_end + timedelta(days=1)
    
    # Group statistics (same as department stats for this format)
    group_stats = {
        "Clicked": dep_stats["Click Rate"].copy(),
        "Reported": dep_stats["Report Rate"].copy()
    }
    
    # Format dates
    start_date_formatted = start_date.strftime("%B %d, %Y")
    end_date_formatted = end_date.strftime("%B %d, %Y")
    
    # Create the mockup format
    mockup_data = {
        "total_emails": total_emails,
        "total_campaigns": total_campaigns,
        "avg_click_rate": avg_click_rate,
        "avg_report_rate": avg_report_rate,
        "repeat_clickers": repeat_clickers_count,
        "most_vulnerable_group_name": most_vulnerable_group_name,
        "most_vulnerable_group_click_rate": most_vulnerable_group_click_rate,
        "most_effective_group_name": most_effective_group_name,
        "most_effective_group_report_rate": most_effective_group_report_rate,
        "dep_stats": dep_stats,
        "weekly_stats": weekly_stats,
        "group_stats": group_stats,
        "start_date": start_date_formatted,
        "end_date": end_date_formatted,
        "org_name": company.name
    }
    
    print(f"Generated mockup data: {total_campaigns} campaigns, {total_emails} emails")
    print(f"Click rate: {avg_click_rate:.2%}, Report rate: {avg_report_rate:.2%}")
    
    return mockup_data


def check_if_new_report_needed(company):
    """Check if a new report is needed based on finished campaigns"""
    
    # Get all finished campaigns for the company (using same logic as get_finished_campaigns_data)
    finished_campaigns = PhishingCampaign.objects.filter(
        company=company,
        end_date__lt=timezone.now().date()
    ).exclude(
        Q(campaign_name__icontains='deleted') | 
        Q(campaign_name__icontains='draft')
        # Removed 'test' exclusion to match the updated logic
    ).order_by('start_date')
    
    current_finished_count = finished_campaigns.count()
    
    if current_finished_count == 0:
        return False, None, "No finished campaigns available"
    
    # Get the latest completed report for this company
    latest_report = AIPhishingReport.objects.filter(
        company=company,
        status='completed'
    ).order_by('-created_at').first()
    
    if not latest_report:
        return True, finished_campaigns, "No previous report exists"
    
    # Get the end date of the latest finished campaign
    latest_campaign_end_date = finished_campaigns.last().end_date
    
    # Check if new campaigns have finished since the last report
    # Compare both count and end date to ensure we capture all scenarios
    if (current_finished_count > latest_report.campaigns_count or 
        latest_campaign_end_date > latest_report.end_date):
        return True, finished_campaigns, f"New campaigns finished (Count: {current_finished_count} vs {latest_report.campaigns_count}, Latest end date: {latest_campaign_end_date} vs {latest_report.end_date})"
    
    return False, latest_report, "No new campaigns since last report"


def generate_report_name(company, start_date, end_date):
    """Generate a report name based on company and date range"""
    start_str = start_date.strftime("%B_%d_%Y")
    end_str = end_date.strftime("%B_%d_%Y")
    return f"{company.name}_Phishing_Report_{start_str}_to_{end_str}"