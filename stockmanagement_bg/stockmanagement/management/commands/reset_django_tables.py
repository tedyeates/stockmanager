"""
Back up the entire database, then TRUNCATE only Django-managed tables.

Usage:
    python manage.py reset_django_tables                # backup + wipe
    python manage.py reset_django_tables --skip-backup  # wipe only
    python manage.py reset_django_tables --backup-only  # backup only
"""
import subprocess, datetime
from pathlib import Path
from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection

BACKUP_DIR = Path(settings.BASE_DIR) / "backups"


class Command(BaseCommand):
    help = "Backup all DB tables, then truncate only Django-managed tables"

    def add_arguments(self, parser):
        parser.add_argument("--skip-backup", action="store_true", help="Skip the pg_dump backup step")
        parser.add_argument("--backup-only", action="store_true", help="Only create backup, don't wipe")

    def handle(self, *args, **options):
        if not options["skip_backup"]:
            self._backup()
        if not options["backup_only"]:
            self._truncate()

    # ── backup ────────────────────────────────────────────────────────
    def _backup(self):
        db = settings.DATABASES["default"]
        BACKUP_DIR.mkdir(exist_ok=True)
        stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        out = BACKUP_DIR / f"backup_{stamp}.sql"

        cmd = [
            "pg_dump",
            f"--dbname=postgresql://{db['USER']}:{db['PASSWORD']}@{db['HOST']}:{db.get('PORT', 5432)}/{db['NAME']}",
            "-F", "p",
            "-f", str(out),
        ]
        self.stdout.write(f"Running pg_dump → {out}")
        subprocess.run(cmd, check=True)
        self.stdout.write(self.style.SUCCESS(f"Backup saved: {out}"))

    # ── truncate ──────────────────────────────────────────────────────
    def _truncate(self):
        tables = [
            m._meta.db_table
            for m in apps.get_models()
            if m._meta.managed and not m._meta.proxy
        ]
        print(tables)
        # if not tables:
        #     self.stdout.write("No managed tables found.")
        #     return

        # self.stdout.write(f"Truncating {len(tables)} Django-managed tables:")
        # for t in tables:
        #     self.stdout.write(f"  • {t}")

        # with connection.cursor() as cur:
        #     cur.execute(
        #         f"TRUNCATE {', '.join(tables)} CASCADE;"
        #     )
        # self.stdout.write(self.style.SUCCESS("Done — Django tables wiped."))
