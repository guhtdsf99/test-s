from django.urls import path
from . import views
from .email_utils import save_email
from .email_tracking import mark_email_read, mark_email_clicked
from .email_sender_updated import send_email
from .test_tracking import test_mark_read
from .email_status import get_sent_emails
from .browser_view import view_email_in_browser

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
    
    # Email viewing and campaigns
    path('sent-emails/', get_sent_emails, name='get_sent_emails'),
    path('view-in-browser/<int:email_id>/', view_email_in_browser, name='view_email_in_browser'),
    path('campaigns/', views.list_phishing_campaigns, name='list_phishing_campaigns'),
    path('campaigns/create/', views.create_phishing_campaign_by_slug, name='create_phishing_campaign_by_slug'),
    path('campaigns/<int:campaign_id>/analytics/', views.get_campaign_analytics, name='get_campaign_analytics'),
    
    # Phishing Analytics URLs
    path('analytics/summary/', views.phishing_analytics_summary, name='phishing_analytics_summary'),
    path('analytics/department-performance/', views.department_performance_analytics, name='department_performance_analytics'),
    path('analytics/temporal-trend/', views.phishing_temporal_trend_analytics, name='phishing_temporal_trend_analytics'),
]
