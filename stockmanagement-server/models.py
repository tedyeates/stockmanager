from app import db
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import validates 
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    
    email = db.Column(db.String(120), index=True, unique=True)
    password = db.Column(db.String(128))
    
    def check_password(self, password):
        return check_password_hash(self.password, password)

    def __init__(self, email, password):
        self.email = email
        self.password = generate_password_hash(password)

    def __repr__(self):
        return '<User {}>'.format(self.email)
    

class Tracked(db.Model):
    __abstract__ = True
    created = db.Column(db.DateTime, server_default=func.now())
    modified = db.Column(db.DateTime, onupdate=func.now())
    
    created_by = db.Column(db.Integer, ForeignKey('user.id'))


class Stock(Tracked):
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(50), nullable=True)
    stock_date = db.Column(db.DateTime, nullable=True)
    quantity = db.Column(db.Float(2, True), nullable=True)
    
    item = db.Column(db.Integer, ForeignKey('item.id'))
    
    @validates('quantity')
    def validate_quantity(self, key, quantity):
        if not quantity > 0:
            raise AssertionError('Quantity must be greater than 0')

        return quantity
    
    
class Instock(Stock):
    __tablename__ = 'instock'
    
    invoice_id = db.Column(db.String(50), nullable=True)
    price = db.Column(db.Float(2, True), nullable=True)
    po_id = db.Column(db.String(50), nullable=True)
    supplier = db.Column(db.String(50), nullable=True)
    
    @validates('price')
    def validate_price(self, key, price):
        if not price > 0:
            raise AssertionError('Price must be greater than 0')

        return price
    
    def get_total_price(self):
        return round(self.price * self.quantity, 2)
    
    def __init__(
        self, user, job_id=None, stock_date=None, quantity=None, invoice_id=None,
        price=None, supplier=None, po_id=None
    ):
        self.job_id = job_id
        self.stock_date = stock_date
        self.quantity = quantity
        self.invoice_id = invoice_id
        self.price = price
        self.supplier = supplier
        self.po_id = po_id
        self.created_by = user

    def __repr__(self):
        return '<Instock {}>'.format(self.id)    

class Outstock(Stock):
    __tablename__ = 'outstock'
    
    customer = db.Column(db.String(200), nullable=True)
    stock_id = db.Column(db.String(200), nullable=True)
    requester = db.Column(db.String(200), nullable=True)
    department = db.Column(db.String(200), nullable=True)
    
    def __init__(
        self, user, job_id=None, stock_date=None, quantity=None, customer=None,
        stock_id=None, requester=None, department=None
    ):
        self.job_id = job_id
        self.stock_date = stock_date
        self.quantity = quantity
        self.stock_id = stock_id
        self.requester = requester
        self.department = department

    def __repr__(self):
        return '<Outstock {}>'.format(self.id)
    
    
class Group(Tracked):
    __tablename__ = 'group'
    
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String())
    description = db.Column(db.String())
    
    items = db.relationship('Item', backref='group', lazy='dynamic')

    def __init__(self, user, name, description):
        self.name = name
        self.description = description
        self.created_by = user

    def __repr__(self):
        return '<Group {}>'.format(self.id)
    

class Brand(Tracked):
    __tablename__ = 'brand'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    
    items = db.relationship('Item', backref='brand', lazy='dynamic')

    def __init__(self, user, name):
        self.name = name
        self.created_by = user

    def __repr__(self):
        return '<Brand {}>'.format(self.id)
    

class Item(Tracked):
    __tablename__ = 'item'
    
    id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String())
    code = db.Column(db.String(), nullable=True)
    description = db.Column(db.String())
    
    brand = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=True)
    group = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)
    
    unit = db.Column(db.String(), nullable=True)
    weight = db.Column(db.Float(2, True), nullable=True)
    instock = db.Column(db.Integer, default=0)
    outstock = db.Column(db.Integer, default=0)
    
    max_price = db.Column(db.Float(2, True), nullable=True)
    sum_price = db.Column(db.Float(2, True), default=0)
    min_price = db.Column(db.Float(2, True), nullable=True)
    
    def get_average_price(self):
        return round(self.sum_price / self.instock, 2)
    
    def get_items_left(self):
        return self.outstock - self.instock
    
    def add_item(self, price, quantity):
        if (self.max_price is None or self.max_price < price):
            self.max_price = price
        
        if (self.min_price is None or self.min_price > price):
            self.min_price = price
            
        self.sum_price = self.sum_price + price
        self.instock += quantity
        
    def move_item_to_outstock(self, quantity):
        if self.instock < self.outstock + quantity:
            raise AssertionError('Not enough items left')

        self.outstock += quantity
        
    def __init__(
        self, user, name, description, weight=None, 
        unit=None, brand=None, group=None, code=None
    ):
        self.name = name
        self.description = description
        self.weight = weight
        self.unit = unit
        self.brand = brand
        self.group = group
        self.code = code
        self.created_by = user
        
    def __repr__(self):
        return '<Item {}, {}>'.format(self.id, self.code)
    
