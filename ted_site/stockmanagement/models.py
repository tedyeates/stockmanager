from django.db import models
from django.utils.translation import ugettext_lazy as _


class Group(models.Model):

    name = models.CharField(_("Group Name"), max_length=50)
    description = models.CharField(_("Group Description?"), max_length=200)

    class Meta:
        verbose_name = _("Group")
        verbose_name_plural = _("Groups")

    # def __str__(self):
    #     return self.name

    # def get_absolute_url(self):
    #     return reverse("Group_detail", kwargs={"pk": self.pk})


class Item(models.Model):
    code = models.CharField(_("Item Code"), max_length=50)  # Glass 20x20 is GL2020
    name = models.CharField(_("Item Name"), max_length=50, null=True)
    description = models.CharField(_("Item Description"), max_length=200)
    size = models.CharField(_("Item Size"), max_length=50)  # 20x20
    brand = models.CharField(_("Item Brand"), max_length=50, null=True)
    unit = models.CharField(_("Item Unit?"), max_length=50, null=True)
    group = models.ForeignKey(Group, verbose_name=_("Group Belonged To"), null=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = _("Item")
        verbose_name_plural = _("Items")

    # def __str__(self):
    #     return self.name

    # def get_absolute_url(self):
    #     return reverse("Item_detail", kwargs={"pk": self.pk})


class Stock(models.Model):

    date = models.DateField(_("Date"), auto_now=True, auto_now_add=False)
    invoice_id = models.CharField(_("Invoice Number"), max_length=50)
    purchase_order_number = models.CharField(_("PO Number"), max_length=50, null=True)
    pc_job = models.CharField(_("PC Job"), max_length=50, null=True)  # YYXXXX, STOCK = 0000000, No Job -0000001
    supplier = models.CharField(_("Supplier"), max_length=50, null=True)
    item = models.ForeignKey(Item, verbose_name=_("Item Stocked"), on_delete=models.CASCADE)
    quantity = models.IntegerField(_("Quantity of Item Stocked"))
    price = models.DecimalField(_("Price per Item"), max_digits=50, decimal_places=2, null=True)
    is_instock = models.BooleanField(_("Item is Instock"))  # False is Outstock
    is_metalstock = models.BooleanField(_("Item is Metal"))  # False is Normal Item


    class Meta:
        verbose_name = _("Stock")
        verbose_name_plural = _("Stocks")

    # def __str__(self):
    #     return self.name

    # def get_absolute_url(self):
    #     return reverse("Stock_detail", kwargs={"pk": self.pk})
