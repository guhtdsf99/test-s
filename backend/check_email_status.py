import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from accounts.models import Email

def check_email_status(email_id):
    try:
        email = Email.objects.get(id=email_id)
        return email
    except Email.DoesNotExist:
        return None
    except Exception as e:
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email_id = sys.argv[1]
        check_email_status(email_id)