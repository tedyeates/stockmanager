"""
Test settings for running property-based tests with SQLite in-memory database.
Avoids issues with managed=False models (Customer, Job) that reference external tables.
"""
from stockmanagement_bg.settings import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
