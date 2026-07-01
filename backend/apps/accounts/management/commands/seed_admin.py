from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update the first admin user from environment variables."

    def add_arguments(self, parser):
        parser.add_argument("--email", dest="email", default=None)
        parser.add_argument("--username", dest="username", default=None)
        parser.add_argument("--password", dest="password", default=None)

    def handle(self, *args, **options):
        email = options["email"] or self._get_env("DJANGO_SUPERUSER_EMAIL")
        username = options["username"] or self._get_env("DJANGO_SUPERUSER_USERNAME")
        password = options["password"] or self._get_env("DJANGO_SUPERUSER_PASSWORD")

        if not email:
            raise CommandError("Missing admin email. Set DJANGO_SUPERUSER_EMAIL or pass --email.")
        if not username:
            raise CommandError("Missing admin username. Set DJANGO_SUPERUSER_USERNAME or pass --username.")
        if not password:
            raise CommandError("Missing admin password. Set DJANGO_SUPERUSER_PASSWORD or pass --password.")

        User = get_user_model()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "role": "super_admin",
            },
        )

        user.username = username
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        if hasattr(user, "role"):
            user.role = "super_admin"
        user.set_password(password)
        user.save()

        action = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Superuser {action}: {user.email}"))

    @staticmethod
    def _get_env(name):
        from os import getenv

        value = getenv(name, "").strip()
        return value or None
