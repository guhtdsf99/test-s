from rest_framework import permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Department, Company
from django.db.models import Count
from django.contrib.auth import get_user_model

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'user_count']

class DepartmentListView(APIView):
    """
    View for listing and creating departments
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, company_slug=None):
        """
        List all departments in a company
        """
        # If company_slug is provided, check if user has access
        if company_slug:
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user has admin privileges
            user_role = request.user.role.lower() if request.user.role else ''
            is_admin = user_role in ['admin', 'company_admin', 'super_admin']
            
            # Check if user belongs to this company or is a super admin
            if not is_admin or (user_role != 'super_admin' and (not request.user.company or request.user.company.id != company.id)):
                return Response(
                    {"detail": "You don't have access to manage departments in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get all departments in this company with user counts
            departments = Department.objects.filter(company=company).annotate(
                user_count=Count('users')
            )
            serializer = DepartmentSerializer(departments, many=True)
            return Response(serializer.data)
        
        # If no company slug, only super admins can see all departments
        if request.user.role.lower() == 'super_admin':
            departments = Department.objects.all().annotate(
                user_count=Count('users')
            )
            serializer = DepartmentSerializer(departments, many=True)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def post(self, request, company_slug=None):
        """
        Create a new department
        """
        # If company_slug is provided, check if user has access
        if company_slug:
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user has admin privileges
            user_role = request.user.role.lower() if request.user.role else ''
            is_admin = user_role in ['admin', 'company_admin', 'super_admin']
            
            # Check if user belongs to this company or is a super admin
            if not is_admin or (user_role != 'super_admin' and (not request.user.company or request.user.company.id != company.id)):
                return Response(
                    {"detail": "You don't have access to manage departments in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create a new department
            name = request.data.get('name')
            if not name:
                return Response(
                    {"detail": "Department name is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if department already exists
            if Department.objects.filter(name=name, company=company).exists():
                return Response(
                    {"detail": "A department with this name already exists in this company."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            department = Department.objects.create(name=name, company=company)
            serializer = DepartmentSerializer(department)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

class DepartmentDetailView(APIView):
    """
    View for retrieving, updating or deleting a department
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, department_id, company_slug=None):
        """
        Retrieve a department by ID
        """
        # If company_slug is provided, check if user has access
        if company_slug:
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user has admin privileges
            user_role = request.user.role.lower() if request.user.role else ''
            is_admin = user_role in ['admin', 'company_admin', 'super_admin']
            
            # Check if user belongs to this company or is a super admin
            if not is_admin or (user_role != 'super_admin' and (not request.user.company or request.user.company.id != company.id)):
                return Response(
                    {"detail": "You don't have access to manage departments in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get the department
            department = get_object_or_404(Department, id=department_id, company=company)
            department.user_count = User.objects.filter(department=department).count()
            serializer = DepartmentSerializer(department)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def delete(self, request, department_id, company_slug=None):
        """
        Delete a department
        """
        # If company_slug is provided, check if user has access
        if company_slug:
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user has admin privileges
            user_role = request.user.role.lower() if request.user.role else ''
            is_admin = user_role in ['admin', 'company_admin', 'super_admin']
            
            # Check if user belongs to this company or is a super admin
            if not is_admin or (user_role != 'super_admin' and (not request.user.company or request.user.company.id != company.id)):
                return Response(
                    {"detail": "You don't have access to manage departments in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get the department
            department = get_object_or_404(Department, id=department_id, company=company)
            
            # Check if department has users
            if User.objects.filter(department=department).exists():
                return Response(
                    {"detail": "Cannot delete department with users. Reassign users first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            department.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
