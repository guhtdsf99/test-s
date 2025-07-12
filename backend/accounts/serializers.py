from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Company, Department

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ('id', 'name', 'company')

class UserSerializer(serializers.ModelSerializer):
    department_names = serializers.SerializerMethodField(read_only=True)
    departments = serializers.PrimaryKeyRelatedField(many=True, queryset=Department.objects.all(), required=False)
    
    class Meta:
        model = User
        fields = ('id', 'uuid', 'username', 'email', 'company_email_id', 'first_name', 'last_name', 'role', 'company', 'departments', 'department_names', 'is_active')
        read_only_fields = ('id', 'uuid', 'company_email_id', 'role', 'company')
    
    def get_department_names(self, obj):
        return [d.name for d in obj.departments.all()]

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].required = False
        self.fields['email'] = serializers.EmailField(required=False)

    def validate(self, attrs):
        # If email is provided but username is not, try to find the user by email
        if 'email' in attrs and not attrs.get('username'):
            email = attrs.pop('email')
            try:
                user = User.objects.get(email=email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                pass
            except User.MultipleObjectsReturned:
                # If multiple users have the same email, we need the company context
                # This will be handled in the view
                pass
                
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    company_name = serializers.CharField(write_only=True, required=False)
    company_description = serializers.CharField(write_only=True, required=False)
    departments = serializers.PrimaryKeyRelatedField(many=True, queryset=Department.objects.all(), required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'company_name', 'company_description', 'departments')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def create(self, validated_data):
        company_data = None
        if 'company_name' in validated_data:
            company_data = {
                'name': validated_data.pop('company_name'),
                'description': validated_data.pop('company_description', '')
            }

        user = User.objects.create_user(**validated_data)
        
        if company_data and user.role == User.Role.COMPANY_ADMIN:
            company = Company.objects.create(**company_data)
            user.company = company
            user.save(update_fields=['company'])
        
        return user
