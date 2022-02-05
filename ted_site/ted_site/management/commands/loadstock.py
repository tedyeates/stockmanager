from stockmanagement.util.load_data_excel import *
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

#  05_loadstock: command: "source /var/app/venv/*/bin/activate && python3 manage.py loadstock"
class Command(BaseCommand):

    def handle(self, *args, **options):
        load_stock_data()