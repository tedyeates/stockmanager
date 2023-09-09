from app import db, app
from models import *

if __name__ == '__main__':
    with app.app_context():
        db.drop_all()