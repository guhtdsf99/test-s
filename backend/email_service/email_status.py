from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import logging
from accounts.models import Email, User

logger = logging.getLogger(__name__)

class JsonResponseWithCors(JsonResponse):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('content_type', 'application/json')
        super().__init__(*args, **kwargs)
        self['Access-Control-Allow-Origin'] = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else '*'
        self['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        self['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        self['Access-Control-Allow-Credentials'] = 'true'

@csrf_exempt
@require_http_methods(['GET', 'OPTIONS'])
def get_sent_emails(request):
    """
    API endpoint to get sent emails with their read status for the current user
    """
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = JsonResponseWithCors({}, status=200)
        return response
        
    try:
        # Get user ID from query parameters
        user_id = request.GET.get('user_id', None)
        
        if not user_id:
            return JsonResponseWithCors({'error': 'User ID is required'}, status=400)
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponseWithCors({'error': 'User not found'}, status=404)
            
        # Get sent emails for the user
        sent_emails = Email.objects.filter(sender=user).order_by('-created_at')
        
        # Convert to list of dictionaries
        emails_data = []
        for email in sent_emails:
            email_dict = {
                'id': email.id,
                'subject': email.subject,
                'recipient_email': email.recipient.email,
                'recipient_name': f"{email.recipient.first_name} {email.recipient.last_name}",
                'sent': email.sent,
                'read': email.read,
                'clicked': email.clicked,
                'created_at': email.created_at.isoformat(),
                'sent_at': email.sent_at.isoformat() if email.sent_at else None,
            }
            emails_data.append(email_dict)
            
        return JsonResponseWithCors(emails_data, safe=False)
    except Exception as e:
        logger.error(f"Error retrieving sent emails: {str(e)}", exc_info=True)
        return JsonResponseWithCors({'error': str(e)}, status=500)
