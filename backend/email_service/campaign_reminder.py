import os
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from bs4 import BeautifulSoup
from .models import CSWordEmailServ

logger = logging.getLogger(__name__)

def _get_base_url() -> str:
    """Return frontend base URL depending on environment and settings."""
    is_production = not getattr(settings, 'DEBUG', False)
    base_url = None

    if os.environ.get('FRONTEND_URL'):
        base_url = os.environ['FRONTEND_URL']
    elif is_production and os.environ.get('RAILWAY_STATIC_URL'):
        base_url = os.environ['RAILWAY_STATIC_URL']
    elif hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL:
        base_url = settings.FRONTEND_URL
    else:
        base_url = 'http://localhost:3000'

    return base_url.rstrip('/')


def send_campaign_reminder_email(user, campaign, company_slug: str = '') -> bool:
    """Send an email reminding the user that a new LMS campaign has been assigned.

    Args:
        user (accounts.models.User): Recipient user
        campaign (lms.models.LMSCampaign): Campaign assigned
        company_slug (str): Company slug for login URL (optional)

    Returns:
        bool: True if email sent successfully else False
    """
    try:
        to_email = user.email
        first_name = user.first_name or user.username or user.email
        company_name = user.company.name if user.company else 'Phish Aware Academy'

        base_url = _get_base_url()
        login_url = f"{base_url}/{company_slug or user.company.slug if user.company else ''}/login"

        # Format campaign dates (handle both date objects and ISO strings)
        from datetime import datetime, date
        def _fmt(d):
            if not d:
                return None
            if isinstance(d, (datetime, date)):
                return d.strftime('%Y-%m-%d')
            if isinstance(d, str):
                try:
                    return datetime.strptime(d[:10], '%Y-%m-%d').strftime('%Y-%m-%d')
                except ValueError:
                    return d  # fallback to raw string
            return str(d)

        start_date_str = _fmt(campaign.start_date) or 'today'
        end_date_str = _fmt(campaign.end_date) or 'no end date'

        # Formal HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html lang=\"en\">
        <head>
          <meta charset=\"UTF-8\" />
          <title>New LMS Campaign Assigned</title>
        </head>
        <body style=\"margin:0; padding:0; background-color:#f5f8ff; font-family:Arial,Helvetica,sans-serif; color:#333333;\">
          <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">
            <tr>
              <td align=\"center\" style=\"padding:20px 0;\">
                <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 4px rgba(0,0,0,0.1);\">
                  <tr>
                    <td style=\"padding:40px;\">
                      <h2 style=\"color:#1e40af; margin-top:0; margin-bottom:24px; font-size:24px;\">New LMS Campaign Assigned</h2>
                      <p style=\"margin:0 0 16px;\">Hi {first_name},</p>
                      <p style=\"margin:0 0 16px;\">You have been enrolled in the <strong>{campaign.name}</strong> security awareness campaign on {company_name}.</p>
                      <p style=\"margin:0 0 16px;\">This campaign runs from <strong>{start_date_str}</strong> to <strong>{end_date_str}</strong>.</p>
                      <p style=\"margin:0 0 24px;\">Click the button below to log in and begin your training:</p>
                      <p style=\"text-align:center; margin:0 0 24px;\">
                        <a href=\"{login_url}\" style=\"display:inline-block; padding:12px 24px; background-color:#2563eb; color:#ffffff !important; text-decoration:none; border-radius:4px; font-weight:bold;\">Go to Platform</a>
                      </p>
                      <p style=\"margin:0 0 16px;\">If you have any questions, please contact your administrator.</p>
                      <p style=\"margin:0;\">Thank you,<br/>Phish Aware Academy Team</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        subject = f"New LMS Campaign Assigned: {campaign.name}"

        # Get email configuration
        email_config = CSWordEmailServ.objects.filter(is_active=True).first()
        if not email_config:
            logger.error("No active email configuration found in database")
            return False

        connection = get_connection(
            host=email_config.host,
            port=email_config.port,
            username=email_config.host_user,
            password=email_config.host_password,
            use_tls=getattr(settings, 'EMAIL_USE_TLS', True),
        )

        from_email = email_config.host_user

        plain_text_message = html_content.replace('<br>', '\n').replace('<p>', '').replace('</p>', '\n\n')
        plain_text_message = ''.join(BeautifulSoup(plain_text_message, 'html.parser').findAll(text=True))

        email_message = EmailMultiAlternatives(
            subject=subject,
            body=plain_text_message,
            from_email=from_email,
            to=[to_email],
            connection=connection,
        )
        email_message.attach_alternative(html_content, "text/html")
        email_message.send(fail_silently=False)
        return True
    except Exception as exc:
        logger.error("Error sending campaign reminder email: %s", exc, exc_info=True)
        return False
