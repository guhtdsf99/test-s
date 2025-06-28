from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class EmailServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'email_service'

    def ready(self):
        # Ensure that the app is fully loaded before starting the scheduler
        # and that this code only runs once by the main Django process, not by reloaders.
        import os
        import sys

        # Do not start scheduler if running manage.py makemigrations, migrate, or test
        # or if it's a Django reload process.
        management_commands = {'makemigrations', 'migrate', 'test'}
        if any(cmd in sys.argv for cmd in management_commands) or os.environ.get('RUN_MAIN') == 'true':
            return

        run_once = os.environ.get('DJANGO_SCHEDULER_RUN_ONCE')
        # The RUN_MAIN check above handles the reloader. 
        # The DJANGO_SCHEDULER_RUN_ONCE is an additional safeguard for other scenarios if needed,
        # but might be redundant with a robust RUN_MAIN check.
        # For now, let's keep it simple and rely on RUN_MAIN for reloader, 
        # and the management command check for migrations/tests.
        # We can refine this if issues persist.
        # os.environ['DJANGO_SCHEDULER_RUN_ONCE'] = 'True' # Temporarily commenting this out to simplify logic

        try:
            from .email_tasks import send_queued_email_job
            from django_apscheduler.jobstores import DjangoJobStore
            from apscheduler.schedulers.background import BackgroundScheduler
            from django.conf import settings

            scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)
            scheduler.add_jobstore(DjangoJobStore(), "default")

            scheduler.add_job(
                send_queued_email_job,
                trigger='interval',
                minutes=2,
                id='send_queued_email_job',
                max_instances=1,
                replace_existing=True,
            )
            scheduler.start()
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}", exc_info=True)
