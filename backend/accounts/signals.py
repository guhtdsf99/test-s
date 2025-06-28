from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=User)
def set_default_user_role(sender, instance, created, **kwargs):
    """Set default role for new users if not specified."""
    if created and not instance.role:
        # Set default role to USER if not specified
        instance.role = User.Role.USER
        instance.save(update_fields=['role'])
