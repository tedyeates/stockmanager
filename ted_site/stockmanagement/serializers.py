from rest_framework import serializers
from django.contrib.auth.models import User
from auditlog.models import LogEntry

from .models import Brand, Group, Item, Outstock, Stock, Instock, SearchSuggestion


class SearchSuggestionSerializer(serializers.ModelSerializer):
    def __init__(self, instance=None, data=None, **kwargs):
        if kwargs.pop("many", False):
            super().__init__(instance, data, **kwargs)
        else:
            self.instance = instance
            for suggestion in instance:
                print("suggestion")
                print(suggestion)
                serialized_suggestion = super().to_representation(suggestion)
                print("serialized_suggestion")
                print(serialized_suggestion)
                self.data.append(serialized_suggestion)
                if suggestion.is_number:
                    self.data.append({
                        **serialized_suggestion, "seperator": self.Meta.model.GREATER_THAN,
                        "name": f"{suggestion.name}__{self.Meta.model.DJANGO_GREATER_THAN}"
                    })
                    self.data.append({
                        **serialized_suggestion, "seperator":self.Meta.model.LESS_THAN,
                        "name": f"{suggestion.name}__{self.Meta.model.DJANGO_LESS_THAN}"
                    })
                
    
    class Meta:
        model = SearchSuggestion
        fields = ("name", "display_name", "value", "model", "seperator")
    
    
    

class RelatedUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    class Meta:
        model = User 
        fields = ('id', 'name')


class LogEntrySerializer(serializers.ModelSerializer):
    actor = RelatedUserSerializer()
    action = serializers.SerializerMethodField()
    changes = serializers.SerializerMethodField()
    content_type = serializers.SlugRelatedField(slug_field="name", read_only=True)
    timestamp = serializers.DateTimeField(format="%d/%m/%Y, %H:%M")
    
    def get_action(self, obj):
        if(obj.action == LogEntry.Action.CREATE):
            return "Create"
        if(obj.action == LogEntry.Action.UPDATE):
            return "Update"
        if(obj.action == LogEntry.Action.DELETE):
            return "Delete"
        
    def get_changes(self, obj):
        return obj.changes_str
    
    class Meta:
        model = LogEntry 
        fields = (
            "object_repr", "action", "changes", 
            "remote_addr", "timestamp", "content_type", "actor"
        )
    
    
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
    group = RelatedGroupSerializer()
    brand = RelatedBrandSerializer()

    class Meta:
        model = Item 
        exclude = ('modified',)
        
class ItemSearchSerializer(serializers.ModelSerializer):
    term_found_column=serializers.CharField()

    class Meta:
        model = Item 
        fields = ("name", "code", "brand", "term_found_column")
        

class ItemUpdateSerializer(ItemSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all())
    
class ItemExportSerializer(ItemSerializer):
    group = serializers.SlugRelatedField(read_only=True, slug_field="name")
    brand = serializers.SlugRelatedField(read_only=True, slug_field="brand")
     


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

class InstockExportSerializer(InstockSerializer):
    item = serializers.SlugRelatedField(read_only=True, slug_field='name')

class OutstockSerializer(StockSerializer):
    customer = serializers.CharField(max_length=50)
    stock_id = serializers.CharField(max_length=50)
    requester = serializers.CharField(max_length=50)
    department = serializers.CharField(max_length=50)

    class Meta(StockSerializer.Meta):
        model = Outstock


class OutstockUpdateSerializer(OutstockSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    
    
class OutstockExportSerializer(OutstockSerializer):
    item = serializers.SlugRelatedField(read_only=True, slug_field='name')
