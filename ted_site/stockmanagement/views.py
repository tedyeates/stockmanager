from decimal import Decimal
import math
from django.http import JsonResponse
from django.views import View
from rest_framework.views import APIView
from django.db.models import Q, Max, Min
from django.utils.translation import gettext as _
from rest_framework. serializers import ValidationError

# from auditlog.models import LogEntry

from stockmanagement.models import Outstock, Item, Group, Instock, Brand, SearchSuggestion
from stockmanagement.models import SearchSuggestion
from stockmanagement.models import SEARCH_RESULTS
from .serializers import *
from stockmanagement.util.custom_viewsets import FieldViewMixin, FormDataMixin

from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required

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
    
    def update_price(self, connected_item, connected_item_price, price):
        if(connected_item.sum_price is None):
            connected_item.sum_price = Decimal(0)
            
        
        connected_item.instock_number += 1
        connected_item.sum_price += connected_item_price

        if connected_item.max_price is None or price > connected_item.max_price:
            connected_item.max_price = price
        if connected_item.min_price is None or price < connected_item.min_price:
            connected_item.min_price = price

        
    def update_instock_item(self, request, connected_item):
        price = round(Decimal(request.data["price"]), 2)
        connected_item_price = round(price * round(Decimal(request.data["quantity"]), 2), 2)
        self.update_price(connected_item, connected_item_price, price)


    def update_item_quantity(self, request, connected_item):
        connected_item.quantity += Decimal(request.data["quantity"])


    def get_connected_item(self, request):
        item_id = request.data["item"]
        connected_item = Item.objects.get(id=item_id)
        
        return connected_item


    def create(self, request):
        created_instock = super().create(request)
        connected_item = self.get_connected_item(request)
        
        self.update_instock_item(request, connected_item)
        self.update_item_quantity(request, connected_item)

        connected_item.save()
        
        return created_instock
    
    
    def reset_sum(self, instock):
        item_price = Decimal(round(instock.price * instock.quantity, 2))
        
        instock_item = instock.item
        instock_item.instock_number -= 1
        instock_item.sum_price -= item_price
        return instock_item
        
        
    def reset_price(self, instock):
        instock_item = instock.item
        
        new_max_price = Instock.objects.filter(item=instock_item).aggregate(Max("price"))["price__max"]
        instock_item.max_price = new_max_price

        new_min_price = Instock.objects.filter(item=instock_item).aggregate(Min("price"))["price__min"]
        instock_item.min_price = new_min_price

        instock_item.save()
        return instock_item
        
    
    def update(self, request, pk=None):
        instock = Instock.objects.get(pk=pk)
        are_items_equal = instock.item.id == request.data["item"]["id"]
        
        updated_instock = super().update(request, pk)
        
        old_item = self.reset_sum(instock)
        old_item.quantity -= instock.quantity
        old_item.save()
            
        connected_item = self.get_connected_item(request)
        
            
        updated_item = self.reset_price(instock)
        if are_items_equal: 
            connected_item = updated_item
            
        self.update_item_quantity(request, connected_item)
        self.update_instock_item(request, connected_item)
        connected_item.save()
        
        return updated_instock
        
        
    

class OutstockViewSet(FormDataMixin):
    queryset = Outstock.objects.all().order_by('-modified')
    serializer_class = OutstockUpdateSerializer
    view_serializer_class = OutstockSerializer
    export_serializer_class = OutstockExportSerializer
    model = Outstock
    related_keys = ["item"]
    can_cut = False
    
    def update_quantity_left(self, request, item):
        if item.quantity < request.data["quantity"] or request.data["quantity"] <= 0:
            print(_("Not enough items instock. Only %(quanitity)s items remain") % {'quanitity': item.quantity})
            raise ValidationError({"quantity":[_("Not enough items instock. Only %(quanitity)s items remain") % {'quanitity': item.quantity}]})
        
        item.outstock_number += 1
        item.quantity -= round(Decimal(request.data["quantity"]), 2)
        print("NEW ITEM")
        print(item.name)
        print(item.outstock_number)
        item.save()
    
    def create(self, request):
        created_outstock = super().create(request)
        item = Item.objects.get(id=request.data["item"])
        item.outstock_number += 1
        
        request.data["quantity"] = round(Decimal(request.data["quantity"]), 2)
        self.update_quantity_left(request, item)
        
        return created_outstock


    def update(self, request, pk=None):
        outstock = Outstock.objects.get(pk=pk)
        
        request.data["quantity"] = round(Decimal(request.data["quantity"]), 2)
        
        updated_outstock = super().update(request, pk)
        
        old_item = outstock.item
        old_item.quantity += outstock.quantity
        old_item.outstock_number -= 1
        old_item.save()
        
        item = Item.objects.get(id=request.data["item"])
        self.update_quantity_left(request, item)
        
        return updated_outstock
        


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
            search_data = Group.objects.filter(name__icontains=search_term)[:SEARCH_RESULTS]
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
        if model_name == "item": 
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
    
    
# CYPRESS TESTING
# @method_decorator(login_required, name='dispatch')
class Cypress(APIView):
    
    def delete(self, request):
        SearchSuggestion.objects.all().delete()
        Group.objects.all().delete()
        Item.objects.all().delete()
        Instock.objects.all().delete()
        Outstock.objects.all().delete()

        return JsonResponse({}, status=204)
        
        
    def post(self, request):
        test = Group.objects.create(name="test")
        item = Item.objects.create(name="test item", description="test item description", group=test)
        Item.objects.create(name="test item2", description="test item description")
        
        Instock.objects.create_instock(
            stock_date="1995-08-19", job_id="test", purchase_order_id="123", 
            invoice_id="Test Stock", quantity=10, price=10, item=item,
            supplier="test"
        )
        
        return JsonResponse({}, status=201)
    
    

class CypressInstock(APIView):
    def post(self, request):
        item = Item.objects.create(code="GLN60150X230")
        item2 = Item.objects.create(code="Test")
        Instock.objects.create_instock(
            stock_date="1995-08-19", job_id="test", purchase_order_id="123", 
            invoice_id="Test Stock", quantity=10, price=10, item=item2,
            supplier="test"
        )
        Instock.objects.create_instock(
            stock_date="1995-08-19", job_id="test", purchase_order_id="123", 
            invoice_id="ยกยอด64", quantity=10, price=300, item=item,
            supplier="test"
        )
        Instock.objects.create_instock(
            stock_date="1995-08-19", job_id="test", purchase_order_id="123", 
            invoice_id="ยกยอด65", quantity=10, price=10, item=item, 
            supplier="test"
        )
       
        Outstock.objects.create_outstock(
            stock_id="650852", stock_date="2010-11-10", requester="ted", 
            quantity=2, item=item, job_id="123", customer="phil",
            department="ted house"
        )
        Outstock.objects.create_outstock(
            stock_id="650672", stock_date="2010-11-10", requester="ted", 
            quantity=8, item=item, job_id="123", customer="phil",
            department="ted house"
        )
        
        return JsonResponse({}, status=201)