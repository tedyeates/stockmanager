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
    group = models.ForeignKey(Group, verbose_name=_("Group"), null=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = _("Item")
        verbose_name_plural = _("Items")

    def __str__(self):
        return str(self.code) + " " + str(self.name)


    def save(self, *args, **kwargs):
        if self.name is None:
            self.name = self.code

        super().save(*args, **kwargs)


class Stock(models.Model):

    date = models.DateTimeField(_("Date"), auto_now=False, auto_now_add=True, blank=True, null=True)
    modified = models.DateTimeField(_("Date"), auto_now=True, auto_now_add=False, blank=True, null=True)
    invoice_number = models.CharField(_("Invoice Number"), max_length=50)
    purchase_order_number = models.CharField(_("PO Number"), max_length=50, null=True)
    pc_job = models.CharField(_("PC Job"), max_length=50, null=True)  # YYXXXX, STOCK = 0000000, No Job -0000001
    supplier = models.CharField(_("Supplier"), max_length=50, null=True)
    item = models.ForeignKey(Item, verbose_name=_("Item Stocked"), on_delete=models.CASCADE)
    quantity = models.IntegerField(_("Quantity of Item Stocked"))
    price = models.DecimalField(_("Price per Item"), max_digits=50, decimal_places=2, null=True)
    is_instock = models.BooleanField(_("Item is Instock"), default=True)  # False is Outstock
    size = ArrayField(
        models.DecimalField(_("Size"), max_digits=50, decimal_places=2, null=True),
        size=2, null=True
    )


    class Meta:
        verbose_name = _("Stock")
        verbose_name_plural = _("Stocks")

    def __str__(self):
        return str(self.item.name) + " " + str(self.quantity)

