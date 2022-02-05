from rest_framework import viewsets, views

from stockmanagement.models import Stock, Item, Group
from .serializers import GroupSerializer, ItemSerializer, StockSerializer
from stockmanagement.util.custom_viewsets import FieldViewMixin, FormDataMixin

class GroupViewSet(FormDataMixin):
    queryset = Group.objects.all().order_by('-modified')
    serializer_class = GroupSerializer

    def get_queryset(self):
        return Group.objects.all().order_by('-modified')


class GroupFieldView(FieldViewMixin):
    model = Group
    exclude = ['item', 'modified']


class ItemViewSet(FormDataMixin,):
    queryset = Item.objects.all().order_by('-modified')
    serializer_class = ItemSerializer

    def get_queryset(self):
        return Item.objects.all().order_by('-modified')

    def get_related_data(self):
        return [('group', Group.objects.all(), GroupSerializer)]


class ItemFieldView(FieldViewMixin):
    model = Item
    exclude = ['stock', 'modified', 'code']



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
    can_cut = True
    related_data = [('item', Item.objects.all(), ItemSerializer)]

    def get_queryset(self):
        return Stock.objects.filter(is_instock=False).order_by('-modified')

    def get_related_data(self):
        return [('item', Item.objects.all(), ItemSerializer)]


class StockFieldView(FieldViewMixin):
    model = Stock
    exclude = ['date', 'modified', 'is_instock', 'size']