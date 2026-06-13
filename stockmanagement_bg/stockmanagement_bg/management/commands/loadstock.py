from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Load stock data from Excel files into DB, or export as CSVs for psql \\copy"

    def add_arguments(self, parser):
        parser.add_argument(
            "--export-csv",
            action="store_true",
            help="Generate CSVs for psql \\copy instead of writing to DB",
        )

    def handle(self, *args, **options):
        if options["export_csv"]:
            from stockmanagement.util.export_csv import export_stock_csvs
            export_stock_csvs()
        else:
            from stockmanagement.util.load_data_excel import load_stock_data
            load_stock_data()
