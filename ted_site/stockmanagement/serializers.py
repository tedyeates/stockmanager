from rest_framework import serializers
from .models import Brand, Group, Item, Outstock, Stock, Instock

class GroupSerializer(serializers.ModelSerializer):
    modified = serializers.DateTimeField(format='%d/%m/%Y', required=False)

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
    modified = serializers.DateTimeField(format='%d/%m/%Y', required=False)
    group = RelatedGroupSerializer()
    brand = RelatedBrandSerializer()

    class Meta:
        model = Item 
        fields = '__all__'
        
class ItemSearchSerializer(serializers.ModelSerializer):
    term_found_column=serializers.CharField()

    class Meta:
        model = Item 
        fields = ("name", "code", "brand", "term_found_column")
        

class ItemUpdateSerializer(ItemSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all())
    

class RelatedItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Item 
        fields = ('id', 'name')

    

class StockSerializer(serializers.ModelSerializer):
    stock_date = serializers.DateField(format='%d/%m/%Y')
    size = serializers.ListField(child=serializers.DecimalField(max_digits=50, decimal_places=2), required=False)
    item = RelatedItemSerializer()
    job_id = serializers.CharField(max_length=50)

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


class OutstockSerializer(StockSerializer):
    customer = serializers.CharField(max_length=50)
    stock_id = serializers.CharField(max_length=50)
    requester = serializers.CharField(max_length=50)
    department = serializers.CharField(max_length=50)

    class Meta(StockSerializer.Meta):
        model = Outstock


class OutstockUpdateSerializer(OutstockSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())