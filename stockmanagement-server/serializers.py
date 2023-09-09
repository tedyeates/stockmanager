from . import ma
from .models import *

class UserSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User
        load_instance = True
        
    id = ma.auto_field()
    email = ma.auto_field()


class InstockSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Instock
        include_fk = True
        load_instance = True


class OutstockSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Outstock
        include_fk = True
        load_instance = True


class GroupSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Group
        load_instance = True
        
        
class BrandSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Brand
        load_instance = True
        

class ItemSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Item
        include_fk = True
        load_instance = True
