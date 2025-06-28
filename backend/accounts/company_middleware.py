from django.http import HttpResponseForbidden
from django.urls import resolve
from .models import Company

class CompanyMiddleware:
    """
    Middleware to handle company-specific access based on URL subdirectory.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the URL path
        path = request.path_info.lstrip('/')
        
        # Check if the path starts with a company subdirectory
        parts = path.split('/', 1)
        if len(parts) > 0:
            company_slug = parts[0]
            
            # Skip middleware for admin, api, and static paths
            if company_slug in ['admin', 'api', 'static', 'media']:
                return self.get_response(request)
            
            # Check if this is a company subdirectory
            try:
                company = Company.objects.get(slug=company_slug)
                
                # Store the company in the request for later use
                request.company = company
                
                # If user is authenticated, check if they belong to this company
                if request.user.is_authenticated:
                    # Super admins can access any company
                    if request.user.role == 'SUPER_ADMIN':
                        return self.get_response(request)
                    
                    # Check if user belongs to this company
                    if request.user.company != company:
                        return HttpResponseForbidden("You don't have access to this company portal.")
            
            except Company.DoesNotExist:
                # If it's not a company slug, just continue
                pass
        
        return self.get_response(request)
