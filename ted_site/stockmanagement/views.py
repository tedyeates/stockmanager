from rest_framework import viewsets, views

from stockmanagement.models import Instock, Outstock, Stock, Item, Group
from .serializers import GroupSerializer, InstockSerializer, ItemSerializer, OutstockSerializer, StockSerializer
from stockmanagement.util.custom_viewsets import FieldViewMixin, FormDataMixin

class GroupViewSet(FormDataMixin):
    queryset = Group.objects.all().order_by('-modified')
    serializer_class = GroupSerializer


class GroupFieldView(FieldViewMixin):
    model = Group
    exclude = ['item', 'modified']


class ItemViewSet(FormDataMixin,):
    queryset = Item.objects.all().order_by('-modified')
    serializer_class = ItemSerializer

    def get_related_data(self):
        return [('group', Group.objects.all(), GroupSerializer)]


class ItemFieldView(FieldViewMixin):
    model = Item
    exclude = ['stock', 'modified', 'code']


class InstockViewSet(FormDataMixin):
    queryset = Instock.objects.all().order_by('-modified')
    serializer_class = InstockSerializer
    model = Stock
    can_cut = False

    def get_related_data(self):
        return [('item', Item.objects.all(), ItemSerializer)]



class OutstockViewSet(FormDataMixin):
    queryset = Outstock.objects.all().order_by('-modified')
    serializer_class = OutstockSerializer
    can_cut = False

    def get_related_data(self):
        return [('item', Item.objects.all(), ItemSerializer)]


class InstockFieldView(FieldViewMixin):
    model = Instock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr']


class OutstockFieldView(FieldViewMixin):
    model = Outstock
    exclude = ['created_date', 'modified', 'size', 'stock_ptr']