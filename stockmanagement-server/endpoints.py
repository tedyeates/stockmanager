from flask import request, jsonify
from . import db

RESULTS_PER_PAGE = 15

def get_endpoint(model, serializer):
    page = request.args.get("page")
    data = model.query.paginate(page=page, per_page=RESULTS_PER_PAGE)
    return jsonify({
        "results": serializer.dump(data.items), "count": data.total
    })
    

def create_endpoint(model, data):
    data = model(**data)
    db.session.add(data)
    db.commit()
    
    return data