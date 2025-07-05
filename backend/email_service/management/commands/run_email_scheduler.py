import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from apscheduler.schedulers.blocking import BlockingScheduler
from django_apscheduler.jobstores import DjangoJobStore
from email_service.email_tasks import send_queued_email_job

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Runs the APScheduler for sending queued emails."

    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
        scheduler.add_jobstore(DjangoJobStore(), "default")

        scheduler.add_job(
            send_queued_email_job,
            trigger='interval',
            minutes=2,
            id='send_queued_email_job',
            max_instances=1,
            replace_existing=True,
        )
        self.stdout.write("Starting scheduler...")

        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            self.stdout.write("Scheduler stopped.")
