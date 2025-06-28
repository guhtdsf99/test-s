from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer

class CompanyListView(generics.ListAPIView):
    """
    API endpoint that allows all companies to be viewed.
    This is used for the company selection page.
    """
    queryset = Company.objects.all().order_by('name')
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to see the list of companies
