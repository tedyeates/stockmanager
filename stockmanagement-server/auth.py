from flask import Blueprint, request, jsonify
from .utils import has_permission
from . import db
from .models import User
from flask_login import login_user, logout_user, login_required

auth = Blueprint('auth', __name__)

@auth.route('/login', methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")
    remember = True if request.json.get("password") else False
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({"message": "Please check your login details and try again."}), 400
    
    login_user(user, remember=remember)
    return jsonify({"message": "Login successful"}), 200


@auth.route('/signup', methods=["POST"])
@login_required
@has_permission('Admin')
def signup():
    email = request.json.get("email")
    password = request.json.get("password")
    
    user = User.query.filter_by(email=email).first()
    
    if user:
        return jsonify({}), 400
    
    new_user = User(email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({}), 200
    
@auth.route('/logout')
def logout():
    logout_user()
    return jsonify({}), 200