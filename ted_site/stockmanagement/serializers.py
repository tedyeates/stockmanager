from rest_framework import serializers
from .models import Group, Item, Stock

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
    date = serializers.DateTimeField(format='%d/%m/%Y', required=False)
    modified = serializers.DateTimeField(format='%d/%m/%Y', required=False)
    size = serializers.ListField(child=serializers.DecimalField(max_digits=50, decimal_places=2), required=True)

    class Meta:
        model = Stock
        exclude = ['is_instock']