import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from apscheduler.schedulers.blocking import BlockingScheduler
from django_apscheduler.jobstores import DjangoJobStore
from email_service.email_tasks import send_queued_email_job
from django.db import close_old_connections
import time

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Runs the APScheduler for sending queued emails."

    def handle(self, *args, **options):
        max_retries = 5
        retry_delay = 30  # seconds
        
        for attempt in range(max_retries):
            try:
                scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
                scheduler.add_jobstore(DjangoJobStore(), "default")

                scheduler.add_job(
                    self.safe_execute_job,
                    trigger='interval',
                    minutes=2,
                    id='send_queued_email_job',
                    max_instances=1,
                    replace_existing=True,
                )
                
                self.stdout.write("Starting scheduler...")
                scheduler.start()
                
            except Exception as e:
                logger.error(f"Scheduler crashed (attempt {attempt + 1}/{max_retries}): {str(e)}", exc_info=True)
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                raise
            finally:
                close_old_connections()
    
    def safe_execute_job(self):
        """Wrapper function to ensure database connections are closed after job execution"""
        try:
            close_old_connections()
            send_queued_email_job()
        except Exception as e:
            logger.error(f"Error in scheduled job: {str(e)}", exc_info=True)
            raise
        finally:
            close_old_connections()