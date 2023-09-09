from decimal import Decimal
from django.conf import settings
from django.db import models, transaction
from django.db.models import Max, Min
from django.db.models.functions import Length
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator

from auditlog.registry import auditlog

from django.db.models.signals import post_save, post_delete
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


SEARCH_RESULTS = 20
class SearchSuggestionManager(models.Manager):
    number_results = SEARCH_RESULTS
    
    def reset_suggestion_count(self):
        self.number_results = SEARCH_RESULTS
    
    def search(self, model_name, search_term):
        if self.number_results <= 0: return []
        self.query = self.filter(
            model=model_name, value__icontains=search_term
        ).annotate(
            value_length=Length("value")
        ).order_by("value_length").distinct("name", "value", "value_length")[:self.number_results]
        self.number_results -= self.query.count()
        return self.query
    
    

class SearchSuggestion(models.Model):
    GROUP = "Group"
    ITEM = "Item"
    INSTOCK = "Instock"
    OUTSTOCK = "Outstock"
    
    MODEL_TYPE = (
        (GROUP, "Group"),
        (ITEM, "Item"),
        (INSTOCK, "Instock"),
        (OUTSTOCK, "Outstock"),
    )
    
    EQUALS = "="
    GREATER_THAN = ">"
    LESS_THAN = "<"
    DJANGO_EQUALS = "__icontains"
    DJANGO_GREATER_THAN = "__gt"
    DJANGO_LESS_THAN = "__lt"

    
    SEPERATOR = (
        (EQUALS, "Equals"),
        (GREATER_THAN, "Greater Than"),
        (LESS_THAN, "Less Than"),
    )
    
    name = models.CharField(_("Field Name"), max_length=50)
    display_name = models.CharField(_("Field Display Name"), max_length=50)
    value = models.CharField(_("Value"), max_length=200)
    model = models.CharField(_("Model"), choices=MODEL_TYPE, max_length=10)
    seperator = models.CharField(_("Seperator"), max_length=20, default=EQUALS)
    
    is_number = models.BooleanField(_("Is Value of Type Number"))
    content_type = models.ForeignKey(ContentType, null=True, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField(null=True)
    instance = GenericForeignKey("content_type", "object_id")
    
    objects = SearchSuggestionManager()
        
    
    class Meta:
        verbose_name = _("Search Suggestion")
        verbose_name_plural = _("Search Suggestions")
        
    def __str__(self):
        return f"{self.name}={self.value}"




class Searchable(models.Model):
    """Contains post_save and post_delete methods for updating the search suggestions"""
    search_fields = []
    number_fields = {}
    
    @classmethod
    def  create_suggestion(cls, instance, model_name):
        for field in cls.search_fields:
            value = getattr(instance, field)
            if value is None:
                value = ""
                
            is_number = field in cls.number_fields
            name = field
            if not is_number:
                name = f"{field}__icontains"
            
            SearchSuggestion.objects.get_or_create(
                model=model_name, name=name, value=value,
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.pk,
                defaults={
                    "display_name":field, "seperator":SearchSuggestion.EQUALS, 
                    "instance":instance, "is_number":is_number
                }
            )
        
    
    @classmethod
    def  update_suggestion(cls, instance):
        for field in cls.search_fields:
            value = getattr(instance, field)
            if value is None: value = ""
                
            suggestion = SearchSuggestion.objects.get(
                display_name=field, 
                content_type=ContentType.objects.get_for_model(instance).id,
                object_id=instance.pk
            )
            suggestion.value = value
            suggestion.save()
    
        
    @classmethod
    def save_suggestion(cls, sender, instance, created, **kwargs):
        model_name = sender._meta.model_name
        if created: return cls.create_suggestion(instance, model_name)
        cls.update_suggestion(instance)
            
                
                
    @classmethod
    def delete_suggestion(cls, sender, instance, **kwargs):
        SearchSuggestion.objects.filter(object_id=instance.id).delete()
        
    
    @classmethod
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        post_save.connect(cls.save_suggestion, cls)
        post_delete.connect(cls.delete_suggestion, cls)
    
    class Meta:
        abstract = True

    
    
class Group(Searchable):
    search_fields = ["name"]
    
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, null=True)
    name = models.CharField(_("Group Name"), max_length=50)
    description = models.CharField(_("Group Description"), max_length=200)

    class Meta:
        verbose_name = _("Group")
        verbose_name_plural = _("Groups")

    def __str__(self):
        return str(self.name)


class Brand(Searchable):
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, null=True)
    name = models.CharField(_("Brand Name"), max_length=50)
    
    class Meta:
        verbose_name = _("Brand")
        verbose_name_plural = _("Brands")


class Item(Searchable):
    search_fields = ["name", "code", "weight", "max_price", "min_price", "sum_price"]
    number_fields = {"weight", "max_price", "min_price", "sum_price"}

    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, null=True)
    code = models.CharField(_("Item Code"), max_length=50)  # Glass 20x20 is GL2020
    name = models.CharField(_("Item Name"), max_length=50, null=True)
    description = models.CharField(_("Item Description"), max_length=200)
    brand = models.ForeignKey(Brand, verbose_name=_("Brand"), null=True, on_delete=models.SET_NULL)
    unit = models.CharField(_("Item Unit"), max_length=50, null=True)
    weight = models.DecimalField(_("Weight KG"), max_digits=50, decimal_places=2, null=True)
    instock_number = models.IntegerField(_("Instock Number"), default=0)
    outstock_number = models.IntegerField(_("Outstock Number"), default=0)
    max_price = models.DecimalField(_("Max Price"), max_digits=50, decimal_places=2, null=True)
    sum_price = models.DecimalField(_("Sum Price"), max_digits=50, decimal_places=2, default=0)
    min_price = models.DecimalField(_("Min Price"), max_digits=50, decimal_places=2, null=True)
    quantity = models.DecimalField(_("Quantity of Items Left Instock"), default=0, max_digits=50, decimal_places=2)
    group = models.ForeignKey(Group, verbose_name=_("Group"), null=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = _("Item")
        verbose_name_plural = _("Items")

    def get_average_price(self):
        return self.sum_price / self.number_instock


    def __str__(self):
        return str(self.name)


    def save(self, *args, **kwargs):
        if self.name is None:
            self.name = self.code
        
        
        super().save(*args, **kwargs)

class Stock(Searchable):
    stock_date = models.DateField(_("Date"), null=True)
    created_date = models.DateTimeField(_("Date Created"), auto_now=False, auto_now_add=True, null=True)
    modified = models.DateTimeField(_("Date Modified"), auto_now=True, auto_now_add=False, null=True)
    job_id = models.CharField(_("Job ID"), max_length=50, null=True)  # YYXXXX, STOCK = 0000000, No Job -0000001
    item = models.ForeignKey(Item, verbose_name=_("Item Stocked"), null=True, on_delete=models.SET_NULL)
    quantity = models.DecimalField(_("Quantity of Item Stocked"), max_digits=50, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        abstract=True

    def __str__(self):
        return str(self.item.name) + " " + str(self.quantity)



class StockManager(models.Manager):
    def set_model_attributes(self, stock, attributes):
        for attribute, value in attributes.items():
            setattr(stock, attribute, value)
        
        # Validate data without saving
        stock.full_clean()   
        
    
    def update_quantity(self, item, quantity):
        item.quantity += Decimal(quantity)
    
    
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


class InstockManager(StockManager):
    
    def update_instock_number(self, item):
        item.instock_number += 1
    
    def update_sum_price(self, current_price):
        if(self.current_item.sum_price is None):
            self.current_item.sum_price = Decimal(0)
            
        self.current_item.sum_price += current_price
        
    def update_min_price(self, unit_price):
        if self.current_item.min_price is None or unit_price < self.current_item.min_price:
            self.current_item.min_price = unit_price
            

    def update_max_price(self, unit_price):
        if self.current_item.max_price is None or unit_price > self.current_item.max_price:
            self.current_item.max_price = unit_price
            
    
    def calculate_total_item_price(self, unit_price, quantity):
        return round(unit_price * Decimal(quantity), 2)
    
    @transaction.atomic
    def create_instock(self, **kwargs):
        Instock.objects.create(**kwargs)
        
        unit_price = kwargs.pop("price")
        quantity = kwargs.pop("quantity")
        self.current_item = kwargs.pop("item")
        current_price = self.calculate_total_item_price(unit_price, quantity)
        
        self.update_instock_number(self.current_item)
        self.update_quantity(self.current_item, quantity)
        self.update_sum_price(current_price)
        self.update_min_price(unit_price)
        self.update_max_price(unit_price)
        
        self.current_item.save()
        

class Instock(Stock):
    search_fields = ["job_id", "invoice_id", "purchase_order_id", "supplier", "quantity", "price"]
    number_fields = {"quantity", "price"}

    invoice_id = models.CharField(_("Invoice ID"), max_length=50, null=True)
    price = models.DecimalField(_("Price"), max_digits=50, decimal_places=2, null=True, validators=[MinValueValidator(0)])
    purchase_order_id = models.CharField(_("PO ID"), max_length=50, null=True)
    supplier = models.CharField(_("Supplier"), max_length=50, null=True)
    objects = InstockManager()
    
    class Meta:
        verbose_name = _("Instock")
        verbose_name_plural = _("Instocks")

    def __str__(self):
        return f"{self.invoice_id} - {self.job_id} - {self.item.name}"
    

class OutstockManager(StockManager):
    def update_outstock_number(self, item, increment=1):
        item.outstock_number += increment

    def validate_quantity(self, quantity):
        if self.current_item.quantity < quantity or quantity <= 0:
            raise ValidationError({"quantity":[_("Not enough items instock. Only %(quanitity)s items remain") % {'quanitity': quantity}]})
    
    @transaction.atomic
    def create_outstock(self, **kwargs):
        Outstock.objects.create(**kwargs)
        
        self.current_item = kwargs.pop("item")
        quantity = kwargs.pop("quantity")
        
        
        self.validate_quantity(quantity)
        self.update_outstock_number(self.current_item)
        self.update_quantity(self.current_item, -1 * quantity)
        
        self.current_item.save()
        
        
    @transaction.atomic 
    def update_outstock(self, **kwargs):
        defaults = kwargs.pop("defaults", None)
        outstock = Outstock.objects.get(**kwargs)
        
        self.set_model_attributes(outstock, defaults)
        
        self.current_item = defaults.pop("item", outstock.item)
            
        quantity = kwargs.pop("quantity", outstock.quantity)
        old_item = outstock.item
        old_quantity = outstock.quantity

        # Reset item
        self.update_quantity(old_item, old_quantity)
        self.update_outstock_number(self.current_item)
        old_item.save()
        
        # Validate we have room to store new quantity if different
        self.validate_quantity(quantity)
        self.update_quantity(self.current_item, -1 * quantity)
        self.current_item.save()
        
        outstock.save()
        

class Outstock(Stock):
    search_fields = ["job_id", "stock_id", "requester", "department", "customer", "quantity"]
    number_fields = {"quantity"}
    
    customer = models.CharField(_("Customer"), max_length=200, null=True)
    stock_id = models.CharField(_("Stock ID"), max_length=200, null=True)
    requester = models.CharField(_("Requester"), max_length=200)
    department = models.CharField(_("Department"), max_length=200, null=True)
    objects = OutstockManager()
    
    class Meta:
        verbose_name = _("Outstock")
        verbose_name_plural = _("Outstocks")

    def __str__(self):
        return f"{self.stock_id} - {self.job_id} - {self.item.name}"

if settings.AUDITLOG_ON:
    auditlog.register(Group, exclude_fields=("modified",))
    auditlog.register(Brand, exclude_fields=("modified",))
    auditlog.register(Item, exclude_fields=(
        "modified", "instock_number", "outstock_number",
        "max_price", "sum_price", "min_price",
    ))
    auditlog.register(Instock, exclude_fields=("created_date", "modified",))
    auditlog.register(Outstock, exclude_fields=("created_date", "modified",))