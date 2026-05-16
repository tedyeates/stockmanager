from collections import OrderedDict
from rest_framework import serializers
from rest_framework.fields import SkipField
from rest_framework.relations import PKOnlyObject
from django.contrib.auth.models import User

from django.db.models import Manager

from .models import Brand, Group, Item, Outstock, Stock, Instock


class RelatedUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    class Meta:
        model = User 
        fields = ('id', 'name')

    
class GroupSerializer(serializers.ModelSerializer):
    modified = serializers.DateTimeField(format='%d/%m/%Y', read_only=True)

    class Meta:
        model = Group 
        fields = '__all__'


class RelatedGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group 
        fields = ('id', 'name')
        
        
class RelatedBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand 
        fields = ('id', 'name')
        
    
class ItemSerializer(serializers.ModelSerializer):
    group = RelatedGroupSerializer()
    brand = RelatedBrandSerializer()

    class Meta:
        model = Item 
        exclude = ('modified',)
        
class ItemSearchSerializer(serializers.ModelSerializer):
    term_found_column=serializers.CharField()

    class Meta:
        model = Item 
        fields = ("code", "brand", "term_found_column")
        

class ItemUpdateSerializer(ItemSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), required=False, allow_null=True)
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all(), required=False, allow_null=True)
    
class ItemExportSerializer(ItemSerializer):
    group = serializers.SlugRelatedField(read_only=True, slug_field="name")
    brand = serializers.SlugRelatedField(read_only=True, slug_field="brand")
     


class RelatedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item 
        fields = ('id', 'code')
    

class StockSerializer(serializers.ModelSerializer):
    stock_date = serializers.DateField(format='%d/%m/%Y')
    size = serializers.ListField(child=serializers.DecimalField(max_digits=50, decimal_places=2), required=False)
    item = RelatedItemSerializer()
    job = serializers.SlugRelatedField(many=True, read_only=True, slug_field='job_id')

    class Meta:
        model = Stock
        exclude = ('created_date', 'modified')


class InstockSerializer(StockSerializer):
    invoice_id = serializers.CharField(max_length=50)
    price = serializers.DecimalField(max_digits=50, decimal_places=2)
    supplier = serializers.CharField(max_length=50)
    purchase_order_id = serializers.CharField(max_length=50)
    

    class Meta(StockSerializer.Meta):
        model = Instock


class InstockUpdateSerializer(InstockSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())

class InstockExportSerializer(InstockSerializer):
    item = serializers.SlugRelatedField(read_only=True, slug_field='code')

class OutstockSerializer(StockSerializer):
    stock_id = serializers.CharField(max_length=50)
    requester = serializers.CharField(max_length=50)
    department = serializers.CharField(max_length=50)
    customer = serializers.SlugRelatedField(read_only=True, slug_field='name')

    class Meta(StockSerializer.Meta):
        model = Outstock

class OutstockUpdateSerializer(OutstockSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    
    class Meta(OutstockSerializer.Meta):
        exclude=('remaining_quantity',)
    
    
class OutstockExportSerializer(OutstockSerializer):
    item = serializers.SlugRelatedField(read_only=True, slug_field='code')
