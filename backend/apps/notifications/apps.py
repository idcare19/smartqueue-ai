from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.dispatch import receiver


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'

    def ready(self):
        from django.conf import settings
        if not settings.CELERY_TASK_ALWAYS_EAGER:
            # Only set up periodic tasks in production/staging
            import django_celery_beat.models
            from django_celery_beat.models import PeriodicTask, IntervalSchedule
            import json

            @receiver(post_migrate)
            def setup_periodic_tasks(sender, **kwargs):
                # Create interval schedules
                five_minutes, _ = IntervalSchedule.objects.get_or_create(
                    every=5,
                    period=IntervalSchedule.MINUTES,
                )
                fifteen_minutes, _ = IntervalSchedule.objects.get_or_create(
                    every=15,
                    period=IntervalSchedule.MINUTES,
                )
                hourly, _ = IntervalSchedule.objects.get_or_create(
                    every=1,
                    period=IntervalSchedule.HOURS,
                )
                daily, _ = IntervalSchedule.objects.get_or_create(
                    every=1,
                    period=IntervalSchedule.DAYS,
                )

                # Retry failed notifications every 5 minutes
                PeriodicTask.objects.get_or_create(
                    name="Retry failed notifications",
                    defaults={
                        "interval": five_minutes,
                        "task": "apps.notifications.tasks.retry_all_failed_notifications",
                        "enabled": True,
                    }
                )

                # Generate queue health summary every 15 minutes
                PeriodicTask.objects.get_or_create(
                    name="Queue health summary",
                    defaults={
                        "interval": fifteen_minutes,
                        "task": "apps.notifications.tasks.queue_health_summary_task",
                        "enabled": True,
                    }
                )

                # Generate analytics snapshots hourly
                PeriodicTask.objects.get_or_create(
                    name="Generate analytics snapshots",
                    defaults={
                        "interval": hourly,
                        "task": "apps.notifications.tasks.generate_analytics_snapshots_task",
                        "enabled": True,
                    }
                )

                # Cleanup old logs daily
                PeriodicTask.objects.get_or_create(
                    name="Cleanup old notification logs",
                    defaults={
                        "interval": daily,
                        "task": "apps.notifications.tasks.cleanup_old_logs_task",
                        "kwargs": json.dumps({"days_old": 30}),
                        "enabled": True,
                    }
                )

                # Cleanup old notifications daily
                PeriodicTask.objects.get_or_create(
                    name="Cleanup old notifications",
                    defaults={
                        "interval": daily,
                        "task": "apps.notifications.tasks.cleanup_old_notifications_task",
                        "kwargs": json.dumps({"days_old": 90}),
                        "enabled": True,
                    }
                )

            # Connect the signal
            post_migrate.connect(setup_periodic_tasks, sender=self)