from decimal import Decimal
import math
from django.http import JsonResponse
from django.views import View
from django.db.models import Q

from auditlog.models import LogEntry

from stockmanagement.models import Outstock, Item, Group, Instock, Brand, SearchSuggestion
from stockmanagement.models import SearchSuggestion
from stockmanagement.models import SEARCH_RESULTS
from .serializers import *
from stockmanagement.util.custom_viewsets import FieldViewMixin, FormDataMixin


class LogViewSet(FormDataMixin):
    model = LogEntry
    order_by = None
    queryset = LogEntry.objects.all()
    serializer_class = LogEntrySerializer
    

class GroupViewSet(FormDataMixin):
    model = Group
    queryset = Group.objects.all().order_by('-modified')
    serializer_class = GroupSerializer


class GroupFieldView(FieldViewMixin):
    model = Group
    exclude = ['item', 'modified']


class ItemViewSet(FormDataMixin):
    model = Item
    queryset = Item.objects.all().order_by('-modified')
    related_keys = ["group", "brand"]
    serializer_class = ItemUpdateSerializer
    view_serializer_class = ItemSerializer
    export_serializer_class = ItemExportSerializer
    
    


class ItemFieldView(FieldViewMixin):
    model = Item
    exclude = [
        'stock', 'modified', 'code', 'instock', 'outstock', 'max_price',
        'sum_price', 'min_price', 'instock_number', 'outstock_number'
    ]


class InstockViewSet(FormDataMixin):
    queryset = Instock.objects.all().order_by('-modified')
    serializer_class = InstockUpdateSerializer
    view_serializer_class = InstockSerializer
    export_serializer_class = InstockExportSerializer
    model = Instock
    related_keys = ["item"]
    can_cut = False

    def create(self, request):
        print(request.data)
        create_result = super().create(request)

        item_id = request.data["item"]
        connected_item_price = Decimal(math.ceil(Decimal(request.data["price"]) * Decimal(request.data["quantity"]) * 100) / 100)
        connected_item = Item.objects.get(id=item_id)

        connected_item.instock_number += 1
        if(connected_item.sum_price is None):
            connected_item.sum_price = Decimal(0)
        connected_item.sum_price += connected_item_price

        if connected_item.max_price is None or connected_item_price > connected_item.max_price:
            connected_item.max_price = connected_item_price
        if connected_item.min_price is None or connected_item_price < connected_item.min_price:
            connected_item.min_price = connected_item_price

        connected_item.save(update_fields=[
            "instock_number", "sum_price", "max_price", "min_price"
        ])
        return create_result
    

class OutstockViewSet(FormDataMixin):
    queryset = Outstock.objects.all().order_by('-modified')
    serializer_class = OutstockUpdateSerializer
    view_serializer_class = OutstockSerializer
    export_serializer_class = OutstockExportSerializer
    model = Outstock
    related_keys = ["item"]
    can_cut = False


class InstockFieldView(FieldViewMixin):
    model = Instock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr', 'outstock']


class OutstockFieldView(FieldViewMixin):
    model = Outstock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr', 'instock']


class SelectFieldSearch(View):
    def get(self, request, model):
        search_term = request.GET.get('search_term')
        search_results = None

        if model == "item": 
            search_data = Item.objects.filter(
                Q(name__icontains=search_term) | Q(code__icontains=search_term)
            )[:SEARCH_RESULTS]

            search_results = RelatedItemSerializer(search_data, many=True)

        if model == "group":
            print(search_term)
            search_data = Group.objects.filter(name__icontains=search_term)[:SEARCH_RESULTS]
            print(search_data)
            search_results = RelatedGroupSerializer(search_data, many=True)
        
        if model == "brand": 
            search_data = Brand.objects.filter(name__icontains=search_term)[:SEARCH_RESULTS]
            search_results = RelatedBrandSerializer(search_data, many=True)

        return JsonResponse({'results': search_results.data}, status=200)
    
    

class Search(View):
    suggestions = []
    search_term = ""
    number_fields = {}
    def serialize_suggestions(self, model_name, has_prefix=True):
        prefix = None
        if has_prefix:
            prefix = model_name
        
        sugested_model = SearchSuggestion.objects.search(model_name, self.search_term)
        self.suggestions.extend(SearchSuggestionSerializer(sugested_model, prefix=prefix, many=True).data)
    
    def get_model(self, model):
        if model == "instock":
            return Instock
        if model == "outstock":
            return Outstock
        if model == "item":
            return Item
        if model == "group":
            return Group

    def number_suggestion(self, model_name):
        model = self.get_model(model_name)
        for field in model.number_fields:
            self.suggestions.append(OrderedDict([
                    ("name", f"{field}{SearchSuggestion.DJANGO_GREATER_THAN}"), 
                    ("display_name", field),
                    ("value", self.search_term),
                    ('model', model_name),
                    ('seperator', SearchSuggestion.GREATER_THAN),
                ])
            )
            self.suggestions.append(OrderedDict([
                    ("name", f"{field}{SearchSuggestion.DJANGO_LESS_THAN}"), 
                    ("display_name", field),
                    ("value", self.search_term),
                    ('model', model_name),
                    ('seperator', SearchSuggestion.LESS_THAN),
                ])
            )
 
    
    def related_suggestions(self, model_name):
        if model_name == "instock" or model_name == "outstock":
            self.serialize_suggestions("item")
        if model_name == "items": 
            self.serialize_suggestions("brand")
            self.serialize_suggestions("group")
            
            
    def get(self, request, model):
        SearchSuggestion.objects.reset_suggestion_count()
        
        self.suggestions = []
        model_name = model
        self.search_term = request.GET.get('search_term')

        if self.search_term.isnumeric():
            self.number_suggestion(model_name)
            
        self.serialize_suggestions(model_name, has_prefix=False)
        self.related_suggestions(model_name)
        
        self.suggestions.sort(key=lambda suggestion:suggestion["display_name"])
        return JsonResponse({'results': self.suggestions}, status=200)