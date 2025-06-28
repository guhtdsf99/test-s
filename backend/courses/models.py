from django.db import models
from django.core.validators import FileExtensionValidator
from accounts.models import Company

class Question(models.Model):
    """Model for questions associated with courses"""
    question_text = models.CharField(max_length=500)
    answer_text = models.CharField(max_length=500)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='question_list')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.question_text[:50]}..."

class Course(models.Model):
    """Model for courses with video content and associated questions"""
    COURSE_TYPES = (
        ('AWARENESS', 'Awareness'),
        ('TRAINING', 'Training'),
        ('ASSESSMENT', 'Assessment'),
        ('OTHER', 'Other'),
    )
    
    name = models.CharField(max_length=255)
    video = models.FileField(
        upload_to='courses/videos/',
        validators=[FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'mkv', 'webm'])],
        help_text="Upload a video file for this course (mp4, mov, avi, mkv, webm)"
    )
    thumbnail = models.ImageField(
        upload_to='courses/thumbnails/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])],
        help_text="Upload a thumbnail image for this course"
    )
    type = models.CharField(max_length=20, choices=COURSE_TYPES, default='TRAINING')
    companies = models.ManyToManyField(Company, related_name='courses', blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
    
    def __str__(self):
        return self.name
        
    def is_available_for_company(self, company):
        """Check if this course is available for a specific company"""
        return self.companies.filter(id=company.id).exists()
