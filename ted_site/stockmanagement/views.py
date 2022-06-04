from decimal import Decimal
import math
from django.http import JsonResponse
from django.views import View
from django.db.models import Q, Case, When, Value
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

from stockmanagement.models import Outstock, Item, Group, Instock, Brand
from .serializers import *
from stockmanagement.util.custom_viewsets import FieldViewMixin, FormDataMixin

class GroupViewSet(FormDataMixin):
    queryset = Group.objects.all().order_by('-modified')
    serializer_class = GroupSerializer


class GroupFieldView(FieldViewMixin):
    model = Group
    exclude = ['item', 'modified']


class ItemViewSet(FormDataMixin,):
    queryset = Item.objects.all().order_by('-modified')
    related_keys = ["group"]
    serializer_class = ItemUpdateSerializer
    view_serializer_class = ItemSerializer


class ItemFieldView(FieldViewMixin):
    model = Item
    exclude = [
        'stock', 'modified', 'code', 'instock', 'outstock', 'max_price',
        'sum_price', 'min_price', 'number_instock', 'number_outstock'
    ]


class InstockViewSet(FormDataMixin):
    queryset = Instock.objects.all().order_by('-modified')
    serializer_class = InstockUpdateSerializer
    view_serializer_class = InstockSerializer
    model = Instock
    related_keys = ["item"]
    can_cut = False

    def create(self, request):
        print(request.data)

        item_id = request.data["item"]["id"]
        connected_item_price = Decimal(math.ceil(Decimal(request.data["price"]) * Decimal(request.data["quantity"]) * 100) / 100)
        connected_item = Item.objects.get(id=item_id)

        connected_item.number_instock += 1
        if(connected_item.sum_price is None):
            connected_item.sum_price = Decimal(0)
        connected_item.sum_price += connected_item_price

        if connected_item.max_price is None or connected_item_price > connected_item.max_price:
            connected_item.max_price = connected_item_price
        if connected_item.min_price is None or connected_item_price < connected_item.min_price:
            connected_item.min_price = connected_item_price

        connected_item.save()
        return super().create(request)
    

class OutstockViewSet(FormDataMixin):
    queryset = Outstock.objects.all().order_by('-modified')
    serializer_class = OutstockUpdateSerializer
    view_serializer_class = OutstockSerializer
    model = Outstock
    related_keys = ["item"]
    can_cut = False
    

class InstockFieldView(FieldViewMixin):
    model = Instock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr']


class OutstockFieldView(FieldViewMixin):
    model = Outstock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr']


SEARCH_RESULTS = 20
class SelectFieldSearch(View):
    def get(self, request, model):
        search_term = request.GET.get('search_term')
        search_results = None

        if model == "item": 
            search_data = Item.objects.filter(
                Q(name__icontains=search_term) | Q(code__icontains=search_term)
            )[:SEARCH_RESULTS]

            search_results = ItemSerializer(search_data, many=True)

        if model == "group":
            search_data = Group.objects.filter(name__icontains=search_term)[:SEARCH_RESULTS]
            search_results = ItemSerializer(search_data, many=True)

        return JsonResponse({'results': search_results.data}, status=200)
    
    
class SearchSuggestions(View):
    suggestions = []
    results_left = SEARCH_RESULTS
    def get_suggestions_from_query(self, model, item_name, search_term):
        items =  model.objects.filter(name__icontains=search_term)[:self.results_left]
        print(items)
        for item in items:
            self.suggestions.append({"name": item_name, "value": item.name})
            self.results_left -= 1
            if self.results_left <= 0: return True
        return False
            
    
    def search_item(self, search_term):
        self.results_left = SEARCH_RESULTS
        self.suggestions = []
        
        if self.get_suggestions_from_query(Group, "group", search_term): return self.suggestions
            
        for item_type in Item.ITEM_TYPES:
            print(item_type)
            print(search_term.casefold())
            if search_term.casefold() in item_type[1]:
                self.suggestions.append({"name": "item_type", "value": item_type[1]})
                self.results_left -= 1
                if self.results_left <= 0: return self.suggestions
                
        if self.get_suggestions_from_query(Brand, "brand", search_term): return self.suggestions
               
        items = Item.objects.annotate(
            found_column=Case(
                When(name__icontains=search_term, then=Value("name")),
                When(code__icontains=search_term, then=Value("code")),
                default=Value("")
            ),
        ).filter(~Q(found_column=""))[:self.results_left]
        
        for item in items:
            self.suggestions.append({"name": item.found_column, "value": getattr(item, item.found_column)})
        
        print(self.suggestions)
        return self.suggestions
    
    
    def get(self, request, model):
        search_term = request.GET.get('search_term')
        
        results = []
        if model == "items": 
            results = self.search_item(search_term)
        
        return JsonResponse({'results': results}, status=200)
            