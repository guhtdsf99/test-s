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
            
            # Handle departments list (can be JSON array or CSV string)
            raw_depts = data.get('departments')
            if raw_depts in [None, '', []]:
                raw_depts = []
            
            # If departments passed as comma-separated string, split it
            if isinstance(raw_depts, str):
                raw_depts = [d.strip() for d in raw_depts.split(',') if d.strip()]
            
            # Convert to ints and validate belong to company
            valid_departments = []
            for dept_id in raw_depts:
                try:
                    dept_obj = Department.objects.get(id=int(dept_id), company=company)
                    valid_departments.append(dept_obj)
                except (ValueError, Department.DoesNotExist):
                    return Response(
                        {"detail": f"Department {dept_id} not found for this company."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # If none provided, ensure default IT department exists
            if not valid_departments:
                dept_obj, _ = Department.objects.get_or_create(name='IT', company=company,
                                                               defaults={'name': 'IT', 'company': company})
                valid_departments = [dept_obj]
            
            # Validate required fields
            required_fields = ['first_name', 'last_name', 'email', 'role']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {"detail": f"{field} is required."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Check if user with this email already exists in this company
            if User.objects.filter(email=data['email'], company=company).exists():
                return Response(
                    {"detail": f"A user with email {data['email']} already exists in this company."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if company has reached its user limit (including inactive users)
            total_users = User.objects.filter(company=company).count()
            if total_users >= company.number_of_allowed_users:
                return Response(
                    {"detail": f"Company has reached its limit of {company.number_of_allowed_users} users. Please upgrade your plan or contact support."},
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
            
            # Attach departments list for serializer validation
            data['departments'] = [str(d.id) for d in valid_departments]
            
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
                        company=company
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
                    
                    # Assign many-to-many departments
                    user.departments.set(valid_departments)
                    
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
        
        # Check if file was provided
        if 'file' not in request.FILES:
            return Response(
                {
                    "detail": "No file provided. Please upload a file.",
                    "expected_format": "The file should have columns: first_name, last_name, email, role (required), username, department (optional)"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the file from the request
        file = request.FILES['file']
        file_extension = file.name.split('.')[-1].lower()
        
        # Check file extension
        if file_extension == 'csv':
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
                
                # Check if company has reached its user limit before processing any rows
                total_users = User.objects.filter(company=company).count()
                remaining_slots = company.number_of_allowed_users - total_users
                if remaining_slots <= 0:
                    return Response(
                        {"detail": f"Company has reached its limit of {company.number_of_allowed_users} users. Please upgrade your plan or contact support."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                for row in reader:
                    try:
                        # Check if we would exceed the user limit with this user
                        if results['total_created'] >= remaining_slots:
                            results['errors'].append(f"Company user limit of {company.number_of_allowed_users} reached. Stopped processing remaining rows.")
                            break
                            
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
                        
                        # Handle departments list (can be JSON array or CSV string)
                        raw_depts = []
                        
                        # Check for multiple columns with the same header
                        for key, value in row.items():
                            if key.lower() in ['departments', 'department'] and value and value.strip():
                                # If the value contains commas, split it into multiple departments
                                if ',' in value:
                                    dept_names = [d.strip() for d in value.split(',') if d.strip()]
                                    raw_depts.extend(dept_names)
                                else:
                                    raw_depts.append(value.strip())
                        
                        # Convert to department objects and validate they belong to company
                        valid_departments = []
                        for dept_name in raw_depts:
                            try:
                                # Try to get department by ID first
                                try:
                                    dept_obj = Department.objects.get(id=int(dept_name), company=company)
                                    valid_departments.append(dept_obj)
                                except (ValueError, Department.DoesNotExist):
                                    # If not a valid ID, try to get by name
                                    dept_obj, created = Department.objects.get_or_create(
                                        name=dept_name, 
                                        company=company,
                                        defaults={'name': dept_name, 'company': company}
                                    )
                                    valid_departments.append(dept_obj)
                            except Exception:
                                results['total_errors'] += 1
                                results['errors'].append(f"Department {dept_name} not found for this company and could not be created")
                                continue
                        
                        # If none provided, ensure default IT department exists
                        if not valid_departments:
                            dept_obj, _ = Department.objects.get_or_create(name='IT', company=company,
                                                                           defaults={'name': 'IT', 'company': company})
                            valid_departments = [dept_obj]
                        
                        try:
                            # Create user object but don't save it yet
                            user = User(
                                username=username,
                                email=row['email'],
                                first_name=row['first_name'],
                                last_name=row['last_name'],
                                role=row['role'],
                                company=company
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
                            
                            # Assign many-to-many departments
                            user.departments.set(valid_departments)
                            
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
                    {
                        "detail": f"Error reading CSV file: {str(e)}",
                        "expected_format": "The file should have columns: first_name, last_name, email, role (required), username, department (optional)"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif file_extension == 'xlsx':
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
                
                # Check if company has reached its user limit before processing any rows
                total_users = User.objects.filter(company=company).count()
                remaining_slots = company.number_of_allowed_users - total_users
                if remaining_slots <= 0:
                    return Response(
                        {"detail": f"Company has reached its limit of {company.number_of_allowed_users} users. Please upgrade your plan or contact support."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                for row_index, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                    # Check if we would exceed the user limit with this user
                    if results['total_created'] >= remaining_slots:
                        results['errors'].append(f"Company user limit of {company.number_of_allowed_users} reached. Stopped processing remaining rows.")
                        break
                        
                    # Create a dictionary but handle multiple columns with the same header
                    row_data = {}
                    dept_values = []
                    
                    # Process each cell in the row
                    for i, cell_value in enumerate(row):
                        if i < len(headers):
                            header = headers[i]
                            # Special handling for departments
                            if header and header.lower() in ['departments', 'department']:
                                if cell_value and str(cell_value).strip():
                                    # If the value contains commas, split it into multiple departments
                                    if ',' in str(cell_value):
                                        dept_names = [d.strip() for d in str(cell_value).split(',') if d.strip()]
                                        dept_values.extend(dept_names)
                                    else:
                                        dept_values.append(str(cell_value).strip())
                            else:
                                row_data[header] = cell_value
                    
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
                        
                        # Convert department names/IDs to department objects
                        valid_departments = []
                        for dept_name in dept_values:
                            try:
                                # Try to get department by ID first
                                try:
                                    dept_obj = Department.objects.get(id=int(dept_name), company=company)
                                    valid_departments.append(dept_obj)
                                except (ValueError, Department.DoesNotExist):
                                    # If not a valid ID, try to get by name
                                    dept_obj, created = Department.objects.get_or_create(
                                        name=dept_name, 
                                        company=company,
                                        defaults={'name': dept_name, 'company': company}
                                    )
                                    valid_departments.append(dept_obj)
                            except Exception:
                                results['total_errors'] += 1
                                results['errors'].append(f"Department {dept_name} not found for this company and could not be created")
                                continue
                        
                        # If none provided, ensure default IT department exists
                        if not valid_departments:
                            dept_obj, _ = Department.objects.get_or_create(name='IT', company=company,
                                                                           defaults={'name': 'IT', 'company': company})
                            valid_departments = [dept_obj]
                        
                        try:
                            # Create user object but don't save it yet
                            user = User(
                                username=username,
                                email=row_data['email'],
                                first_name=row_data['first_name'],
                                last_name=row_data['last_name'],
                                role=row_data['role'],
                                company=company
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
                            
                            # Assign many-to-many departments
                            user.departments.set(valid_departments)
                            
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
                return Response(
                    {
                        "detail": f"Error reading XLSX file: {str(e)}",
                        "expected_format": "The file should have columns: first_name, last_name, email, role (required), username, department (optional)"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

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
                
                # Check if company has reached its user limit before processing any rows
                total_users = User.objects.filter(company=company).count()
                remaining_slots = company.number_of_allowed_users - total_users
                if remaining_slots <= 0:
                    return Response(
                        {"detail": f"Company has reached its limit of {company.number_of_allowed_users} users. Please upgrade your plan or contact support."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                for row_index in range(1, sheet.nrows):
                    # Check if we would exceed the user limit with this user
                    if results['total_created'] >= remaining_slots:
                        results['errors'].append(f"Company user limit of {company.number_of_allowed_users} reached. Stopped processing remaining rows.")
                        break
                        
                    row = sheet.row_values(row_index)
                    
                    # Create a dictionary but handle multiple columns with the same header
                    row_data = {}
                    dept_values = []
                    
                    # Process each cell in the row
                    for i, cell_value in enumerate(row):
                        if i < len(headers):
                            header = headers[i]
                            # Special handling for departments
                            if header and header.lower() in ['departments', 'department']:
                                if cell_value and str(cell_value).strip():
                                    # If the value contains commas, split it into multiple departments
                                    if ',' in str(cell_value):
                                        dept_names = [d.strip() for d in str(cell_value).split(',') if d.strip()]
                                        dept_values.extend(dept_names)
                                    else:
                                        dept_values.append(str(cell_value).strip())
                            else:
                                row_data[header] = cell_value
                        
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
                        
                        # Convert department names/IDs to department objects
                        valid_departments = []
                        for dept_name in dept_values:
                            try:
                                # Try to get department by ID first
                                try:
                                    dept_obj = Department.objects.get(id=int(dept_name), company=company)
                                    valid_departments.append(dept_obj)
                                except (ValueError, Department.DoesNotExist):
                                    # If not a valid ID, try to get by name
                                    dept_obj, created = Department.objects.get_or_create(
                                        name=dept_name, 
                                        company=company,
                                        defaults={'name': dept_name, 'company': company}
                                    )
                                    valid_departments.append(dept_obj)
                            except Exception:
                                results['total_errors'] += 1
                                results['errors'].append(f"Department {dept_name} not found for this company and could not be created")
                                continue
                        
                        # If none provided, ensure default IT department exists
                        if not valid_departments:
                            dept_obj, _ = Department.objects.get_or_create(name='IT', company=company,
                                                                           defaults={'name': 'IT', 'company': company})
                            valid_departments = [dept_obj]
                        
                        try:
                            # Create user object but don't save it yet
                            user = User(
                                username=username,
                                email=row_data['email'],
                                first_name=row_data['first_name'],
                                last_name=row_data['last_name'],
                                role=row_data['role'],
                                company=company
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
                            
                            # Assign many-to-many departments
                            user.departments.set(valid_departments)
                            
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
                return Response(
                    {
                        "detail": f"Error reading XLS file: {str(e)}",
                        "expected_format": "The file should have columns: first_name, last_name, email, role (required), username, department (optional)"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {
                    "detail": "Unsupported file format. Please upload a CSV, XLSX, or XLS file.",
                    "expected_format": "The file should have columns: first_name, last_name, email, role (required), username, department (optional)"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

class UserDetailView(APIView):
    """
    View for retrieving, updating or deleting a user instance
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id=None, company_slug=None):
        """
        Retrieve a user instance
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
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def put(self, request, user_id=None, company_slug=None):
        """
        Update a user instance
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
            
            # Get the data from the request
            data = request.data.copy()
            
            # Handle departments list (can be JSON array or CSV string)
            raw_depts = data.get('departments')
            if raw_depts in [None, '', []]:
                raw_depts = []
            
            # If departments passed as comma-separated string, split it
            if isinstance(raw_depts, str):
                raw_depts = [d.strip() for d in raw_depts.split(',') if d.strip()]
            
            # Convert to ints and validate belong to company
            valid_departments = []
            for dept_id in raw_depts:
                try:
                    dept_obj = Department.objects.get(id=int(dept_id), company=company)
                    valid_departments.append(dept_obj)
                except (ValueError, Department.DoesNotExist):
                    return Response(
                        {"detail": f"Department {dept_id} not found for this company."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # If none provided, ensure default IT department exists
            if not valid_departments:
                dept_obj, _ = Department.objects.get_or_create(name='IT', company=company,
                                                               defaults={'name': 'IT', 'company': company})
                valid_departments = [dept_obj]
            
            # Update the user
            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            user.is_active = data.get('is_active', user.is_active)
            
            # Only update role if provided and user has permission
            if 'role' in data and data['role']:
                user.role = data['role']
            
            user.departments.set(valid_departments)
            user.save()
            
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def patch(self, request, user_id=None, company_slug=None):
        """
        Partially update a user instance
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
            
            # Get the data from the request
            data = request.data.copy()
            
            # Update is_active status if provided
            if 'is_active' in data:
                user.is_active = data.get('is_active')
            
            # Update other fields if provided
            if 'first_name' in data:
                user.first_name = data.get('first_name')
            if 'last_name' in data:
                user.last_name = data.get('last_name')
            if 'role' in data and data['role']:
                user.role = data['role']
            
            # Handle departments if provided
            if 'departments' in data:
                raw_depts = data.get('departments')
                if raw_depts in [None, '', []]:
                    raw_depts = []
                
                # If departments passed as comma-separated string, split it
                if isinstance(raw_depts, str):
                    raw_depts = [d.strip() for d in raw_depts.split(',') if d.strip()]
                
                # Convert to ints and validate belong to company
                valid_departments = []
                for dept_id in raw_depts:
                    try:
                        dept_obj = Department.objects.get(id=int(dept_id), company=company)
                        valid_departments.append(dept_obj)
                    except (ValueError, Department.DoesNotExist):
                        return Response(
                            {"detail": f"Department {dept_id} not found for this company."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # If none provided, ensure default IT department exists
                if not valid_departments:
                    dept_obj, _ = Department.objects.get_or_create(name='IT', company=company,
                                                                defaults={'name': 'IT', 'company': company})
                    valid_departments = [dept_obj]
                
                user.departments.set(valid_departments)
            
            user.save()
            
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def delete(self, request, user_id=None, company_slug=None):
        """
        Delete a user instance
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
            
            # Delete the user
            user.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response(
            {"detail": "Company context is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

class UserDepartmentUpdateView(APIView):
    """
    View for updating a user's department
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, user_id=None, company_slug=None):
        """
        Update a user's department (PATCH method)
        """
        return self.put(request, user_id, company_slug)
    
    def put(self, request, user_id=None, company_slug=None):
        """
        Update a user's department (PUT method)
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
            
            # Get the data from the request
            data = request.data.copy()
            
            # Handle departments list (can be JSON array or CSV string)
            raw_depts = data.get('departments')
            if raw_depts in [None, '', []]:
                raw_depts = []
            
            # If departments passed as comma-separated string, split it
            if isinstance(raw_depts, str):
                raw_depts = [d.strip() for d in raw_depts.split(',') if d.strip()]
            
            # Convert to ints and validate belong to company
            valid_departments = []
            for dept_id in raw_depts:
                try:
                    dept_obj = Department.objects.get(id=int(dept_id), company=company)
                    valid_departments.append(dept_obj)
                except (ValueError, Department.DoesNotExist):
                    return Response(
                        {"detail": f"Department {dept_id} not found for this company."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # If none provided, ensure default IT department exists
            if not valid_departments:
                dept_obj, _ = Department.objects.get_or_create(name='IT', company=company,
                                                               defaults={'name': 'IT', 'company': company})
                valid_departments = [dept_obj]
            
            user.departments.set(valid_departments)
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
            if not company_slug:
                return Response({"detail": "Company context is required."}, status=status.HTTP_400_BAD_REQUEST)
                
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user has admin privileges
            user_role = request.user.role.lower() if request.user.role else ''
            is_admin = user_role in ['admin', 'company_admin', 'super_admin']
            
            # Check if user belongs to this company or is a super admin
            if not is_admin or (user_role != 'super_admin' and (not request.user.company or request.user.company.id != company.id)):
                return Response(
                    {"detail": "You don't have permission to reset passwords."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get user ID from request
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({"detail": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Get the user
            user = get_object_or_404(User, id=user_id, company=company)
            
            # Generate a new random password
            new_password = generate_random_password(12)
            
            # Set the new password
            user.set_password(new_password)
            user.save()

            # Send password reset email
            try:
                send_password_reset_email(user, new_password, company_slug)
                return Response({
                    "detail": "Password reset successful. An email has been sent to the user.",
                    "password": new_password  # Include the password in the response for admin reference
                })
            except Exception as e:
                # If email sending fails, still return the password but with a warning
                return Response({
                    "detail": f"Password reset successful but email could not be sent: {str(e)}",
                    "password": new_password
                })
                
        except Exception as e:
            return Response({"detail": f"Error resetting password: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)