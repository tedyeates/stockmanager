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

        connected_item.save()
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
    exclude = ['created_date', 'modified', 'size', 'stock_ptr']


class OutstockFieldView(FieldViewMixin):
    model = Outstock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr']


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
    
    def get(self, request, model):
        
        # TODO tidy up
        model_name = model
        if model == "items": 
            model_name = "item"
        if model == "groups": 
            model_name = "group"
            
        print(request.GET.get('search_term'))
        suggestions = SearchSuggestion.objects.search(model_name, request.GET.get('search_term'))
        serialized_suggestions = SearchSuggestionSerializer(suggestions).data
                
        print(serialized_suggestions)
        print(suggestions)
        
        return JsonResponse({'results': serialized_suggestions}, status=200)