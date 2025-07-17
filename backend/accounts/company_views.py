from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Company
from .serializers import CompanySerializer

User = get_user_model()

class CompanyListView(generics.ListAPIView):
    """
    API endpoint that allows all companies to be viewed.
    This is used for the company selection page.
    """
    queryset = Company.objects.all().order_by('name')
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to see the list of companies

class CompanyInfoView(APIView):
    """
    API endpoint that provides detailed information about a company,
    including user count and limits.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, company_slug=None):
        """
        Get company information including user count and limits
        """
        if not company_slug:
            return Response(
                {"detail": "Company context is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get the company
        company = get_object_or_404(Company, slug=company_slug)
        
        # Check if user has access to this company
        if request.user.role != 'SUPER_ADMIN' and (not request.user.company or request.user.company.id != company.id):
            return Response(
                {"detail": "You don't have access to this company information."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get company information
        company_data = CompanySerializer(company).data
        
        # Add additional information
        company_data['current_user_count'] = User.objects.filter(company=company).count()
        
        return Response(company_data)
