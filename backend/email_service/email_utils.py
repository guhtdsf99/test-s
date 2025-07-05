from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from accounts.models import Email, User
import json
import logging

logger = logging.getLogger(__name__)

class JsonResponseWithCors(JsonResponse):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('content_type', 'application/json')
        super().__init__(*args, **kwargs)
        self['Access-Control-Allow-Origin'] = '*'
        self['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        self['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        self['Access-Control-Allow-Credentials'] = 'true'

@csrf_exempt
@require_http_methods(['POST', 'OPTIONS'])
def save_email(request):
    """
    API endpoint to save an email to the database before sending
    """
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = JsonResponseWithCors({}, status=200)
        return response
        
    try:
        # Parse JSON data
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return JsonResponseWithCors(
                {'error': 'Invalid JSON format'}, 
                status=400
            )
        
        # Extract and validate required fields
        to_email = data.get('to')
        from_email = data.get('from')
        subject = data.get('subject')
        body = data.get('body')
        landing_content = data.get('landing_content')
        sender_id = data.get('sender_id')
        phishing_campaign_id = data.get('phishing_campaign_id')
        email_service_config_id = data.get('email_service_config_id')
        
        # Validate required fields
        if not all([to_email, from_email, subject, body, sender_id]):
            missing = [field for field in ['to', 'from', 'subject', 'body', 'sender_id'] 
                     if not data.get(field)]
            error_msg = f'Missing required fields: {", ".join(missing)}'
            logger.warning(error_msg)
            return JsonResponseWithCors(
                {'error': error_msg}, 
                status=400
            )
        
        try:
            # Get sender user
            sender = User.objects.get(id=sender_id)
            
            # Try to get recipient user, create a placeholder if not found
            try:
                recipient = User.objects.get(email=to_email)
            except User.DoesNotExist:
                # Create a placeholder user for the recipient if they don't exist
                # This allows tracking emails to external recipients
                from django.contrib.auth.models import Group
                recipient = User.objects.create(
                    email=to_email,
                    username=to_email.split('@')[0],  # Use part before @ as username
                    first_name='External',
                    last_name='Recipient',
                    is_active=False,  # Mark as inactive since this is just a placeholder
                    role=User.Role.USER,
                    company=sender.company  # Assign to the same company as the sender
                )
            
            # Create email data dictionary
            email_data = {
                'subject': subject,
                'content': body,
                'landing_content': landing_content,
                'sender': sender,
                'recipient': recipient,
                'sent': False,
                'read': False,
                'clicked': False
            }
            
            # Attach email service config if provided
            if email_service_config_id:
                from .models import CSWordEmailServ
                try:
                    email_config_obj = CSWordEmailServ.objects.get(id=email_service_config_id)
                    email_data['email_service_config'] = email_config_obj
                except CSWordEmailServ.DoesNotExist:
                    logger.warning(f"Email service config with ID {email_service_config_id} not found. Using default active config.")
            
            # Add phishing campaign if provided
            if phishing_campaign_id:
                from .models import PhishingCampaign
                try:
                    campaign = PhishingCampaign.objects.get(id=phishing_campaign_id)
                    email_data['phishing_campaign'] = campaign
                except PhishingCampaign.DoesNotExist:
                    logger.warning(f"Phishing campaign with ID {phishing_campaign_id} not found")
            
            # Create a new Email object
            email = Email.objects.create(**email_data)
            
            
            return JsonResponseWithCors({
                'success': True,
                'message': 'Email saved successfully',
                'email_id': email.id,
                'to': to_email,
                'from': from_email,
                'subject': subject
            })
            
        except User.DoesNotExist as e:
            error_msg = f"User not found: {str(e)}"
            logger.error(error_msg)
            return JsonResponseWithCors(
                {'error': error_msg},
                status=404
            )
        except Exception as e:
            error_msg = f"Error saving email: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return JsonResponseWithCors(
                {'error': error_msg},
                status=500
            )
    
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return JsonResponseWithCors(
            {'error': 'An unexpected error occurred'},
            status=500
        )
