from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

def view_email_in_browser(request, email_id):
    """
    Display an email in the browser and mark it as read
    This provides a reliable way to track email opens
    """
    try:
        # Import here to avoid circular imports
        from accounts.models import Email
        
        # Get the email
        email = get_object_or_404(Email, id=email_id)
        
        # Log details about the request
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        referer = request.META.get('HTTP_REFERER', 'Unknown')
        ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
        
        
        # Mark it as read if it's not already
        if not email.read:
            email.mark_as_read()
        
        # Generate unique tracking IDs
        tracking_id = str(uuid.uuid4())
        timestamp = str(int(datetime.now().timestamp() * 1000))
        
        # Get the tracking URL from settings
        from django.conf import settings
        tracking_url = getattr(settings, 'EMAIL_TRACKING_URL', request.build_absolute_uri('/').rstrip('/'))
        
        # Create a simple HTML wrapper for the email content with additional tracking elements
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{email.subject}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
                .email-container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                .email-header {{ padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 20px; }}
                .email-subject {{ font-size: 1.2em; font-weight: bold; }}
                .email-meta {{ color: #666; font-size: 0.9em; margin-top: 5px; }}
                .email-content {{ line-height: 1.5; }}
                .tracking-notice {{ font-size: 0.8em; color: #999; text-align: center; margin-top: 30px; }}
                .hidden-tracking {{ position: absolute; width: 1px; height: 1px; opacity: 0; }}
            </style>
            <!-- Additional tracking via CSS -->
            <link rel="stylesheet" href="{tracking_url}/api/email/mark-read/{email_id}/?uid={tracking_id}&method=css_link&t={timestamp}">
            <!-- Script-based tracking for browsers that allow it -->
            <script>
                // Create tracking image
                var img = new Image();
                img.src = "{tracking_url}/api/email/mark-read/{email_id}/?uid={tracking_id}&method=script&t={timestamp}";
                // Log view to console
                console.log("Email {email_id} viewed in browser");
            </script>
        </head>
        <body>
            <!-- Hidden tracking elements -->
            <img src="{tracking_url}/api/email/mark-read/{email_id}/?uid={tracking_id}&method=pixel_browser&t={timestamp}" width="1" height="1" alt="" class="hidden-tracking">
            <div style="background-image: url('{tracking_url}/api/email/mark-read/{email_id}/?uid={tracking_id}&method=css_bg&t={timestamp}');" class="hidden-tracking"></div>
            
            <div class="email-container">
                <div class="email-content">
                    {email.content}
                </div>
                <div class="tracking-notice">
                    This email has been viewed and marked as read.
                </div>
            </div>
            
            <!-- Additional tracking at the end of the body -->
            <img src="{tracking_url}/api/email/mark-read/{email_id}/?uid={tracking_id}&method=pixel_end&t={timestamp}" width="1" height="1" alt="" class="hidden-tracking">
        </body>
        </html>
        """
        
        # Add cache-busting headers to prevent caching
        response = HttpResponse(html_content)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        response['ETag'] = f'"{uuid.uuid4()}"'
        response['Last-Modified'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        return response
        
    except Http404:
        logger.warning(f"Attempted to view non-existent email {email_id} in browser")
        error_html = f"<html><body><h1>Email Not Found</h1><p>The requested email could not be found.</p></body></html>"
        return HttpResponse(error_html, status=404)
        
    except Exception as e:
        logger.error(f"Error displaying email {email_id} in browser: {str(e)}", exc_info=True)
        error_html = f"<html><body><h1>Error</h1><p>Could not display email. Please try again later.</p></body></html>"
        return HttpResponse(error_html, status=500)
