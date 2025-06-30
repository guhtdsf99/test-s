from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import Company, Department
from .serializers import UserSerializer
import io
import csv
import uuid
from email_service.password_reset import send_password_reset_email, generate_random_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
import openpyxl
import xlrd

User = get_user_model()

class UserManagementView(APIView):
    """
    View for listing and managing users within a company
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get(self, request, company_slug=None):
        """
        List all users in a company
        Only accessible by admins, company admins, and super admins
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
                    {"detail": "You don't have access to manage users in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get all users in this company
            users = User.objects.filter(company=company)
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data)
        
        # If no company slug, only super admins can see all users
        if request.user.role.lower() == 'super_admin':
            users = User.objects.all()
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def post(self, request, company_slug=None):
        """
        Add a new user to the company
        """
        # Check if this is a bulk upload request
        if 'file' in request.FILES:
            return self.bulk_upload(request, company_slug)
            
        # If company_slug is provided, check if user has access
        if company_slug:
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user has admin privileges
            user_role = request.user.role.lower() if request.user.role else ''
            is_admin = user_role in ['admin', 'company_admin', 'super_admin']
            
            # Check if user belongs to this company or is a super admin
            if not is_admin or (user_role != 'super_admin' and (not request.user.company or request.user.company.id != company.id)):
                return Response(
                    {"detail": "You don't have access to add users to this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the data from the request
            data = request.data.copy()
            
            # Validate required fields
            required_fields = ['first_name', 'last_name', 'email', 'role']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {"detail": f"{field} is required."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Check if department exists
            department = None
            if 'department' in data and data['department']:
                try:
                    department = Department.objects.get(id=data['department'], company=company)
                except Department.DoesNotExist:
                    return Response(
                        {"detail": "Department not found."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Use default IT department or create one
                department, created = Department.objects.get_or_create(
                    name='IT',
                    company=company,
                    defaults={'name': 'IT', 'company': company}
                )
            
            # Check if user with this email already exists in this company
            if User.objects.filter(email=data['email'], company=company).exists():
                return Response(
                    {"detail": f"A user with email {data['email']} already exists in this company."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Generate a username if not provided
            if 'username' not in data or not data['username']:
                # Create username from email
                data['username'] = data['email'].split('@')[0]
                
                # Check if username exists and append numbers if needed
                base_username = data['username']
                counter = 1
                while User.objects.filter(username=data['username']).exists():
                    data['username'] = f"{base_username}{counter}"
                    counter += 1
            
            # Generate a random password regardless of whether one was provided
            # This ensures security by always using a strong random password
            original_password = generate_random_password(12)
            data['password'] = original_password
            
            # Set the company
            data['company'] = company.id
            
            # Set the department
            data['department'] = department.id
            
            # Create the user
            serializer = UserSerializer(data=data)
            if serializer.is_valid():
                try:
                    # Create user object but don't save it yet
                    user = User(
                        username=data['username'],
                        email=data['email'],
                        first_name=data['first_name'],
                        last_name=data['last_name'],
                        role=data['role'],
                        company=company,
                        department=department
                    )
                    
                    # Generate UUID and company_email_id before saving
                    if not user.uuid:
                        user.uuid = uuid.uuid4()
                    
                    # Generate a unique company_email_id
                    company_slug = company.slug if company.slug else str(company.id)
                    base_id = f"{user.email}:{company_slug}"
                    
                    # Add a unique suffix if needed
                    counter = 0
                    temp_id = base_id
                    while User.objects.filter(company_email_id=temp_id).exists():
                        counter += 1
                        temp_id = f"{base_id}:{counter}"
                    
                    user.company_email_id = temp_id
                    
                    # We've already generated a random password earlier
                    # original_password = data['password']
                    
                    # Set the password and save
                    user.set_password(original_password)
                    user.save()
                    
                    # Skip sending password reset email
                    response_data = UserSerializer(user).data
                    response_data['email_sent'] = False
                    response_data['email_skipped'] = "Welcome email sending is disabled"
                    
                    return Response(response_data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    return Response(
                        {"detail": f"Error creating user: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def bulk_upload(self, request, company_slug=None):
        """
        Bulk upload users from a CSV file (Excel support temporarily disabled)
        """
        if not company_slug:
            return Response(
                {"detail": "Company context is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        company = get_object_or_404(Company, slug=company_slug)
        
        # Check if user has admin privileges
        user_role = request.user.role.lower() if request.user.role else ''
        is_admin = user_role in ['admin', 'company_admin', 'super_admin']
        
        # Check if user belongs to this company or is a super admin
        if not is_admin or (user_role != 'super_admin' and (not request.user.company or request.user.company.id != company.id)):
            return Response(
                {"detail": "You don't have access to add users to this company."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the file from the request
        file = request.FILES['file']
        
        # Check file extension - only supporting CSV for now
        if file.name.endswith('.csv'):
            # Read CSV file
            try:
                # Simple CSV parsing without pandas
                decoded_file = file.read().decode('utf-8').splitlines()
                reader = csv.DictReader(decoded_file)
                
                # Process the CSV data
                results = {
                    'created_users': [],
                    'total_created': 0,
                    'total_errors': 0,
                    'errors': []
                }
                
                for row in reader:
                    try:
                        # Validate required fields
                        required_fields = ['first_name', 'last_name', 'email', 'role']
                        missing_fields = [field for field in required_fields if field not in row or not row[field]]
                        
                        if missing_fields:
                            results['total_errors'] += 1
                            results['errors'].append(f"Row missing required fields: {', '.join(missing_fields)}")
                            continue
                            
                        # Generate username from email if not provided
                        username = row.get('username', '')
                        if not username:
                            username = row['email'].split('@')[0]
                            
                            # Check if username exists and append numbers if needed
                            base_username = username
                            counter = 1
                            while User.objects.filter(username=username).exists():
                                username = f"{base_username}{counter}"
                                counter += 1
                                
                        # Check if user with this email already exists in this company
                        if User.objects.filter(email=row['email'], company=company).exists():
                            results['total_errors'] += 1
                            results['errors'].append(f"User with email {row['email']} already exists in this company")
                            continue
                        
                        # Generate a random secure password regardless of what was provided
                        # This ensures security by always using a strong random password
                        password = generate_random_password(12)
                        
                        # Get or create department
                        department_name = row.get('department', 'IT')
                        department, created = Department.objects.get_or_create(
                            name=department_name,
                            company=company,
                            defaults={'name': department_name, 'company': company}
                        )
                        
                        try:
                            # Create user object but don't save it yet
                            user = User(
                                username=username,
                                email=row['email'],
                                first_name=row['first_name'],
                                last_name=row['last_name'],
                                role=row['role'],
                                company=company,
                                department=department
                            )
                            
                            # Generate UUID and company_email_id before saving
                            if not user.uuid:
                                user.uuid = uuid.uuid4()
                            
                            # Generate a unique company_email_id
                            company_slug = company.slug if company.slug else str(company.id)
                            base_id = f"{user.email}:{company_slug}"
                            
                            # Add a unique suffix if needed
                            counter = 0
                            temp_id = base_id
                            while User.objects.filter(company_email_id=temp_id).exists():
                                counter += 1
                                temp_id = f"{base_id}:{counter}"
                            
                            user.company_email_id = temp_id
                            
                            # Set the password and save
                            user.set_password(password)
                            user.save()
                            
                            # Add created user to the results
                            results['created_users'].append(UserSerializer(user).data)
                            results['total_created'] += 1
                            
                        except Exception as e:
                            results['total_errors'] += 1
                            results['errors'].append(f"Error creating user {row['email']}: {str(e)}")
                            continue
                        
                    except Exception as e:
                        results['total_errors'] += 1
                        results['errors'].append(f"Error processing row: {str(e)}")
                
                return Response(results, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {"detail": f"Error reading CSV file: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif file.name.endswith('.xlsx'):
            try:
                workbook = openpyxl.load_workbook(file)
                sheet = workbook.active
                headers = [cell.value for cell in sheet[1]]
                results = {
                    'created_users': [],
                    'total_created': 0,
                    'total_errors': 0,
                    'errors': []
                }

                for row_index, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                    row_data = dict(zip(headers, row))
                    try:
                        # Validate required fields
                        required_fields = ['first_name', 'last_name', 'email', 'role']
                        missing_fields = [field for field in required_fields if field not in row_data or not row_data[field]]
                        
                        if missing_fields:
                            results['total_errors'] += 1
                            results['errors'].append(f"Row {row_index} missing required fields: {', '.join(missing_fields)}")
                            continue
                            
                        # Generate username from email if not provided
                        username = row_data.get('username', '')
                        if not username:
                            username = row_data['email'].split('@')[0]
                            
                            # Check if username exists and append numbers if needed
                            base_username = username
                            counter = 1
                            while User.objects.filter(username=username).exists():
                                username = f"{base_username}{counter}"
                                counter += 1
                                
                        # Check if user with this email already exists in this company
                        if User.objects.filter(email=row_data['email'], company=company).exists():
                            results['total_errors'] += 1
                            results['errors'].append(f"User with email {row_data['email']} already exists in this company")
                            continue
                        
                        # Generate a random secure password regardless of what was provided
                        # This ensures security by always using a strong random password
                        password = generate_random_password(12)
                        
                        # Get or create department
                        department_name = row_data.get('department', 'IT')
                        department, created = Department.objects.get_or_create(
                            name=department_name,
                            company=company,
                            defaults={'name': department_name, 'company': company}
                        )
                        
                        try:
                            # Create user object but don't save it yet
                            user = User(
                                username=username,
                                email=row_data['email'],
                                first_name=row_data['first_name'],
                                last_name=row_data['last_name'],
                                role=row_data['role'],
                                company=company,
                                department=department
                            )
                            
                            # Generate UUID and company_email_id before saving
                            if not user.uuid:
                                user.uuid = uuid.uuid4()
                            
                            # Generate a unique company_email_id
                            company_slug = company.slug if company.slug else str(company.id)
                            base_id = f"{user.email}:{company_slug}"
                            
                            # Add a unique suffix if needed
                            counter = 0
                            temp_id = base_id
                            while User.objects.filter(company_email_id=temp_id).exists():
                                counter += 1
                                temp_id = f"{base_id}:{counter}"
                            
                            user.company_email_id = temp_id
                            
                            # Set the password and save
                            user.set_password(password)
                            user.save()
                            
                            # Add created user to the results
                            results['created_users'].append(UserSerializer(user).data)
                            results['total_created'] += 1
                            
                        except Exception as e:
                            results['total_errors'] += 1
                            results['errors'].append(f"Error creating user {row_data['email']}: {str(e)}")
                            continue
                        
                    except Exception as e:
                        results['total_errors'] += 1
                        results['errors'].append(f"Error processing row {row_index}: {str(e)}")

                return Response(results, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({"detail": f"Error reading XLSX file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        elif file.name.endswith('.xls'):
            try:
                workbook = xlrd.open_workbook(file_contents=file.read())
                sheet = workbook.sheet_by_index(0)
                headers = [cell.value for cell in sheet.row(0)]
                results = {
                    'created_users': [],
                    'total_created': 0,
                    'total_errors': 0,
                    'errors': []
                }

                for row_index in range(1, sheet.nrows):
                    row = sheet.row_values(row_index)
                    row_data = dict(zip(headers, row))
                    try:
                        # Validate required fields
                        required_fields = ['first_name', 'last_name', 'email', 'role']
                        missing_fields = [field for field in required_fields if field not in row_data or not row_data[field]]
                        
                        if missing_fields:
                            results['total_errors'] += 1
                            results['errors'].append(f"Row {row_index + 1} missing required fields: {', '.join(missing_fields)}")
                            continue
                            
                        # Generate username from email if not provided
                        username = row_data.get('username', '')
                        if not username:
                            username = row_data['email'].split('@')[0]
                            
                            # Check if username exists and append numbers if needed
                            base_username = username
                            counter = 1
                            while User.objects.filter(username=username).exists():
                                username = f"{base_username}{counter}"
                                counter += 1
                                
                        # Check if user with this email already exists in this company
                        if User.objects.filter(email=row_data['email'], company=company).exists():
                            results['total_errors'] += 1
                            results['errors'].append(f"User with email {row_data['email']} already exists in this company")
                            continue
                        
                        # Generate a random secure password regardless of what was provided
                        # This ensures security by always using a strong random password
                        password = generate_random_password(12)
                        
                        # Get or create department
                        department_name = row_data.get('department', 'IT')
                        department, created = Department.objects.get_or_create(
                            name=department_name,
                            company=company,
                            defaults={'name': department_name, 'company': company}
                        )
                        
                        try:
                            # Create user object but don't save it yet
                            user = User(
                                username=username,
                                email=row_data['email'],
                                first_name=row_data['first_name'],
                                last_name=row_data['last_name'],
                                role=row_data['role'],
                                company=company,
                                department=department
                            )
                            
                            # Generate UUID and company_email_id before saving
                            if not user.uuid:
                                user.uuid = uuid.uuid4()
                            
                            # Generate a unique company_email_id
                            company_slug = company.slug if company.slug else str(company.id)
                            base_id = f"{user.email}:{company_slug}"
                            
                            # Add a unique suffix if needed
                            counter = 0
                            temp_id = base_id
                            while User.objects.filter(company_email_id=temp_id).exists():
                                counter += 1
                                temp_id = f"{base_id}:{counter}"
                            
                            user.company_email_id = temp_id
                            
                            # Set the password and save
                            user.set_password(password)
                            user.save()
                            
                            # Add created user to the results
                            results['created_users'].append(UserSerializer(user).data)
                            results['total_created'] += 1
                            
                        except Exception as e:
                            results['total_errors'] += 1
                            results['errors'].append(f"Error creating user {row_data['email']}: {str(e)}")
                            continue
                        
                    except Exception as e:
                        results['total_errors'] += 1
                        results['errors'].append(f"Error processing row {row_index + 1}: {str(e)}")

                return Response(results, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({"detail": f"Error reading XLS file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {"detail": "Unsupported file format. Please upload a CSV, XLS, or XLSX file."},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserDetailView(APIView):
    """
    View for retrieving, updating or deleting a user instance
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id, company_slug=None):
        """
        Retrieve a user by ID
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
                    {"detail": "You don't have access to manage users in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get the user
            user = get_object_or_404(User, id=user_id, company=company)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        # If no company slug, only super admins can access any user
        if request.user.role.lower() == 'super_admin':
            user = get_object_or_404(User, id=user_id)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def patch(self, request, user_id, company_slug=None):
        """
        Update a user's information
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
                    {"detail": "You don't have access to manage users in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get the user to update
            user = get_object_or_404(User, id=user_id, company=company)
            
            # Don't allow changing super admin status unless you are a super admin
            if user.role.lower() == 'super_admin' and request.user.role.lower() != 'super_admin':
                return Response(
                    {"detail": "You don't have permission to modify a super admin."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Don't allow users to deactivate themselves
            if str(user.id) == str(request.user.id) and 'is_active' in request.data and not request.data['is_active']:
                return Response(
                    {"detail": "You cannot deactivate your own account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the user
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # If no company slug, only super admins can update any user
        if request.user.role.lower() == 'super_admin':
            user = get_object_or_404(User, id=user_id)
            
            # Don't allow users to deactivate themselves
            if str(user.id) == str(request.user.id) and 'is_active' in request.data and not request.data['is_active']:
                return Response(
                    {"detail": "You cannot deactivate your own account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

class UserDepartmentUpdateView(APIView):
    """
    View for updating a user's department
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, user_id, company_slug=None):
        """
        Update a user's department
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
                    {"detail": "You don't have access to manage users in this company."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Get the user to update
            user = get_object_or_404(User, id=user_id, company=company)
            
            # Check if department is provided
            if 'department' not in request.data:
                return Response(
                    {"detail": "Department ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            department_id = request.data['department']
            
            # Check if department exists
            try:
                department = Department.objects.get(id=department_id, company=company)
            except Department.DoesNotExist:
                return Response(
                    {"detail": "Department not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update the user's department
            user.department = department
            user.save()
            
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        # If no company slug, only super admins can update any user
        if request.user.role.lower() == 'super_admin':
            user = get_object_or_404(User, id=user_id)
            
            # Check if department is provided
            if 'department' not in request.data:
                return Response(
                    {"detail": "Department ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            department_id = request.data['department']
            
            # Check if department exists
            try:
                department = Department.objects.get(id=department_id)
                # For super admin, ensure the department and user belong to the same company
                if department.company != user.company:
                    return Response(
                        {"detail": "Department and user must belong to the same company."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Department.DoesNotExist:
                return Response(
                    {"detail": "Department not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update the user's department
            user.department = department
            user.save()
            
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

class UserPasswordResetView(APIView):
    def post(self, request, company_slug=None):
        try:
            # Get user_id from request data
            user_id = request.data.get('user_id')
            if not user_id:
                return Response(
                    {"detail": "User ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get the user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"detail": "User not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # If company_slug is provided, verify the user belongs to that company
            if company_slug:
                try:
                    company = Company.objects.get(slug=company_slug)
                    if user.company != company:
                        return Response(
                            {"detail": "User does not belong to the specified company."},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except Company.DoesNotExist:
                    return Response(
                        {"detail": "Company not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Generate a random password
            import string
            import random
            new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            
            # Set the new password
            user.set_password(new_password)
            user.save()

            # Send password reset email
            try:
                email_sent = send_password_reset_email(user, new_password, company_slug or '')
                if email_sent:
                    return Response(
                        {"detail": "Password reset email sent successfully."},
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {
                            "detail": "Password was reset but email could not be sent.",
                            "temporary_password": new_password
                        },
                        status=status.HTTP_200_OK
                    )
            except Exception as e:
                return Response(
                    {
                        "detail": "Password was reset but there was an error sending the email.",
                        "error": str(e),
                        "temporary_password": new_password
                    },
                    status=status.HTTP_200_OK
                )

        except Exception as e:
            import traceback
            print(f"Error in UserPasswordResetView: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"detail": "An error occurred while processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )