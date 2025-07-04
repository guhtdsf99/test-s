from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.utils import timezone
import uuid
from datetime import datetime, time
import logging

logger = logging.getLogger(__name__)


class Department(models.Model):
    name = models.CharField(max_length=100)
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='departments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['name', 'company']
    
    def __str__(self):
        return f"{self.name} ({self.company.name})"

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', _('Super Admin')
        COMPANY_ADMIN = 'COMPANY_ADMIN', _('Company Admin')
        USER = 'USER', _('User')
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
    )
    company = models.ForeignKey(
        'Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    email = models.EmailField(_('email address'))
    # Use a non-callable default for the migration, we'll handle UUID generation in save method
    uuid = models.UUIDField(unique=True, null=True, blank=True)
    company_email_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_('Designates whether this user should be treated as active. '
                    'Unselect this instead of deleting accounts.')
    )
    activated = models.BooleanField(
        _('activated'),
        default=False,
        help_text=_('Indicates whether the user has activated their account.')
    )
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        unique_together = ['email', 'company']
        
    def save(self, *args, **kwargs):
        # Generate UUID if not provided
        if not self.uuid:
            self.uuid = uuid.uuid4()
            
        # Generate a unique company_email_id if not provided
        if not self.company_email_id and self.company and self.email:
            company_slug = self.company.slug if self.company.slug else str(self.company.id)
            base_id = f"{self.email}:{company_slug}"
            
            # Add a unique suffix if needed
            counter = 0
            temp_id = base_id
            while User.objects.filter(company_email_id=temp_id).exists():
                counter += 1
                temp_id = f"{base_id}:{counter}"
            
            self.company_email_id = temp_id
            
        super().save(*args, **kwargs)

class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, help_text="URL-friendly name for company subdirectory")
    description = models.TextField(blank=True)
    number_of_allowed_users = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Email(models.Model):
    subject = models.CharField(max_length=255)
    content = models.TextField()
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_emails')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_emails')
    sent = models.BooleanField(default=False)
    read = models.BooleanField(default=False)
    clicked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    phishing_campaign = models.ForeignKey('email_service.PhishingCampaign', on_delete=models.SET_NULL, null=True, blank=True, related_name='emails', help_text="Associated phishing campaign")
    email_service_config = models.ForeignKey('email_service.CSWordEmailServ', on_delete=models.SET_NULL, null=True, blank=True, related_name='emails', help_text="Email service configuration used to send this email")
    
    def __str__(self):
        return f"{self.subject} - From: {self.sender.email} To: {self.recipient.email}"
    
    def mark_as_sent(self):
        self.sent = True
        self.sent_at = timezone.now()
        self.save()
    
    def mark_as_read(self):
        """ Marks the email as read, if the campaign is still active. """
        if self.phishing_campaign:
            campaign = self.phishing_campaign
            campaign_end_datetime = datetime.combine(campaign.end_date, campaign.end_time or time.max)
            aware_campaign_end_datetime = timezone.make_aware(campaign_end_datetime, timezone.get_current_timezone())

            if timezone.now() > aware_campaign_end_datetime:
                logger.info(f"Not marking email {self.id} as read because campaign '{campaign.campaign_name}' has ended.")
                return

        if not self.read:
            self.read = True
            self.save(update_fields=['read'])

    def mark_as_clicked(self):
        """ Marks the email as clicked, if the campaign is still active. """
        if self.phishing_campaign:
            campaign = self.phishing_campaign
            campaign_end_datetime = datetime.combine(campaign.end_date, campaign.end_time or time.max)
            aware_campaign_end_datetime = timezone.make_aware(campaign_end_datetime, timezone.get_current_timezone())

            if timezone.now() > aware_campaign_end_datetime:
                logger.info(f"Not marking email {self.id} as clicked because campaign '{campaign.campaign_name}' has ended.")
                return

        if not self.clicked:
            self.clicked = True
            self.read = True  # A clicked email is also a read email
            self.save(update_fields=['clicked', 'read'])
