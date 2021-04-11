from django.forms import ModelForm, HiddenInput, BooleanField, ModelChoiceField

from stockmanagement.models import Stock, Item, Group

class GroupForm(ModelForm):
    prefix = 'groups'
    class Meta:
        model = Group
        fields = ("name", "description")

class ItemForm(ModelForm):
    prefix = 'items'
    class Meta:
        model = Item
        fields = ("name", "description", "item_type", "size", "brand", "unit", "group")

class StockForm(ModelForm):
    prefix = 'stocks'
    is_instock = BooleanField(widget=HiddenInput(), initial=True, required=False)
    class Meta:
        model = Stock
        fields = ("invoice_id", "purchase_order_number", "pc_job", 
                    "supplier", "item", "quantity", "price", "is_instock")
