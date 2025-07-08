from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django import forms
from .models import User, Company, Department, Email
from email_service.models import PhishingCampaign  # Import PhishingCampaign

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'number_of_allowed_users', 'company_logo', 'color_palette', 'created_at', 'updated_at')
    search_fields = ('name',)

# Custom form to enforce email uniqueness within a company
class UserAdminForm(forms.ModelForm):
    class Meta:
        model = User
        fields = '__all__'
        
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        company = cleaned_data.get('company')
        
        # Check if a user with this email already exists in this company
        if email and company:
            # Get the current user's ID if it exists (for edit operations)
            instance_id = self.instance.id if self.instance and self.instance.pk else None
            
            # Query for users with the same email and company, excluding the current user
            existing_users = User.objects.filter(email=email, company=company)
            if instance_id:
                existing_users = existing_users.exclude(id=instance_id)
                
            if existing_users.exists():
                self.add_error('email', f'A user with this email already exists in the company {company.name}')
                
        return cleaned_data

# Simplified UserAdmin without custom Media class to avoid 500 errors
class UserAdmin(BaseUserAdmin):
    form = UserAdminForm
    model = User
    list_display = ('email_with_company', 'username', 'first_name', 'last_name', 'role', 'activated', 'is_staff')
    
    def email_with_company(self, obj):
        if obj.company:
            return f"{obj.email} ({obj.company.name})"
        return obj.email
    email_with_company.short_description = 'Email (Company)'
    list_filter = ('is_staff', 'is_superuser', 'role', 'activated')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('username', 'first_name', 'last_name')}),
        (_('Permissions'), {
            'fields': ('is_active', 'activated', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Custom fields'), {'fields': ('role', 'company', 'department')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role', 'company', 'department', 'activated'),
        }),
    )
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)

admin.site.register(User, UserAdmin)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'created_at', 'updated_at')
    list_filter = ('company',)
    search_fields = ('name',)

@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject', 'sender', 'recipient', 'landing_page_slug', 'email_service_config', 'phishing_campaign', 'sent', 'read', 'clicked', 'created_at', 'sent_at')
    list_filter = ('sent', 'read', 'clicked', 'phishing_campaign', 'email_service_config')
    search_fields = ('subject', 'content', 'id', 'landing_page_slug')
    date_hierarchy = 'created_at'
    readonly_fields = ('id', 'created_at', 'sent_at')
    fieldsets = (
        (None, {'fields': ('id', 'subject', 'content', 'landing_content', 'landing_page_slug', 'sender', 'recipient', 'phishing_campaign', 'email_service_config')}),
        (_('Status'), {'fields': ('sent', 'read', 'clicked')}),
        (_('Timestamps'), {'fields': ('created_at', 'sent_at')}),
    )
