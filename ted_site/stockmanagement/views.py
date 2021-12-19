from rest_framework import viewsets, views

from stockmanagement.models import Stock, Item, Group
from .serializers import GroupSerializer, ItemSerializer, StockSerializer
from stockmanagement.util.custom_viewsets import FormDataMixin

class GroupViewSet(FormDataMixin):
    queryset = Group.objects.all().order_by('-modified')
    serializer_class = GroupSerializer
    model = Group
    exclude = ['item', 'modified']

    def get_queryset(self):
        return Group.objects.all().order_by('-modified')


class ItemViewSet(FormDataMixin,):
    queryset = Item.objects.all().order_by('-modified')
    serializer_class = ItemSerializer
    model = Item
    exclude = ['stock', 'modified', 'code']

    def get_queryset(self):
        return Item.objects.all().order_by('-modified')

    def get_related_data(self):
        return [('group', Group.objects.all(), GroupSerializer)]


class InstockViewSet(FormDataMixin):
    queryset = Stock.objects.filter(is_instock=True).order_by('-modified')
    serializer_class = StockSerializer
    model = Stock
    can_cut = True
    exclude = ['date', 'modified', 'is_instock', 'size']

    def get_queryset(self):
        return Stock.objects.filter(is_instock=True).order_by('-modified')

    def get_related_data(self):
        return [('item', Item.objects.all(), ItemSerializer)]


class OutstockViewSet(FormDataMixin):
    queryset = Stock.objects.filter(is_instock=False).order_by('-modified')
    serializer_class = StockSerializer
    model = Stock
    exclude = ['date', 'modified', 'is_instock', 'size']
    related_data = [('item', Item.objects.all(), ItemSerializer)]

    def get_queryset(self):
        return Stock.objects.filter(is_instock=False).order_by('-modified')

    def get_related_data(self):
        return [('item', Item.objects.all(), ItemSerializer)]