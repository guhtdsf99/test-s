from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .company_views import CompanyListView
from .user_management_views import UserManagementView, UserDetailView, UserDepartmentUpdateView, UserPasswordResetView
from .department_views import DepartmentListView, DepartmentDetailView

# Standard auth endpoints
auth_patterns = [
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('users/', views.CompanyListView.as_view(), name='user-list'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('users/<slug:company_slug>/reset-password/', UserPasswordResetView.as_view(), name='user-reset-password'),
]

# Company-specific auth endpoints
company_patterns = [
    path('token/', views.CustomTokenObtainPairView.as_view(), name='company_token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='company_token_refresh'),
    path('profile/', views.UserProfileView.as_view(), name='company_profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='company_change_password'),

    # User management endpoints - specific paths must come before generic ones
    path('users/bulk-upload/', UserManagementView.as_view(), name='company_user_bulk_upload'),
    path('users/reset-password/', UserPasswordResetView.as_view(), name='company_user_reset_password'),
    path('users/', UserManagementView.as_view(), name='company_user_list'),
    path('users/<str:user_id>/update-department/', UserDepartmentUpdateView.as_view(), name='company_user_update_department'),
    path('users/<str:user_id>/', UserDetailView.as_view(), name='company_user_detail'),

    # Department management endpoints
    path('departments/', DepartmentListView.as_view(), name='company_department_list'),
    path('departments/<str:department_id>/', DepartmentDetailView.as_view(), name='company_department_detail'),
]

urlpatterns = [
    # Standard auth endpoints
    path('', include(auth_patterns)),
    
    # Company-specific endpoints
    path('<str:company_slug>/', include(company_patterns)),
    
    # Company listing endpoint
    path('companies/', CompanyListView.as_view(), name='company-list'),
]
