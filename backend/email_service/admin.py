from django.contrib import admin
from django.db import models
from django.utils.safestring import mark_safe
from .models import CSWordEmailServ, EmailTemplate, PhishingCampaign, LandingPageTemplate
from .ai_report_models import AIPhishingReport

@admin.register(CSWordEmailServ)
class CSWordEmailServAdmin(admin.ModelAdmin):
    list_display = ('host', 'port', 'host_user', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('host', 'host_user')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('host', 'port', 'host_user', 'host_password', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'difficulty', 'category', 'company', 'is_global', 'created_at', 'updated_at')
    list_filter = ('is_global', 'difficulty', 'category')
    search_fields = ('name', 'subject', 'content', 'company', 'category')
    readonly_fields = ('created_at', 'updated_at', 'content_preview')
    formfield_overrides = {
        models.TextField: {'widget': admin.widgets.AdminTextareaWidget(attrs={'rows': 15})},
    }
    
    fieldsets = (
        (None, {
            'fields': ('name', 'subject', 'content', 'content_preview')
        }),
        ('Availability', {
            'fields': ('company', 'is_global')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def content_preview(self, obj):
        """Display a preview of the HTML content"""
        if obj.content:
            return mark_safe(f'<div style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">{obj.content}</div>')
        return "No content"
    content_preview.short_description = 'Content Preview'


@admin.register(LandingPageTemplate)
class LandingPageTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'company', 'is_global', 'created_at', 'updated_at')
    list_filter = ('is_global', 'company')
    search_fields = ('name', 'slug', 'content', 'company__name')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'content_preview')
    formfield_overrides = {
        models.TextField: {'widget': admin.widgets.AdminTextareaWidget(attrs={'rows': 15})},
    }
    
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'content', 'content_preview')
        }),
        ('Availability', {
            'fields': ('company', 'is_global')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def content_preview(self, obj):
        """Display a preview of the HTML content"""
        if obj.content:
            return mark_safe(f'<div style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">{obj.content}</div>')
        return "No content"
    content_preview.short_description = 'Content Preview'


@admin.register(PhishingCampaign)
class PhishingCampaignAdmin(admin.ModelAdmin):
    list_display = ('campaign_name', 'company', 'start_date', 'end_date', 'start_time', 'end_time', 'created_at', 'updated_at')
    list_filter = ('company',)
    search_fields = ('campaign_name', 'company__name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('campaign_name', 'company', 'start_date', 'end_date', 'start_time', 'end_time')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(AIPhishingReport)
class AIPhishingReportAdmin(admin.ModelAdmin):
    list_display = ('report_name', 'company', 'status', 'campaigns_count', 'start_date', 'end_date', 'created_at', 'completed_at')
    list_filter = ('status', 'company', 'created_at')
    search_fields = ('report_name', 'company__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'completed_at', 'analysis_preview')
    
    def has_module_permission(self, request):
        """Hide from admin menu but keep accessible via direct URL"""
        return False
    
    fieldsets = (
        (None, {
            'fields': ('id', 'company', 'report_name', 'status')
        }),
        ('Campaign Data', {
            'fields': ('campaigns_count', 'start_date', 'end_date')
        }),
        ('Report Files', {
            'fields': ('pdf_file_path',)
        }),
        ('Analysis Data', {
            'fields': ('analysis_data', 'analysis_preview'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def analysis_preview(self, obj):
        """Display a preview of the analysis data"""
        if obj.analysis_data:
            preview = ""
            if 'executive_summary' in obj.analysis_data:
                preview += f"<h4>Executive Summary:</h4><p>{obj.analysis_data['executive_summary'][:200]}...</p>"
            if 'conclusion' in obj.analysis_data:
                preview += f"<h4>Conclusion:</h4><p>{obj.analysis_data['conclusion'][:200]}...</p>"
            return mark_safe(preview)
        return "No analysis data"
    analysis_preview.short_description = 'Analysis Preview'