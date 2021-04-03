from django.contrib import admin
from stockmanagement.models import Stock, Item, Group

# Register your models here.
admin.site.register(Stock)
admin.site.register(Item)
admin.site.register(Group)