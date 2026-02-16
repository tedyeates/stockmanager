from collections import OrderedDict
from rest_framework import serializers
from rest_framework.fields import SkipField
from rest_framework.relations import PKOnlyObject
from django.contrib.auth.models import User
from auditlog.models import LogEntry
from django.db.models import Manager

from .models import Brand, Group, Item, Job, Outstock, Stock, Instock, SearchSuggestion


class SearchSuggestionListSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        """
        List of object instances -> List of dicts of primitive datatypes.
        """
        # Dealing with nested relationships, data can be a Manager,
        # so, first get a queryset from the Manager if needed
        iterable = data.all() if isinstance(data, Manager) else data
        suggestions = []
        for suggestion in iterable:
            serialized_suggestion = self.child.to_representation(suggestion)
            suggestions.append(serialized_suggestion)

        return suggestions
    
    class Meta:
        model = SearchSuggestion

class SearchSuggestionSerializer(serializers.ModelSerializer):
    def __init__(self, *args, prefix=None, **kwargs):
        self.prefix = prefix
        super().__init__(*args, **kwargs)
    
    
    def prefix_field(self, field_name, field_value):
        if self.prefix is None: return field_value
        if field_name == "name": 
            return f"{self.prefix}__{field_value}"
        if field_name == "display_name": 
            return f"{self.prefix.capitalize()} {field_value}"
        
        return field_value
            
        
    def to_representation(self, instance):
        ret = OrderedDict()
        fields = self._readable_fields
        for field in fields:
            try:
                attribute = field.get_attribute(instance)
            except SkipField:
                continue
        
            check_for_none = attribute.pk if isinstance(attribute, PKOnlyObject) else attribute
            
            if check_for_none is None:
                ret[field.field_name] = None
            else:
                field_value = field.to_representation(attribute)
                ret[field.field_name] = self.prefix_field(field.field_name, field_value)

        return ret
        
    
    class Meta:
        model = SearchSuggestion
        fields = ("name", "display_name", "value", "model", "seperator")
        list_serializer_class = SearchSuggestionListSerializer
    
    
    

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
        fields = ("name", "code", "brand", "term_found_column")
        

class ItemUpdateSerializer(ItemSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), required=False, allow_null=True)
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all(), required=False, allow_null=True)
    
class ItemExportSerializer(ItemSerializer):
    group = serializers.SlugRelatedField(read_only=True, slug_field="name")
    brand = serializers.SlugRelatedField(read_only=True, slug_field="brand")
     


class RelatedItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Item 
        fields = ('id', 'name')
        
        
class RelatedJobSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="job_id", read_only=True)
    class Meta:
            model = Job 
            fields = ('id', 'job_id', 'name')
    

class StockSerializer(serializers.ModelSerializer):
    stock_date = serializers.DateField(format='%d/%m/%Y')
    size = serializers.ListField(child=serializers.DecimalField(max_digits=50, decimal_places=2), required=False)
    item = RelatedItemSerializer()
    customer = serializers.CharField(source="job.customer.name", read_only=True, default="")
    job = RelatedJobSerializer()

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
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all(), allow_null=True, required=False)

class InstockExportSerializer(InstockSerializer):
    item = serializers.SlugRelatedField(read_only=True, slug_field='name')

class OutstockSerializer(StockSerializer):
    stock_id = serializers.CharField(max_length=50)
    requester = serializers.CharField(max_length=50)
    department = serializers.CharField(max_length=50)

    class Meta(StockSerializer.Meta):
        model = Outstock

class OutstockUpdateSerializer(OutstockSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all())
    
    class Meta(OutstockSerializer.Meta):
        exclude=('remaining_quantity',)
    
    
class OutstockExportSerializer(OutstockSerializer):
    item = serializers.SlugRelatedField(read_only=True, slug_field='name')
