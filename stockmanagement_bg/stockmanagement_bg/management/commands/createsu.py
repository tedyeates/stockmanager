from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from decouple import config

class Command(BaseCommand):

    def handle(self, *args, **options):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                config('SUPER_USER_USERNAME'), 
                "admin@admin.com", 
                config('SUPER_USER_PASSWORD')
            )