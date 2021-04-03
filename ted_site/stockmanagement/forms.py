from django.forms import ModelForm, HiddenInput, BooleanField

from stockmanagement.models import Stock, Item, Group

class GroupForm(ModelForm):
    prefix = 'group'
    class Meta:
        model = Group
        fields = ("name", "description")

class ItemForm(ModelForm):
    prefix = 'item'
    class Meta:
        model = Item
        fields = ("name", "description", "size", "brand", "unit", "group")

class StockForm(ModelForm):
    prefix = 'stock'
    is_instock = BooleanField(widget=HiddenInput(), initial=True, required=False)
    class Meta:
        model = Stock
        fields = ("invoice_id", "purchase_order_number", "pc_job", 
                    "supplier", "item", "quantity", "price", "is_instock")