from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import logging
from accounts.models import Email

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(['GET'])
def test_mark_read(request, email_id):
    """
    Test endpoint to directly mark an email as read
    This helps diagnose issues with the tracking pixel
    """
    logger.info(f"TEST: Marking email {email_id} as read")
    
    try:
        email = Email.objects.get(id=email_id)
        previous_status = email.read
        email.mark_as_read()
        
        return HttpResponse(
            f"<html><body><h1>Email {email_id} marked as read</h1>"
            f"<p>Previous status: {previous_status}</p>"
            f"<p>Current status: {email.read}</p>"
            f"<p>Email details:</p>"
            f"<ul>"
            f"<li>Subject: {email.subject}</li>"
            f"<li>Sender: {email.sender.email}</li>"
            f"<li>Recipient: {email.recipient.email}</li>"
            f"<li>Sent: {email.sent}</li>"
            f"<li>Read: {email.read}</li>"
            f"<li>Clicked: {email.clicked}</li>"
            f"</ul>"
            "</body></html>",
            content_type="text/html"
        )
    except Email.DoesNotExist:
        return HttpResponse(
            f"<html><body><h1>Error</h1><p>Email with ID {email_id} not found</p></body></html>",
            content_type="text/html",
            status=404
        )
    except Exception as e:
        logger.error(f"Error in test_mark_read: {str(e)}", exc_info=True)
        return HttpResponse(
            f"<html><body><h1>Error</h1><p>{str(e)}</p></body></html>",
            content_type="text/html",
            status=500
        )
