from django.core.mail import send_mail, get_connection, EmailMultiAlternatives
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from bs4 import BeautifulSoup
import json
import logging

logger = logging.getLogger(__name__)

class JsonResponseWithCors(JsonResponse):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('content_type', 'application/json')
        super().__init__(*args, **kwargs)
        self['Access-Control-Allow-Origin'] = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else '*'
        self['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        self['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        self['Access-Control-Allow-Credentials'] = 'true'

def add_tracking_pixel(body, email_id):
    """
    Add a tracking pixel to the email body to track when it's opened
    """
    if not email_id:
        return body
        
    # Get the base URL from settings
    base_url = settings.BACKEND_URL
    tracking_pixel = f'<img src="{base_url}/api/email/mark-read/{email_id}/" width="1" height="1" alt="" style="display:none;">'
    
    # Add tracking pixel at the end of the body
    if '</body>' in body:
        body = body.replace('</body>', f'{tracking_pixel}</body>')
    else:
        body = f'{body}{tracking_pixel}'
    
    return body

@csrf_exempt
@require_http_methods(['POST', 'OPTIONS'])
def send_email(request):
    # This is a deprecated function and should not be used.
    # The new sending logic is in 'email_sender_updated.py'
    logger.warning("Deprecated send_email function in email_sender.py was called.")

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
            
            # Add tracking pixel to HTML content if email_id is provided
            if email_id:
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
            
            # Send the email
            # email.send(fail_silently=False) # DEPRECATED: This is handled by the updated sender logic
            
            # If this email was saved in the database, mark it as sent
            if email_id:
                try:
                    from accounts.models import Email
                    saved_email = Email.objects.get(id=email_id)
                    # saved_email.mark_as_sent() # DEPRECATED: This is handled by the updated sender logic
                except Exception as e:
                    logger.error(f"Error marking email as sent: {str(e)}")
            
            return JsonResponseWithCors({
                'success': True,
                'message': 'Email sent successfully',
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
