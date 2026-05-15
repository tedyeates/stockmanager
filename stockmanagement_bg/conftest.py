"""
Pytest configuration for stockmanagement backend tests.

Creates unmanaged model tables (customer, job) in the test database
before migrations run, since those models have managed=False but other
models have FK references to them.
"""
import pytest
from django.conf import settings


@pytest.fixture(scope="session")
def django_db_setup(django_test_environment, django_db_blocker):
    """
    Create test database with unmanaged tables created before migrations.

    The Customer and Job models use managed=False (external tables),
    but Outstock has a FK to Customer and Instock/Outstock have M2M to Job.
    Migrations try to add FK constraints referencing these tables, so we
    must create them before migrations run.

    Strategy: connect to Django's pre_migrate signal to create the tables
    with raw SQL before any migration operations execute.
    """
    from django.test.utils import setup_databases, teardown_databases
    from django.db import connections
    from django.db.models.signals import pre_migrate

    def create_unmanaged_tables(sender, **kwargs):
        """Create customer and job tables before migrations run."""
        connection = kwargs.get('using', 'default')
        db_conn = connections[connection]
        with db_conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS "customer" (
                    "id" serial PRIMARY KEY,
                    "name" varchar(50) NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS "job" (
                    "job_id" integer PRIMARY KEY,
                    "name" varchar(200) NULL,
                    "customer_id" integer NULL REFERENCES "customer" ("id")
                        ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
                )
            """)

    # Connect signal before setup_databases triggers migrations
    pre_migrate.connect(create_unmanaged_tables)

    # Disable serialization — Django tries to serialize all models including
    # unmanaged ones, which can fail if the table schema doesn't perfectly
    # match what Django expects.
    for alias in connections:
        connections[alias].creation.serialize = False

    with django_db_blocker.unblock():
        db_cfg = setup_databases(
            verbosity=0,
            interactive=False,
            keepdb=False,
        )

    # Disconnect signal after setup is complete
    pre_migrate.disconnect(create_unmanaged_tables)

    yield

    with django_db_blocker.unblock():
        teardown_databases(db_cfg, verbosity=0)
