from django.urls import path
from . import views

app_name = 'lms'

urlpatterns = [
    path('get_courses_for_company/', views.get_courses_for_company, name='get_courses_for_company'),
    path('get_users_for_company/', views.get_users_for_company, name='get_users_for_company'),
    path('api/campaigns/', views.get_lms_campaigns, name='get_lms_campaigns'),
    path('api/campaigns/create/', views.create_lms_campaign, name='create_lms_campaign'),
    path('api/user-campaigns/', views.get_user_campaigns, name='get_user_campaigns'),
    path('api/mark-course-completed/', views.mark_course_completed, name='mark_course_completed'),
    path('api/lms/analytics/overview/', views.lms_analytics_overview, name='lms_analytics_overview'),
    path('api/lms/certificates/', views.company_certificates, name='lms_company_certificates'),
    path('api/lms/analytics/training-results/', views.lms_training_results, name='lms_training_results'),
    path('api/lms/certificates/<int:certificate_id>/download/', views.download_certificate, name='lms_certificate_download'),
]
