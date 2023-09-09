

from flask import Blueprint, request, jsonify
from flask_login import login_required
from .endpoints import get_endpoint, create_endpoint
from .serializers import *
from .models import *

RESULTS_PER_PAGE = 15

user_schema = UserSchema()
instock_schema = InstockSchema()
outstock_schema = OutstockSchema()
group_schema = GroupSchema()
brand_schema = BrandSchema()
item_schema = ItemSchema()

main = Blueprint('main', __name__)

@main.route("/")
@login_required
def index():
    return "Hello World!"

@main.route("/instock/")
@login_required
def get_instock():
    return get_endpoint(Instock, instock_schema)


@main.route("/instock/", method=["POST"])
@login_required
def create_instock():
    request_data = request.json
    if request.json.pop("has_new_item"):
        request_data["item"] = create_endpoint(Item, request.json.pop("item"))
        
    return create_endpoint(Instock, request.json)


@main.route("/outstock/")
@login_required
def get_outstock():
    return get_endpoint(Outstock, outstock_schema)


@main.route("/outstock/", method=["POST"])
@login_required
def create_outstock():
    return create_endpoint(Outstock, request.json)
    

@main.route("/group/")
@login_required
def get_group():
    return get_endpoint(Group, group_schema)


@main.route("/group/", method=["POST"])
@login_required
def create_group():
    return create_endpoint(Group, request.json)


@main.route("/brand/")
@login_required
def get_brand():
    return get_endpoint(Brand, brand_schema)


@main.route("/brand/", method=["POST"])
@login_required
def create_brand():
    return create_endpoint(Group, request.json)
    
    
@main.route("/item/")
@login_required
def get_item():
    return get_endpoint(Item, item_schema)
