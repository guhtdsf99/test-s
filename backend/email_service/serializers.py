from rest_framework import serializers
from .models import CSWordEmailServ, EmailTemplate, PhishingCampaign
from accounts.models import Company

class CSWordEmailServSerializer(serializers.ModelSerializer):
    class Meta:
        model = CSWordEmailServ
        fields = ['id', 'host', 'port', 'host_user', 'is_active']
        # Exclude host_password for security

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'slug']

class EmailTemplateSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'subject', 'content', 'company', 'company_name', 
            'is_global', 'difficulty', 'category'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_company_name(self, obj):
        return obj.company.name if obj.company else None


class PhishingCampaignSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True) # Use existing CompanySerializer for nested representation
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(), source='company', write_only=True
    )
    start_date = serializers.DateField(format='%Y-%m-%d')
    end_date = serializers.DateField(format='%Y-%m-%d')
    start_time = serializers.TimeField(format='%H:%M:%S', required=False, allow_null=True)
    end_time = serializers.TimeField(format='%H:%M:%S', required=False, allow_null=True)

    class Meta:
        model = PhishingCampaign
        fields = [
            'id', 'campaign_name', 'company', 'company_id', 
            'start_date', 'end_date', 'start_time', 'end_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PhishingSummaryStatsSerializer(serializers.Serializer):
    total_campaigns = serializers.IntegerField()
    total_emails_sent = serializers.IntegerField()
    total_emails_clicked = serializers.IntegerField()
    total_emails_read = serializers.IntegerField()
    average_click_rate = serializers.FloatField()
    average_read_rate = serializers.FloatField()

    class Meta:
        fields = [
            'total_campaigns', 'total_emails_sent', 'total_emails_clicked', 
            'total_emails_read', 'average_click_rate', 'average_read_rate'
        ]

class DepartmentPerformanceSerializer(serializers.Serializer):
    department_id = serializers.IntegerField(allow_null=True)
    department_name = serializers.CharField(allow_null=True)
    emails_sent = serializers.IntegerField()
    emails_clicked = serializers.IntegerField()
    emails_read = serializers.IntegerField()
    click_rate = serializers.FloatField()
    read_rate = serializers.FloatField()

    class Meta:
        fields = [
            'department_id', 'department_name', 'emails_sent', 'emails_clicked', 
            'emails_read', 'click_rate', 'read_rate'
        ]

class TemporalTrendPointSerializer(serializers.Serializer):
    period = serializers.CharField() # e.g., 'YYYY-MM'
    click_rate = serializers.FloatField()
    read_rate = serializers.FloatField()
    top_click_rate_department = serializers.DictField(child=serializers.CharField(), allow_null=True)
    top_read_rate_department = serializers.DictField(child=serializers.CharField(), allow_null=True)

    class Meta:
        fields = ['period', 'click_rate', 'read_rate', 'top_click_rate_department', 'top_read_rate_department']
