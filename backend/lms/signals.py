from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LMSCampaignUser, UserCourseProgress

@receiver(post_save, sender=LMSCampaignUser)
def create_user_course_progress(sender, instance, created, **kwargs):
    """Create UserCourseProgress for each course in the campaign when a user is added."""
    if created:
        campaign = instance.campaign
        for course in campaign.courses.all():
            UserCourseProgress.objects.create(campaign_user=instance, course=course)
