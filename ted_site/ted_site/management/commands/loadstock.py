from stockmanagement.util.load_data_excel import *
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

#  04_loadstock: command: "django-admin.py loadstock"
class Command(BaseCommand):

    def handle(self, *args, **options):
        load_stock_data()