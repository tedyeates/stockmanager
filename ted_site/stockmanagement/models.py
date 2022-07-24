from django.conf import settings
from django.db import models
from django.db.models.functions import Length
from django.utils.translation import gettext_lazy as _
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
        print(self.query)
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
            
            print(ContentType.objects.get_for_model(cls))
            SearchSuggestion.objects.get_or_create(
                model=model_name, name=name, value=value,
                content_type=ContentType.objects.get_for_model(instance).id,
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
                
            print(ContentType.objects.get_for_model(instance))
            print(instance)
            print(field)
            print(value)
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
        SearchSuggestion.objects.filter(instance=instance).delete()
        
    
    @classmethod
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        post_save.connect(cls.save_suggestion, cls)
        post_delete.connect(cls.delete_suggestion, cls)
    
    class Meta:
        abstract = True

    
    
class Group(Searchable):
    search_fields = ["name"]
    
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, blank=True, null=True)
    name = models.CharField(_("Group Name"), max_length=50)
    description = models.CharField(_("Group Description"), blank=True, max_length=200)

    class Meta:
        verbose_name = _("Group")
        verbose_name_plural = _("Groups")

    def __str__(self):
        return str(self.name)


class Brand(Searchable):
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, blank=True, null=True)
    name = models.CharField(_("Brand Name"), max_length=50)
    
    class Meta:
        verbose_name = _("Brand")
        verbose_name_plural = _("Brands")


class Item(Searchable):
    search_fields = ["name", "code", "item_type", "weight", "max_price", "min_price", "sum_price"]
    number_fields = {"weight", "max_price", "min_price", "sum_price"}
    
    BAR = 'BAR'
    SHEET = 'SHEET'
    OTHER = 'OTHER'
    ITEM_TYPES = [
        (BAR, 'bar'),
        (SHEET, 'sheet'),
        (OTHER, 'other'),
    ]

    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, blank=True, null=True)
    code = models.CharField(_("Item Code"), max_length=50, blank=True)  # Glass 20x20 is GL2020
    name = models.CharField(_("Item Name"), max_length=50, null=True)
    description = models.CharField(_("Item Description"), blank=True, max_length=200)
    item_type = models.CharField(_("Type of material"), choices=ITEM_TYPES, max_length=50, default=OTHER)
    brand = models.ForeignKey(Brand, verbose_name=_("Brand"), null=True, on_delete=models.SET_NULL)
    unit = models.CharField(_("Item Unit"), max_length=50, null=True)
    weight = models.DecimalField(_("Weight KG"), max_digits=50, decimal_places=2, null=True)
    instock_number = models.IntegerField(_("Instock Number"), default=0)
    outstock_number = models.IntegerField(_("Outstock Number"), default=0)
    max_price = models.DecimalField(_("Max Price"), max_digits=50, decimal_places=2, default=0)
    sum_price = models.DecimalField(_("Sum Price"), max_digits=50, decimal_places=2, default=0)
    min_price = models.DecimalField(_("Min Price"), max_digits=50, decimal_places=2, default=0)
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
    created_date = models.DateTimeField(_("Date Created"), auto_now=False, auto_now_add=True, blank=True, null=True)
    modified = models.DateTimeField(_("Date Modified"), auto_now=True, auto_now_add=False, blank=True, null=True)
    job_id = models.CharField(_("Job ID"), max_length=50, null=True)  # YYXXXX, STOCK = 0000000, No Job -0000001
    item = models.ForeignKey(Item, verbose_name=_("Item Stocked"), null=True, on_delete=models.SET_NULL)
    quantity = models.DecimalField(_("Quantity of Item Stocked"), max_digits=50, decimal_places=2)

    class Meta:
        abstract=True

    def __str__(self):
        return str(self.item.name) + " " + str(self.quantity)


class Instock(Stock):
    search_fields = ["job_id", "invoice_id", "purchase_order_id", "supplier", "quantity", "price"]
    number_fields = {"quantity", "price"}

    invoice_id = models.CharField(_("Invoice ID"), max_length=50, null=True)
    price = models.DecimalField(_("Price per Item"), max_digits=50, decimal_places=2, null=True)
    purchase_order_id = models.CharField(_("PO ID"), max_length=50, null=True)
    supplier = models.CharField(_("Supplier"), max_length=50, null=True)

    class Meta:
        verbose_name = _("Instock")
        verbose_name_plural = _("Instocks")

    def __str__(self):
        return f"{self.invoice_id} - {self.job_id} - {self.item.name}"


class Outstock(Stock):
    search_fields = ["job_id", "stock_id", "requester", "department", "customer", "quantity"]
    number_fields = {"quantity"}
    
    customer = models.CharField(_("Customer"), max_length=50, null=True)
    stock_id = models.CharField(_("Stock ID"), max_length=50, null=True)
    requester = models.CharField(_("Requester"), max_length=50)
    department = models.CharField(_("Department"), max_length=50, null=True)
    instock = models.ForeignKey("stockmanagement.Instock", verbose_name=_("Instock"), null=True, on_delete=models.SET_NULL)

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