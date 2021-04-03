from openpyxl import load_workbook
from os.path import dirname
from stockmanagement.models import Group, Item, Stock
from django.core.exceptions import ObjectDoesNotExist

import re

DATA_LOC = dirname(dirname(__file__)) + "/static/stockmanagement/data/"


def load_stock_data():
    load_excel("1-INSTOCK.xlsx", is_instock=True,
                itemsheet="TABLEITEM", stocksheet="INSTOCK")


def load_excel(file_name, **kwargs):
    workbook = load_workbook(DATA_LOC + file_name)
    item_sheet = workbook[kwargs.pop("itemsheet")]
    stock_sheet = workbook[kwargs.pop("stocksheet")]
    load_groups(item_sheet)
    load_items(item_sheet)
    load_stock(stock_sheet, kwargs.pop("is_instock"))

def load_groups(item_sheet):
    GROUP_NAME_COL = "L"
    GROUP_DESC_COL = "M"

    row_num = 3
    while True:
        group_name = item_sheet[GROUP_NAME_COL + str(row_num)].value
        if group_name == None:
            break

        group_desc = item_sheet[GROUP_DESC_COL + str(row_num)].value

        Group.objects.get_or_create(name=group_name, defaults={"description": group_desc})
        row_num += 1


def load_items(item_sheet):
    ITEM_CODE_COL = "B"
    ITEM_DESC_COL = "D"
    ITEM_BRAND_COL = "E"
    ITEM_UNIT_COL = "F"
    ITEM_GROUP_COL = "C"

    row_num = 3
    while True:
        item_code = item_sheet[ITEM_CODE_COL + str(row_num)].value
        if item_code == None:
            break

        item_desc = item_sheet[ITEM_DESC_COL + str(row_num)].value
        item_brand = item_sheet[ITEM_BRAND_COL + str(row_num)].value
        item_unit = item_sheet[ITEM_UNIT_COL + str(row_num)].value
        item_group = item_sheet[ITEM_GROUP_COL + str(row_num)].value

        if item_group:
            item_group.strip()
            try:
                group = Group.objects.get(name=item_group)
            except ObjectDoesNotExist:
                # print("[WARN] Group " + str(item_group) + " for Item " + item_code + " does not exist, excluding group")
                group = None

        else:
            group = None
        Item.objects.get_or_create(code=item_code, defaults={"description": item_desc,
                                                            "brand": item_brand,
                                                            "unit": item_unit,
                                                            "group": group})
        row_num += 1


def load_stock(stock_sheet, is_instock):
    DATE_COL = "C"
    IV_COL = "D"
    PO_COL = "E"
    PC_COL = "F"
    SUPPLIER_COL = "G"
    ITEM_COL = "H"
    QUANTITY_COL = "I"
    PRICE_COL = "K"

    row_num = 3
    while True:
        stock_iv = stock_sheet[IV_COL + str(row_num)].value
        if stock_iv == None:
            break
        
        stock_date = stock_sheet[DATE_COL + str(row_num)].value
        stock_po =  stock_sheet[PO_COL + str(row_num)].value
        stock_pc = stock_sheet[PC_COL + str(row_num)].value
        stock_supplier = stock_sheet[SUPPLIER_COL + str(row_num)].value
        stock_item = stock_sheet[ITEM_COL + str(row_num)].value
        stock_quantity = stock_sheet[QUANTITY_COL + str(row_num)].value
        stock_price = stock_sheet[PRICE_COL + str(row_num)].value

        if stock_quantity == None:
            print("[CRIT] No Quantity")
            break

        try:
            item = Item.objects.get(code=stock_item)  # TODO: cache it


            if isinstance(stock_price, str):
                stock_price.replace(" ", "")

            if isinstance(stock_quantity, str):
                stock_quantity.replace(" ", "")

            Stock.objects.get_or_create(invoice_id=stock_iv, 
                                        defaults={"date": stock_date,
                                                  "purchase_order_number": stock_po,
                                                  "pc_job": stock_pc,
                                                  "supplier": stock_supplier,
                                                  "item": item,
                                                  "quantity": stock_quantity,
                                                  "price": stock_price,
                                                  "is_instock": is_instock})
        except ObjectDoesNotExist:
            pass
            # print("[CRIT] No Matching Item " + item.code + " Stock not added to database")

        row_num += 1
