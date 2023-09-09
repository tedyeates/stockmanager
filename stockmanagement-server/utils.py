from functools import wraps
from flask_login import current_user
from flask import jsonify

def has_permission(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            print(permission)
            print(current_user.has_permission(permission))
            if current_user.has_permission(permission):
                return f(*args, **kwargs)
            return jsonify({"message": "Unauthorized"}), 403
        return decorated_function
    return decorator