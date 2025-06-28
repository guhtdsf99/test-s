from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


# Existing models (CSWordEmailServ, EmailTemplate) remain here...

class CSWordEmailServ(models.Model):
    host = models.CharField(max_length=255, help_text="SMTP server host")
    port = models.IntegerField(help_text="SMTP server port")
    host_user = models.CharField(max_length=255, help_text="SMTP server username")
    host_password = models.CharField(max_length=255, help_text="SMTP server password")
    is_active = models.BooleanField(default=True, help_text="Whether this configuration is active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Email Service Configuration"
        verbose_name_plural = "Email Service Configurations"

    def __str__(self):
        return f"{self.host}:{self.port} ({self.host_user})"


class EmailTemplate(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    name = models.SlugField(max_length=100, unique=True, help_text="Unique identifier for the template")
    subject = models.CharField(max_length=255, help_text="Email subject line")
    content = models.TextField(help_text="Email content/body")
    company = models.ForeignKey('accounts.Company', on_delete=models.CASCADE, blank=True, null=True, help_text="Company associated with this template")
    is_global = models.BooleanField(default=False, help_text="Whether this template is available globally to all companies")
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium', help_text="Difficulty level of the phishing template")
    category = models.CharField(max_length=100, blank=True, null=True, help_text="Category of the email template (e.g., Financial, HR, IT Support)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Email Template"
        verbose_name_plural = "Email Templates"

    def __str__(self):
        return f"{self.subject} ({'Global' if self.is_global else self.company.name if self.company else 'No company'})"


class PhishingCampaign(models.Model):
    campaign_name = models.CharField(max_length=255, help_text="Name of the phishing campaign")
    company = models.ForeignKey('accounts.Company', on_delete=models.CASCADE, related_name='phishing_campaigns', help_text="Company running this campaign")
    start_date = models.DateField(help_text="Start date of the campaign")
    end_date = models.DateField(help_text="End date of the campaign")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Phishing Campaign"
        verbose_name_plural = "Phishing Campaigns"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.campaign_name} ({self.company.name})"

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date cannot be before the start date.'})
        # Optional: Ensure start_date is not in the past if that's a requirement
        # if self.start_date and self.start_date < timezone.now().date():
        #     raise ValidationError({'start_date': 'Start date cannot be in the past.'})
