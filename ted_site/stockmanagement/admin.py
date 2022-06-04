from django.contrib import admin
from stockmanagement.models import Instock, Outstock, Item, Group

# Register your models here.
admin.site.register(Instock)
admin.site.register(Outstock)
admin.site.register(Item)
admin.site.register(Group)