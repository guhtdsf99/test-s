from django.core.mail import send_mail, get_connection, EmailMultiAlternatives
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from bs4 import BeautifulSoup
import json
import logging
from .email_tracker import add_tracking_pixel, add_link_tracking

logger = logging.getLogger(__name__)

class JsonResponseWithCors(JsonResponse):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('content_type', 'application/json')
        super().__init__(*args, **kwargs)
        self['Access-Control-Allow-Origin'] = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else '*'
        self['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        self['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        self['Access-Control-Allow-Credentials'] = 'true'

@csrf_exempt
@require_http_methods(['POST', 'OPTIONS'])
def send_email(request):
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
        email_id = data.get('email_id')  # Optional email_id if saved before sending
        
        # Validate required fields
        if not all([to_email, from_email, subject, body]):
            missing = [field for field in ['to', 'from', 'subject', 'body'] 
                     if not data.get(field)]
            error_msg = f'Missing required fields: {", ".join(missing)}'
            logger.warning(error_msg)
            return JsonResponseWithCors(
                {'error': error_msg}, 
                status=400
            )
        
        
        # Get active email configuration from database
        try:
            from .models import CSWordEmailServ
            email_config = CSWordEmailServ.objects.filter(is_active=True).first()
            
            if not email_config:
                logger.error("No active email configuration found in database")
                return JsonResponseWithCors(
                    {'error': 'No active email configuration found'}, 
                    status=500
                )
                
            # Create connection with database settings
            connection = get_connection(
                host=email_config.host,
                port=email_config.port,
                username=email_config.host_user,
                password=email_config.host_password,
                use_tls=settings.EMAIL_USE_TLS,
            )
            
            # Use the host_user from database as the sender email if from_email is not provided
            if not from_email or from_email == 'default':
                from_email = email_config.host_user
            
            # Add tracking to HTML content if email_id is provided
            if email_id:
                # First add link tracking to track clicks
                body = add_link_tracking(body, email_id)
                
                # Then add a tracking pixel to track opens
                body = add_tracking_pixel(body, email_id)
            
            # Create a plain text version of the message (fallback for email clients that don't support HTML)
            plain_text_message = body.replace('<br>', '\n').replace('<p>', '').replace('</p>', '\n\n')
            plain_text_message = ''.join(BeautifulSoup(plain_text_message, 'html.parser').findAll(text=True))
            
            # Create email message with both text and HTML versions
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_text_message,  # Plain text version
                from_email=from_email,
                to=[to_email],
                connection=connection,
            )
            
            # Attach HTML version
            email.attach_alternative(body, "text/html")
            
            # Email sending is now handled by a scheduled task.
            # The 'email' object prepared above is not sent here directly.
            
            return JsonResponseWithCors({
                'success': True,
                'message': 'Email has been queued for sending.',
                'to': to_email,
                'from': from_email,
                'subject': subject,
                'email_id': email_id
            })
            
        except Exception as e:
            error_msg = f"Error sending email: {str(e)}"
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
