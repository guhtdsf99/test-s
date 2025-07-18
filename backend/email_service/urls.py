from django.urls import path
from . import views
from .email_utils import save_email
from .email_tracking import mark_email_read, mark_email_clicked
from .email_sender_updated import send_email
from .test_tracking import test_mark_read
from .email_status import get_sent_emails
from . import phishing_views
from . import ai_report_views

urlpatterns = [
    # Email sending and tracking
    path('send/', send_email, name='send_email'),
    path('save/', save_email, name='save_email'),
    path('mark-read/<int:email_id>/', mark_email_read, name='mark_email_read'),
    path('mark-clicked/<int:email_id>/', mark_email_clicked, name='mark_email_clicked'),
    path('test-read/<int:email_id>/', test_mark_read, name='test_mark_read'),
    path('configurations/', views.get_email_configurations, name='get_email_configurations'),
    
    # Template management
    path('templates/', views.get_email_templates, name='get_email_templates'),
    path('templates/create/', views.create_email_template, name='create_email_template'),
    path('templates/<int:template_id>/', views.manage_email_template, name='manage_email_template'),

    # Landing Page Template management
    path('landing-page-templates/', views.get_landing_page_templates, name='get_landing_page_templates'),
    path('landing-page-templates/create/', views.create_landing_page_template, name='create_landing_page_template'),
    path('landing-page-templates/<int:template_id>/', views.manage_landing_page_template, name='manage_landing_page_template'),
    
    # Email viewing and campaigns
    path('sent-emails/', get_sent_emails, name='get_sent_emails'),
    path('<slug:landing_page_slug>/<int:email_id>/', phishing_views.phishing_landing_page, name='phishing_landing_page'),
    path('campaigns/', views.list_phishing_campaigns, name='list_phishing_campaigns'),
    path('campaigns/create/', views.create_phishing_campaign_by_slug, name='create_phishing_campaign_by_slug'),
    path('campaigns/<int:campaign_id>/analytics/', views.get_campaign_analytics, name='get_campaign_analytics'),
    
    # Phishing Analytics URLs
    path('analytics/summary/', views.phishing_analytics_summary, name='phishing_analytics_summary'),
    path('analytics/department-performance/', views.department_performance_analytics, name='department_performance_analytics'),
    path('analytics/temporal-trend/', views.phishing_temporal_trend_analytics, name='phishing_temporal_trend_analytics'),
    
    # AI Report URLs
    path('ai-reports/generate/', ai_report_views.generate_ai_report, name='generate_ai_report'),
    path('ai-reports/<uuid:report_id>/status/', ai_report_views.get_report_status, name='get_report_status'),
    path('ai-reports/<uuid:report_id>/download/', ai_report_views.download_ai_report, name='download_ai_report'),
    path('ai-reports/', ai_report_views.list_ai_reports, name='list_ai_reports'),
]
