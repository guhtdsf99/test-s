import logging
from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings
from bs4 import BeautifulSoup
from datetime import datetime, time
from django.utils import timezone
from .models import CSWordEmailServ
from accounts.models import Email
from .email_tracker import add_tracking_pixel, add_link_tracking

logger = logging.getLogger(__name__)

def send_queued_email_job():
    selected_email_id_for_logging = 'N/A'
    try:
        now = timezone.now()
        today = now.date()

        # Get all unsent emails that belong to a campaign active on the current day.
        # This is a broad filter; a more precise datetime check will follow.
        eligible_emails = Email.objects.filter(
            sent=False,
            phishing_campaign__isnull=False,
            phishing_campaign__start_date__lte=today,
            phishing_campaign__end_date__gte=today
        ).select_related('phishing_campaign').order_by('phishing_campaign__end_date', 'created_at')

        if not eligible_emails.exists():
            return

        # Process eligible emails, performing a precise datetime check for each.
        for selected_email in eligible_emails:
            campaign = selected_email.phishing_campaign

            # Construct start and end datetimes for precise checking.
            # Use the beginning or end of the day if a specific time is not set.
            start_time = campaign.start_time or time.min
            end_time = campaign.end_time or time.max

            # Combine date and time, then make them timezone-aware.
            start_datetime = timezone.make_aware(datetime.combine(campaign.start_date, start_time))
            end_datetime = timezone.make_aware(datetime.combine(campaign.end_date, end_time))

            # Check if the current time is within the campaign's full datetime range.
            if not (start_datetime <= now <= end_datetime):
                logger.info(f"Skipping email {selected_email.id} for campaign '{campaign.campaign_name}' because current time {now} is outside the allowed window ({start_datetime} - {end_datetime}).")
                continue

            selected_email_id_for_logging = selected_email.id
            try:
                # Determine which email configuration to use
                if selected_email.email_service_config:
                    email_config = selected_email.email_service_config
                else:
                    email_config = CSWordEmailServ.objects.filter(is_active=True).first()
                    if not email_config:
                        logger.error('No active email configuration found in database and email has no specific configuration.')
                        continue  # try next email in the queue

                to_email = selected_email.recipient.email
                from_email = email_config.host_user
                subject = selected_email.subject
                body = selected_email.content  # HTML body

                # Add tracking
                body_with_tracking = add_link_tracking(body, str(selected_email_id_for_logging))
                body_with_tracking = add_tracking_pixel(body_with_tracking, str(selected_email_id_for_logging))

                # Plain-text fallback
                plain_text_message = body_with_tracking.replace('<br>', '\n').replace('<p>', '').replace('</p>', '\n\n')
                plain_text_message = ''.join(BeautifulSoup(plain_text_message, 'html.parser').findAll(text=True))

                # SMTP connection
                connection = get_connection(
                    host=email_config.host,
                    port=email_config.port,
                    username=email_config.host_user,
                    password=email_config.host_password,
                    use_tls=getattr(settings, 'EMAIL_USE_TLS', True),
                )

                # Build & send
                email_message = EmailMultiAlternatives(
                    subject=subject,
                    body=plain_text_message,
                    from_email=from_email,
                    to=[to_email],
                    connection=connection,
                )
                email_message.attach_alternative(body_with_tracking, "text/html")
                email_message.send(fail_silently=False)

                selected_email.mark_as_sent()

            except Exception as e:
                logger.error(f"Failed to send email ID {selected_email_id_for_logging}: {str(e)}", exc_info=True)
                # Keep the email unsent for a future retry and continue with next email
                continue
        else:
            logger.info('Scheduled email job: All eligible emails failed to send in this run.')

    except Email.DoesNotExist:
        logger.warning(f"Email ID {selected_email_id_for_logging} not found, possibly deleted before sending.")
    except Exception as e:
        logger.error(f"Error in scheduled email job for email ID {selected_email_id_for_logging}: {str(e)}", exc_info=True)
    finally:
        logger.info('Scheduled email job finished.')
