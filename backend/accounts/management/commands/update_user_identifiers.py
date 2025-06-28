from django.core.management.base import BaseCommand
from accounts.models import User
import uuid

class Command(BaseCommand):
    help = 'Updates existing users with UUIDs and company_email_ids'

    def handle(self, *args, **options):
        users = User.objects.all()
        updated_count = 0
        
        for user in users:
            # Generate UUID if not present
            if not user.uuid:
                user.uuid = uuid.uuid4()
                
            # Generate company_email_id if not present
            if not user.company_email_id and user.company and user.email:
                company_slug = user.company.slug if user.company.slug else str(user.company.id)
                user.company_email_id = f"{user.email}:{company_slug}"
                
            # Save changes
            user.save()
            updated_count += 1
                
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} users'))
