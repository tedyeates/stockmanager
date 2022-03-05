from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils.translation import gettext_lazy as _


class Group(models.Model):
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, blank=True, null=True)
    name = models.CharField(_("Group Name"), max_length=50)
    description = models.CharField(_("Group Description"), blank=True, max_length=200)

    class Meta:
        verbose_name = _("Group")
        verbose_name_plural = _("Groups")

    def __str__(self):
        return str(self.name)

    # def get_absolute_url(self):
    #     return reverse("Group_detail", kwargs={"pk": self.pk})


class Item(models.Model):
    BAR = 'BAR'
    SHEET = 'SHEET'
    OTHER = 'OTHER'
    ITEM_TYPES = [
        (BAR, 'Bar'),
        (SHEET, 'Sheet'),
        (OTHER, 'Other'),
    ]

    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, blank=True, null=True)
    code = models.CharField(_("Item Code"), max_length=50, blank=True)  # Glass 20x20 is GL2020
    name = models.CharField(_("Item Name"), max_length=50, null=True)
    description = models.CharField(_("Item Description"), blank=True, max_length=200)
    item_type = models.CharField(_("Type of material"), choices=ITEM_TYPES, max_length=50, default=OTHER)
    brand = models.CharField(_("Item Brand"), max_length=50, null=True)
    unit = models.CharField(_("Item Unit"), max_length=50, null=True)
    weight = models.DecimalField(_("Weight KG"), max_digits=50, decimal_places=2, null=True)
    number_instock = models.IntegerField(_("Number Instock"), default=0)
    number_outstock = models.IntegerField(_("Number Outstock"), default=0)
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
        return str(self.code) + " " + str(self.name)


    def save(self, *args, **kwargs):
        if self.name is None:
            self.name = self.code

        super().save(*args, **kwargs)


class Stock(models.Model):
    stock_date = models.DateField(_("Date"), null=True)
    created_date = models.DateTimeField(_("Date Created"), auto_now=False, auto_now_add=True, blank=True, null=True)
    modified = models.DateTimeField(_("Date Modified"), auto_now=True, auto_now_add=False, blank=True, null=True)
    job_id = models.CharField(_("Job ID"), max_length=50, null=True)  # YYXXXX, STOCK = 0000000, No Job -0000001
    item = models.ForeignKey(Item, verbose_name=_("Item Stocked"), null=True, on_delete=models.SET_NULL)
    quantity = models.DecimalField(_("Quantity of Item Stocked"), max_digits=50, decimal_places=2)
    size = ArrayField(
        models.DecimalField(_("Size"), max_digits=50, decimal_places=2, null=True),
        size=2, null=True
    )


    class Meta:
        verbose_name = _("Stock")
        verbose_name_plural = _("Stocks")

    def __str__(self):
        return str(self.item.name) + " " + str(self.quantity)


class Instock(Stock):

    invoice_id = models.CharField(_("Invoice ID"), max_length=50, null=True)
    price = models.DecimalField(_("Price per Item"), max_digits=50, decimal_places=2, null=True)
    purchase_order_id = models.CharField(_("PO ID"), max_length=50, null=True)
    supplier = models.CharField(_("Supplier"), max_length=50, null=True)

    class Meta:
        verbose_name = _("Instock")
        verbose_name_plural = _("Instocks")

    def __str__(self):
        return self.invoice_id


class Outstock(Stock):

    customer = models.CharField(_("Customer"), max_length=50, null=True)
    stock_id = models.CharField(_("Stock ID"), max_length=50, null=True)
    requester = models.CharField(_("Requester"), max_length=50, null=True)
    department = models.CharField(_("Department"), max_length=50, null=True)

    class Meta:
        verbose_name = _("Outstock")
        verbose_name_plural = _("Outstocks")

    def __str__(self):
        return self.invoice_id


