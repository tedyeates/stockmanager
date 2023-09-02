from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

app = Flask(__name__)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://postgres:FHsVKcjoMifQ4W8YYSEu@localhost:5432/stockmanagement"
db = SQLAlchemy(app)
migrate = Migrate(app, db)

from models import *

@app.route("/")
def index():
    return "Hello World!"


if __name__ == '__main__':
    app.run()