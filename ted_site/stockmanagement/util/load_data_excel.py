from openpyxl import load_workbook
from os.path import dirname
from stockmanagement.models import Group, Item, Instock, Brand
from django.core.exceptions import ObjectDoesNotExist
from datetime import datetime

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
    load_stock(stock_sheet)

def load_groups(item_sheet):
    GROUP_NAME_COL = 11
    GROUP_DESC_COL = 12

    for row in item_sheet.iter_rows(max_row=20):
        group_name = row[GROUP_NAME_COL].value
        print(group_name)
        if group_name == None:
            continue

        group_desc = row[GROUP_DESC_COL].value

        Group.objects.get_or_create(name=group_name, defaults={"description": group_desc})


def load_items(item_sheet):
    ITEM_CODE_COL = 1
    ITEM_DESC_COL = 3
    ITEM_BRAND_COL = 4
    ITEM_UNIT_COL = 5
    ITEM_GROUP_COL = 2

    for row in item_sheet.iter_rows():
        item_code = row[ITEM_CODE_COL].value
        if item_code == None:
            break

        item_desc = row[ITEM_DESC_COL].value
        item_brand = row[ITEM_BRAND_COL].value
        item_unit = row[ITEM_UNIT_COL].value
        item_group = row[ITEM_GROUP_COL].value

        group = None
        if item_group:
            item_group = item_group.strip()
            try:
                group = Group.objects.get(name=item_group)
            except ObjectDoesNotExist:
                # print("[WARN] Group " + str(item_group) + " for Item " + item_code + " does not exist, excluding group")
                group = None
            
        brand = None
        if item_brand:
            item_brand = item_brand.strip()
            brand, _ = Brand.objects.get_or_create(name=item_brand)
                
        Item.objects.get_or_create(code=item_code, defaults={"description": item_desc,
                                                            "brand": brand,
                                                            "unit": item_unit,
                                                            "group": group})
        row_num += 1


def load_stock(stock_sheet):
    DATE_COL = 2
    IV_COL = 3
    PO_COL = 4
    PC_COL = 5
    SUPPLIER_COL = 6
    ITEM_COL = 7
    QUANTITY_COL = 8
    PRICE_COL = 9

    count = 0
    for row in stock_sheet.iter_rows(min_row=3):
        count+=1
        print(count)
        stock_iv = row[IV_COL].value
        print(stock_iv)
        if stock_iv is None or stock_iv == "":
            continue
        
        stock_date = row[DATE_COL].value
        stock_po =  row[PO_COL].value
        stock_pc = row[PC_COL].value
        stock_supplier = row[SUPPLIER_COL].value
        stock_item = row[ITEM_COL].value
        stock_quantity = row[QUANTITY_COL].value
        stock_price = row[PRICE_COL].value

        print(stock_date)
        print(type(stock_date))
        if stock_date is not None and isinstance(stock_date, str):
            stock_date = datetime.strptime(stock_date, '%d-%m-%y')
            
        if stock_quantity is None or stock_quantity == "":
            print("[CRIT] No Quantity")
            continue
        
        if (isinstance(stock_quantity, str) and not stock_quantity.isdecimal()) or (isinstance(stock_price, str) and not stock_price.isdecimal()):
            continue

        try:
            item = Item.objects.get(code=stock_item)  # TODO: cache it


            if isinstance(stock_price, str):
                stock_price.replace(" ", "")

            if isinstance(stock_quantity, str):
                stock_quantity.replace(" ", "")

            Instock.objects.get_or_create(invoice_id=stock_iv, purchase_order_id=stock_po, item=item,
                                        defaults={"stock_date": stock_date,
                                                  "purchase_order_id": stock_po,
                                                  "job_id": stock_pc,
                                                  "supplier": stock_supplier,
                                                  "quantity": stock_quantity,
                                                  "price": stock_price})
        except ObjectDoesNotExist:
            pass
            # print("[CRIT] No Matching Item " + item.code + " Stock not added to database")
