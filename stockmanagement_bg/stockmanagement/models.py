from decimal import Decimal
from django.conf import settings
from django.db import models, transaction
from django.db.models import Max, Min
from django.db.models.functions import Length
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.utils import timezone

from django.db.models.signals import post_save, post_delete
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
    
SEARCH_RESULTS = 20
class Group(models.Model):
    search_fields = ["name"]
    
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, null=True)
    name = models.CharField(_("Group Name"), max_length=50)
    description = models.CharField(_("Group Description"), max_length=200)

    class Meta:
        verbose_name = _("Group")
        verbose_name_plural = _("Groups")

    def __str__(self):
        return str(self.name)


class Brand(models.Model):
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, null=True)
    name = models.CharField(_("Brand Name"), max_length=50)
    
    class Meta:
        verbose_name = _("Brand")
        verbose_name_plural = _("Brands")


class Item(models.Model):
    search_fields = ["code", "max_price", "min_price", "sum_price"]
    number_fields = {"weight", "max_price", "min_price", "sum_price"}

    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, null=True)
    code = models.CharField(_("Item SKU"), max_length=50, unique=True)  # Glass 20x20 is GL2020
    description = models.CharField(_("Item Description"), max_length=1000)
    brand = models.ForeignKey(Brand, verbose_name=_("Brand"), null=True, on_delete=models.SET_NULL)
    unit = models.CharField(_("Item Unit"), max_length=50, null=True)
    instock_number = models.IntegerField(_("Instock Number"), default=0)
    outstock_number = models.IntegerField(_("Outstock Number"), default=0)
    max_price = models.DecimalField(_("Max Price"), max_digits=50, decimal_places=2, null=True) # Get max from instock unit price
    sum_price = models.DecimalField(_("Sum Price"), max_digits=50, decimal_places=2, default=0) # Divide by instock number for average instock
    min_price = models.DecimalField(_("Min Price"), max_digits=50, decimal_places=2, null=True)
    quantity = models.DecimalField(_("Quantity of Items Left Instock"), default=0, max_digits=50, decimal_places=2)
    group = models.ForeignKey(Group, verbose_name=_("Group"), null=True, on_delete=models.SET_NULL)
    notes = models.CharField(_("Notes"), max_length=1000, null=True, blank=True)
    
    min_quanity = models.DecimalField(_("Minimum Quantity"), null=True, max_digits=50, decimal_places=2) # Alert when quantity below
    max_quanity = models.DecimalField(_("Maximum Quantity"), null=True, max_digits=50, decimal_places=2) # Alert when quantity greater
    
        
    class Meta:
        verbose_name = _("Item")
        verbose_name_plural = _("Items")

    def get_average_price(self):
        return self.sum_price / self.number_instock


    def __str__(self):
        return str(self.code)


    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        

class StoreType(models.TextChoices):
    METAL = "metal", "Metal"
    ACCESSORY = "accessory", "Accessory"
    MACHINE = "machine", "Machine"
    SERVICE = "service", "Service"
    
        
class Stock(models.Model):
    stock_date = models.DateField(_("Date"), default=timezone.now, null=True)
    created_date = models.DateTimeField(_("Date Created"), auto_now=False, auto_now_add=True, null=True)
    modified = models.DateTimeField(_("Date Modified"), auto_now=True, auto_now_add=False, null=True)

    item = models.ForeignKey(Item, verbose_name=_("Item Stocked"), null=True, on_delete=models.SET_NULL)
    quantity = models.DecimalField(_("Quantity of Item Stocked"), max_digits=50, decimal_places=2, validators=[MinValueValidator(0)])
    notes = models.CharField(_("Notes"), max_length=1000, null=True, blank=True)
    store_type = models.CharField(_("Store Type"), max_length=20, choices=StoreType.choices, default=StoreType.METAL)
    
    
    class Meta:
        abstract = True
        

class StockManager(models.Manager):
    def set_model_attributes(self, stock, attributes):
        for attribute, value in attributes.items():
            setattr(stock, attribute, value)
        
        # Validate data without saving
        stock.full_clean()   
        
    
    def update_quantity(self, item, quantity):
        item.quantity += Decimal(quantity)
        
        return item.quantity
    
    
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
        item_data = request.data.get("item")
        incoming_item_id = item_data["id"] if isinstance(item_data, dict) else item_data
        are_items_equal = instock.item.id == incoming_item_id
        
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

    invoice_id = models.CharField(_("Invoice ID"), max_length=50, null=False, default="UNDEFINED")
    job = models.ManyToManyField('Job', verbose_name=_("Job"))
    price = models.DecimalField(_("Price"), max_digits=50, decimal_places=2, null=True, validators=[MinValueValidator(0)])
    purchase_order_id = models.CharField(_("PO ID"), max_length=50, null=True)
    supplier = models.CharField(_("Supplier"), max_length=50, null=True)
    objects = InstockManager()
    
    class Meta:
        verbose_name = _("Instock")
        verbose_name_plural = _("Instocks")

    def __str__(self):
        return f"{self.invoice_id} - {self.job_id} - {self.item.code}"
    

class OutstockManager(StockManager):
    def update_outstock_number(self, item, increment=1):
        item.outstock_number += increment

    def validate_quantity(self, quantity):
        if quantity <= 0:
            raise ValidationError({"quantity":[_("Quantity must be greater than 0")]})
        if self.current_item.quantity < quantity:
            raise ValidationError({"quantity":[_("Not enough items instock. Only %(quanitity)s items remain") % {'quanitity': self.current_item.quantity}]})
    
    @transaction.atomic
    def create_outstock(self, **kwargs):
        self.current_item = kwargs.get("item")
        quantity = Decimal(kwargs.get("quantity"))
        
        jobs = kwargs.pop("job", [])
        
        self.validate_quantity(quantity)
        self.update_outstock_number(self.current_item)
        
        remaining_quantity = self.update_quantity(self.current_item, -1 * quantity)
        kwargs["remaining_quantity"] = remaining_quantity
        
        outstock = Outstock.objects.create(**kwargs)
        if jobs:
            outstock.job.set(jobs)
        
        self.current_item.save()
        return outstock
        
        
    @transaction.atomic 
    def update_outstock(self, **kwargs):
        defaults = kwargs.pop("defaults", None)
        outstock = Outstock.objects.get(**kwargs)
        
        old_quantity = outstock.quantity
        old_item = outstock.item
        
        jobs = defaults.pop("job", None)
        
        self.set_model_attributes(outstock, defaults)
        
        self.current_item = defaults.pop("item", outstock.item)
        quantity = Decimal(kwargs.pop("quantity", outstock.quantity))

        # Reset item
        self.update_quantity(old_item, old_quantity)
        self.update_outstock_number(old_item, -1)
        old_item.save()
        
        if self.current_item.pk == old_item.pk:
            self.current_item.quantity = old_item.quantity
        
        # Validate we have room to store new quantity if different
        self.validate_quantity(quantity)
        self.update_outstock_number(self.current_item)
        remaining_quantity = self.update_quantity(self.current_item, -1 * quantity)
        outstock.remaining_quantity = remaining_quantity
        
        self.current_item.save()
        outstock.save()
        if jobs is not None:
            outstock.job.set(jobs)
        return outstock
        
        
class Customer(models.Model):
    search_fields = ["name"]
    
    name = models.CharField(_("Customer Name"), max_length=50)
    
    class Meta:
        db_table = "customer"
        managed = False
        verbose_name = _("Customer")
        verbose_name_plural = _("Customers")

    def __str__(self):
        return str(self.name)


class Job(models.Model):
    search_fields = ["job_id"]

    job_id = models.CharField(_("Job ID"), max_length=50, primary_key=True)
    customer = models.ForeignKey(Customer, verbose_name=_("Customer"), null=True, on_delete=models.SET_NULL)

    class Meta:
        db_table = "job"
        managed = False
        verbose_name = _("Job")
        verbose_name_plural = _("Jobs")

    def __str__(self):
        return str(self.job_id)

class Outstock(Stock):
    search_fields = ["stock_id", "requester", "department", "quantity"]
    number_fields = {"quantity"}
    
    stock_id = models.CharField(_("Stock ID"), max_length=200, null=True)
    requester = models.CharField(_("Requester"), max_length=200)
    department = models.CharField(_("Department"), max_length=200, null=True)
    remaining_quantity = models.DecimalField(_("Quantity of Item Stocked"), max_digits=50, decimal_places=2, validators=[MinValueValidator(0)], null=True)
    objects = OutstockManager()
    
    job = models.ManyToManyField('Job', verbose_name=_("Job"))
    customer = models.ForeignKey(Customer, verbose_name=_("Customer"), null=True, blank=True, on_delete=models.SET_NULL)
    

    class Meta:
        verbose_name = _("Outstock")
        verbose_name_plural = _("Outstocks")

    def __str__(self):
        return f"{self.stock_id} - {self.item.code}"
