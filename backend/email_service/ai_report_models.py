from django.db import models
from django.utils import timezone
from accounts.models import Company
import uuid


class AIPhishingReport(models.Model):
    """Model to store AI-generated phishing reports"""
    
    STATUS_CHOICES = [
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='ai_reports')
    report_name = models.CharField(max_length=255, help_text="Name of the report")
    
    # Campaign data metadata
    campaigns_count = models.IntegerField(help_text="Number of campaigns included in this report")
    start_date = models.DateField(help_text="Start date of the earliest campaign")
    end_date = models.DateField(help_text="End date of the latest campaign")
    
    # Report status and file
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    pdf_file_path = models.CharField(max_length=500, blank=True, null=True, help_text="Path to the generated PDF file")
    
    # AI analysis content (stored as JSON)
    analysis_data = models.JSONField(blank=True, null=True, help_text="AI analysis results and KPIs")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = "AI Phishing Report"
        verbose_name_plural = "AI Phishing Reports"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.report_name} ({self.company.name}) - {self.status}"
    
    def mark_completed(self, pdf_path):
        """Mark the report as completed and set the PDF path"""
        self.status = 'completed'
        self.pdf_file_path = pdf_path
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'pdf_file_path', 'completed_at', 'updated_at'])
    
    def mark_failed(self):
        """Mark the report as failed"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])