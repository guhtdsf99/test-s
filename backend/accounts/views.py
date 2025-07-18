from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import get_object_or_404
from .models import Company
from .serializers import (
    UserSerializer, 
    CompanySerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer
)
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "User created successfully"
        }, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # Check if we're in a company-specific context
        company_slug = kwargs.get('company_slug')
        
        # Get the email from the request data
        email = request.data.get('email')
        password = request.data.get('password')
        
        if company_slug and email and password:
            try:
                # Get the company
                company = Company.objects.get(slug=company_slug)
                
                # Find user with this email and company
                user = User.objects.filter(email=email, company=company).first()
                
                if not user:
                    # Check if user is a super admin (they can log in to any company)
                    super_admin = User.objects.filter(email=email, role='SUPER_ADMIN').first()
                    if super_admin:
                        user = super_admin
                    else:
                        return Response(
                            {"detail": "No account found with this email for this company."},
                            status=status.HTTP_401_UNAUTHORIZED
                        )
                
                # Authenticate with username and password
                auth_user = authenticate(username=user.username, password=password)
                
                if not auth_user:
                    return Response(
                        {"detail": "Invalid credentials."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                # Create a mutable copy of the request data
                mutable_data = request.data.copy()
                mutable_data['username'] = user.username
                
                # Create a new request with the updated data
                request._full_data = mutable_data
                
            except Company.DoesNotExist:
                return Response(
                    {"detail": "Company not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {"detail": f"Authentication error: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        try:
            response = super().post(request, *args, **kwargs)
            
            # If we have a company slug, add company info to the response
            if company_slug and response.status_code == 200:
                try:
                    company = Company.objects.get(slug=company_slug)
                    
                    # Add company info to the response
                    response.data['company'] = {
                        'id': company.id,
                        'name': company.name,
                        'slug': company.slug
                    }
                    
                except Company.DoesNotExist:
                    pass
            
            return response
        except Exception as e:
            return Response(
                {"detail": f"Authentication error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, company_slug=None):
        # If company_slug is provided, check if user has access
        if company_slug:
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user belongs to this company or is a super admin
            if request.user.role != 'SUPER_ADMIN' and (not request.user.company or request.user.company.id != company.id):
                return Response(
                    {"detail": "You don't have access to this company portal."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CompanyListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, company_slug=None):
        # If company_slug is provided, check if user has access
        if company_slug:
            company = get_object_or_404(Company, slug=company_slug)
            
            # Check if user belongs to this company or is a super admin
            if request.user.role != 'SUPER_ADMIN' and (not request.user.company or request.user.company.id != company.id):
                return Response(
                    {"detail": "You don't have access to this company portal."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get the current and new password from request
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {"detail": "Both current password and new password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify current password
        user = request.user
        if not user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # To prevent user enumeration, we return a success message even if the user doesn't exist.
            return Response({'detail': 'If an account with that email exists, a password reset email has been sent.'}, status=status.HTTP_200_OK)

        # Import the password generation function
        from email_service.password_reset import generate_random_password, send_password_reset_email
        
        # Generate a new random password
        new_password = generate_random_password(12)
        
        # Set the new password
        user.set_password(new_password)
        user.save()
        
        # Get company slug for email sending
        company_slug = user.company.slug if user.company and user.company.slug else 'default'
        
        # Send password reset email with the new password
        try:
            send_password_reset_email(user, new_password, company_slug)
        except Exception as e:
            print(f"ERROR: Could not send password reset email. {e}")
            pass

        return Response({'detail': 'If an account with that email exists, a password reset email has been sent.'}, status=status.HTTP_200_OK)
