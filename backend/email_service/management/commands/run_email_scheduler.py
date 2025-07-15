import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from apscheduler.schedulers.blocking import BlockingScheduler
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJob, DjangoJobExecution
from email_service.email_tasks import send_queued_email_job
from django.db import close_old_connections
import time

logger = logging.getLogger(__name__)

def safe_execute_job():
    """Standalone function to execute email job - can be pickled by APScheduler"""
    try:
        close_old_connections()
        logger.info("Executing scheduled email job")
        send_queued_email_job()
        logger.info("Completed scheduled email job")
    except Exception as e:
        logger.error(f"Error in scheduled job: {str(e)}", exc_info=True)
        raise
    finally:
        close_old_connections()

class Command(BaseCommand):
    help = "Runs the APScheduler for sending queued emails."
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--run-now',
            action='store_true',
            help='Run the email job immediately for testing',
        )

    def handle(self, *args, **options):
        # If run-now flag is set, execute job immediately and exit
        if options.get('run_now'):
            self.stdout.write("Running email job immediately...")
            safe_execute_job()
            self.stdout.write("Email job completed.")
            return
            
        max_retries = 5
        retry_delay = 30  # seconds

        # Clear old job state on startup
        self.clear_old_job_state()
        
        for attempt in range(max_retries):
            try:
                scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
                scheduler.add_jobstore(DjangoJobStore(), "default")

                # Remove any existing job with the same ID
                try:
                    scheduler.remove_job('send_queued_email_job')
                except:
                    pass

                scheduler.add_job(
                    safe_execute_job,
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

    def clear_old_job_state(self):
        """Clear old APScheduler job state from database"""
        try:
            # Delete old job executions
            DjangoJobExecution.objects.all().delete()
            
            # Delete old job definitions
            DjangoJob.objects.filter(id='send_queued_email_job').delete()
            
            self.stdout.write("Cleared old job state from database")
            logger.info("Cleared old APScheduler job state")
        except Exception as e:
            logger.warning(f"Could not clear old job state: {str(e)}")

