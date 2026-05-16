from decimal import Decimal
import math
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Max, Min
from django.utils.translation import gettext as _
from rest_framework.serializers import ValidationError

from stockmanagement.models import Outstock, Item, Group, Instock, Brand

from .serializers import *
from stockmanagement.util.custom_viewsets import FieldViewMixin, FormDataMixin

from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
    

class GroupViewSet(FormDataMixin):
    model = Group
    queryset = Group.objects.all().order_by('-modified')
    serializer_class = GroupSerializer
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']


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
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['code', 'description', 'unit', 'group__name', 'brand__name', 'notes']
    filterset_fields = {
        'quantity': ['exact', 'gte', 'lte'],
        'max_price': ['exact', 'gte', 'lte'],
        'min_price': ['exact', 'gte', 'lte'],
        'sum_price': ['exact', 'gte', 'lte'],
        'min_quanity': ['exact', 'gte', 'lte'],
        'max_quanity': ['exact', 'gte', 'lte'],
    }
    
    


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
    related_keys = ["item", "job"]
    can_cut = False
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['invoice_id', 'purchase_order_id', 'supplier', 'item__code', 'store_type', 'notes']
    filterset_fields = {
        'quantity': ['exact', 'gte', 'lte'],
        'price': ['exact', 'gte', 'lte'],
        'stock_date': ['exact', 'gte', 'lte'],
    }
    
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
        print(request.data)
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
    related_keys = ["item", "job"]
    can_cut = False
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['stock_id', 'requester', 'department', 'item__code', 'customer__name', 'store_type', 'notes']
    filterset_fields = {
        'quantity': ['exact', 'gte', 'lte'],
        'remaining_quantity': ['exact', 'gte', 'lte'],
        'stock_date': ['exact', 'gte', 'lte'],
    }
    
    def update_quantity_left(self, request, item):
        if item.quantity < request.data["quantity"] or request.data["quantity"] <= 0:
            print(_("Not enough items instock. Only %(quanitity)s items remain") % {'quanitity': item.quantity})
            raise ValidationError({"quantity":[_("Not enough items instock. Only %(quanitity)s items remain") % {'quanitity': item.quantity}]})
        
        item.outstock_number += 1
        item.quantity -= round(Decimal(request.data["quantity"]), 2)
        print("NEW ITEM")
        print(item.code)
        print(item.outstock_number)
        item.save()
    
    def create(self, request):
        data = request.data.copy()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        outstock = Outstock.objects.create_outstock(**serializer.validated_data)
        return JsonResponse(OutstockSerializer(outstock).data, status=201)


    def update(self, request, pk=None):
        data = request.data.copy()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        outstock = Outstock.objects.update_outstock(pk=pk, defaults=serializer.validated_data)
        return JsonResponse(OutstockSerializer(outstock).data, status=201)
        

class InstockFieldView(FieldViewMixin):
    model = Instock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr', 'outstock']


class OutstockFieldView(FieldViewMixin):
    model = Outstock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr', 'instock', 'remaining_quantity']



    