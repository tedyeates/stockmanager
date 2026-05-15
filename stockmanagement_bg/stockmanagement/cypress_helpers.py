"""
Cypress E2E test helper endpoints.

Provides DELETE (wipe) and POST (seed) endpoints for Cypress tests.
Only available when DEBUG=True.
"""
from decimal import Decimal

from django.conf import settings
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from stockmanagement.models import (
    Group,
    Brand,
    Item,
    Instock,
    Outstock,
    Customer,
)


class CypressTestView(APIView):
    """
    Base Cypress test helper.
    DELETE: Wipes all test data.
    POST: Seeds default test data for item/group pages.
    """
    permission_classes = [IsAuthenticated]

    def dispatch(self, request, *args, **kwargs):
        if not settings.DEBUG:
            return JsonResponse(
                {"error": "Cypress helpers only available in DEBUG mode"},
                status=403,
            )
        return super().dispatch(request, *args, **kwargs)

    def delete(self, request):
        """Wipe all data from test-relevant tables."""
        Outstock.objects.all().delete()
        Instock.objects.all().delete()
        Item.objects.all().delete()
        Group.objects.all().delete()
        Brand.objects.all().delete()
        return JsonResponse({"status": "wiped"})

    def post(self, request):
        """Seed default test data for item/group Cypress tests."""
        # Create groups
        group_metal = Group.objects.create(name="Metal", description="Metal materials")
        group_glass = Group.objects.create(name="Glass", description="Glass materials")
        group_wood = Group.objects.create(name="Wood", description="Wood materials")

        # Create brands
        brand_a = Brand.objects.create(name="BrandA")
        brand_b = Brand.objects.create(name="BrandB")

        # Create items
        Item.objects.create(
            code="MTL001",
            name="test item steel plate",
            description="Steel plate 2mm",
            brand=brand_a,
            unit="sheet",
            group=group_metal,
            quantity=Decimal("100"),
            max_price=Decimal("25.00"),
            min_price=Decimal("20.00"),
            sum_price=Decimal("2250.00"),
            instock_number=5,
            notes="Standard steel plate",
        )
        Item.objects.create(
            code="GLS001",
            name="test item glass panel",
            description="Clear glass 6mm",
            brand=brand_b,
            unit="panel",
            group=group_glass,
            quantity=Decimal("50"),
            max_price=Decimal("45.00"),
            min_price=Decimal("40.00"),
            sum_price=Decimal("4250.00"),
            instock_number=3,
            notes="Tempered glass",
        )
        Item.objects.create(
            code="WD001",
            name="oak plank",
            description="Oak wood plank 20x100",
            brand=brand_a,
            unit="plank",
            group=group_wood,
            quantity=Decimal("200"),
            max_price=Decimal("15.00"),
            min_price=Decimal("12.00"),
            sum_price=Decimal("1350.00"),
            instock_number=10,
            notes="Premium oak",
        )

        # Create instock records so the default instock table is not empty
        item_steel = Item.objects.get(code="MTL001")
        item_glass = Item.objects.get(code="GLS001")
        item_oak = Item.objects.get(code="WD001")

        Instock.objects.create(
            item=item_steel,
            quantity=Decimal("20"),
            price=Decimal("22.00"),
            invoice_id="INV-001",
            purchase_order_id="PO-001",
            supplier="Steel Supplier",
            store_type="metal",
            notes="Initial steel stock",
        )
        Instock.objects.create(
            item=item_glass,
            quantity=Decimal("10"),
            price=Decimal("42.00"),
            invoice_id="INV-002",
            purchase_order_id="PO-002",
            supplier="Glass Supplier",
            store_type="glass",
            notes="Initial glass stock",
        )
        Instock.objects.create(
            item=item_oak,
            quantity=Decimal("30"),
            price=Decimal("13.00"),
            invoice_id="INV-003",
            purchase_order_id="PO-003",
            supplier="Wood Supplier",
            store_type="wood",
            notes="Initial wood stock",
        )

        # Create outstock records so the outstock table is not empty
        Outstock.objects.create(
            item=item_steel,
            quantity=Decimal("5"),
            remaining_quantity=Decimal("95"),
            stock_id="OUT-001",
            requester="Requester A",
            department="Dept 1",
            store_type="metal",
            notes="Steel outstock",
        )
        Outstock.objects.create(
            item=item_glass,
            quantity=Decimal("3"),
            remaining_quantity=Decimal("47"),
            stock_id="OUT-002",
            requester="Requester B",
            department="Dept 2",
            store_type="glass",
            notes="Glass outstock",
        )
        Outstock.objects.create(
            item=item_oak,
            quantity=Decimal("10"),
            remaining_quantity=Decimal("190"),
            stock_id="OUT-003",
            requester="Requester C",
            department="Dept 3",
            store_type="wood",
            notes="Wood outstock",
        )

        return JsonResponse({"status": "seeded", "items": 3, "groups": 3, "instocks": 3, "outstocks": 3})


class CypressInstockTestView(APIView):
    """
    Cypress test helper for instock-heavy test scenarios.
    POST: Seeds data with multiple instock/outstock records.
    """
    permission_classes = [IsAuthenticated]

    def dispatch(self, request, *args, **kwargs):
        if not settings.DEBUG:
            return JsonResponse(
                {"error": "Cypress helpers only available in DEBUG mode"},
                status=403,
            )
        return super().dispatch(request, *args, **kwargs)

    def post(self, request):
        """Seed instock/outstock test data."""
        # Create base data
        group = Group.objects.create(name="GLN Group", description="General materials")
        brand = Brand.objects.create(name="TestBrand")

        item = Item.objects.create(
            code="GLN001",
            name="GLN test material",
            description="General test material for instock tests",
            brand=brand,
            unit="piece",
            group=group,
            quantity=Decimal("500"),
            max_price=Decimal("30.00"),
            min_price=Decimal("10.00"),
            sum_price=Decimal("5000.00"),
            instock_number=20,
            notes="Cypress instock test item",
        )

        # Create multiple instock records
        for i in range(25):
            Instock.objects.create(
                item=item,
                quantity=Decimal("10"),
                price=Decimal(f"{10 + i}.00"),
                invoice_id=f"INV-{i:03d}",
                purchase_order_id=f"PO-{i:03d}",
                supplier=f"Supplier {i % 5}",
                store_type="metal",
                notes=f"GLN instock batch {i}",
            )

        # Create some outstock records
        for i in range(5):
            Outstock.objects.create(
                item=item,
                quantity=Decimal("5"),
                remaining_quantity=Decimal(str(500 - (i + 1) * 5)),
                stock_id=f"OUT-{i:03d}",
                requester=f"Requester {i}",
                department=f"Dept {i % 3}",
                store_type="metal",
                notes=f"GLN outstock batch {i}",
            )

        return JsonResponse({
            "status": "seeded",
            "items": 1,
            "instocks": 25,
            "outstocks": 5,
        })
