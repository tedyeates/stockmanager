from rest_framework import serializers
from .models import Group, Instock, Item, Outstock, Stock

class GroupSerializer(serializers.ModelSerializer):
    modified = serializers.DateTimeField(format='%d/%m/%Y', required=False)

    class Meta:
        model = Group 
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    modified = serializers.DateTimeField(format='%d/%m/%Y', required=False)

    class Meta:
        model = Item 
        fields = '__all__'


class StockSerializer(serializers.ModelSerializer):
    stock_date = serializers.DateField(format='%d/%m/%Y')
    size = serializers.ListField(child=serializers.DecimalField(max_digits=50, decimal_places=2), required=False)
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
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


class OutstockSerializer(StockSerializer):
    customer = serializers.CharField(max_length=50)
    stock_id = serializers.CharField(max_length=50)
    requester = serializers.CharField(max_length=50)
    department = serializers.CharField(max_length=50)

    class Meta(StockSerializer.Meta):
        model = Outstock