from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
import logging
import base64
import uuid
from datetime import datetime, time

logger = logging.getLogger(__name__)

class JsonResponseWithCors(JsonResponse):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('content_type', 'application/json')
        super().__init__(*args, **kwargs)
        self['Access-Control-Allow-Origin'] = '*'
        self['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        self['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        self['Access-Control-Allow-Credentials'] = 'true'

# Different tracking pixels for different content types
TRANSPARENT_PIXEL = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
SVG_PIXEL = b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
PNG_PIXEL = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')

@csrf_exempt
@require_http_methods(['GET', 'OPTIONS'])
def mark_email_read(request, email_id):
    """
    API endpoint to mark an email as read and return a transparent pixel
    This is triggered automatically when the email is opened in most email clients
    """
    # Log all incoming requests for debugging
    uid = request.GET.get('uid', 'no-uid')
    method = request.GET.get('method', 'pixel')
    user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
    referer = request.META.get('HTTP_REFERER', 'Unknown')
    ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
    
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
        
    try:
        # Import here to avoid circular imports
        from accounts.models import Email
        
        # Try to get and update the email
        try:
            # Get the email from the database, and prefetch the campaign
            email = Email.objects.select_related('phishing_campaign').get(id=email_id)
            
            # If the email is part of a campaign, check if the campaign has ended
            if email.phishing_campaign:
                campaign = email.phishing_campaign
                
                # Combine date and time. Use max time if end_time is not set.
                campaign_end_datetime = datetime.combine(campaign.end_date, campaign.end_time or time.max)
                
                # Make it timezone-aware
                aware_campaign_end_datetime = timezone.make_aware(campaign_end_datetime, timezone.get_current_timezone())

                # If the current time is past the campaign's end time, do nothing.
                if timezone.now() > aware_campaign_end_datetime:
                    logger.info(f"Not marking email {email_id} as read because campaign '{campaign.campaign_name}' ended at {aware_campaign_end_datetime}.")
                else:
                    # Mark it as read if it's not already
                    if not email.read:
                        email.mark_as_read()
            else:
                # If not part of a campaign, mark as read as usual
                if not email.read:
                    email.mark_as_read()
            
        except Email.DoesNotExist:
            logger.warning(f"Attempted to mark non-existent email {email_id} as read")
        except Exception as e:
            logger.error(f"Error marking email {email_id} as read: {str(e)}", exc_info=True)
        
        # Always return the appropriate response based on the tracking method
        method = request.GET.get('method', 'pixel')
        
        if method == 'link':
            response = HttpResponse('<html><body><h1>Email Opened</h1><p>You can close this window.</p></body></html>')
        elif method == 'svg':
            response = HttpResponse(SVG_PIXEL, content_type='image/svg+xml')
        elif method == 'css':
            response = HttpResponse(PNG_PIXEL, content_type='image/png')
        else:
            response = HttpResponse(TRANSPARENT_PIXEL, content_type='image/gif')
        
        # Set cache-busting headers
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        # Add random ETag to prevent caching
        response['ETag'] = f'"{uuid.uuid4()}"'
        
        # Add a unique Last-Modified timestamp to prevent caching
        response['Last-Modified'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        return response
        
    except Exception as e:
        logger.error(f"Unexpected error in mark_email_read: {str(e)}", exc_info=True)
        # Return appropriate response based on tracking method
        method = request.GET.get('method', 'pixel')
        
        if method == 'link':
            # If it's a link click, return a simple HTML page
            response = HttpResponse('<html><body><h1>Email Opened</h1><p>You can close this window.</p></body></html>')
        elif method == 'svg':
            # For SVG tracking, return an SVG image
            response = HttpResponse(SVG_PIXEL, content_type='image/svg+xml')
        elif method == 'css':
            # For CSS tracking, return a PNG image
            response = HttpResponse(PNG_PIXEL, content_type='image/png')
        else:
            # For standard pixel tracking, return the transparent GIF
            response = HttpResponse(TRANSPARENT_PIXEL, content_type='image/gif')
        
        # Set cache-busting headers
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        response['ETag'] = f'"{uuid.uuid4()}"'
        response['Last-Modified'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        return response

@csrf_exempt
@require_http_methods(['GET', 'OPTIONS'])
def mark_email_clicked(request, email_id):
    """
    API endpoint to mark an email as clicked and redirect to the target URL
    This is triggered when a user clicks on a tracked link in the email
    """
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
        
    # Get the redirect URL from the query parameters
    redirect_url = request.GET.get('url', '')
    
    try:
        from accounts.models import Email
        try:
            email = Email.objects.select_related('phishing_campaign').get(id=email_id)
            
            # If the email is part of a campaign, check if the campaign has ended
            if email.phishing_campaign:
                campaign = email.phishing_campaign
                
                # Combine date and time. Use max time if end_time is not set.
                campaign_end_datetime = datetime.combine(campaign.end_date, campaign.end_time or time.max)
                
                # Make it timezone-aware
                aware_campaign_end_datetime = timezone.make_aware(campaign_end_datetime, timezone.get_current_timezone())

                # If the current time is NOT past the campaign's end time, mark as clicked.
                if timezone.now() <= aware_campaign_end_datetime:
                    email.mark_as_clicked()
                else:
                    logger.info(f"Not marking email {email_id} as clicked because campaign '{campaign.campaign_name}' ended at {aware_campaign_end_datetime}.")
            else:
                # If not part of a campaign, mark as clicked as usual
                email.mark_as_clicked()

        except Email.DoesNotExist:
            logger.warning(f"Attempted to mark non-existent email {email_id} as clicked")
        except Exception as e:
            logger.error(f"Error marking email {email_id} as clicked: {str(e)}")
        
        # If a redirect URL was provided, redirect to it
        if redirect_url:
            from django.shortcuts import redirect
            return redirect(redirect_url)
        
        # Otherwise, return a transparent pixel
        response = HttpResponse(TRANSPARENT_PIXEL, content_type='image/gif')
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response
        
    except Exception as e:
        logger.error(f"Unexpected error in mark_email_clicked: {str(e)}")
        # If there was an error but we have a redirect URL, still redirect
        if redirect_url:
            from django.shortcuts import redirect
            return redirect(redirect_url)
        
        # Otherwise return a pixel
        response = HttpResponse(TRANSPARENT_PIXEL, content_type='image/gif')
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
