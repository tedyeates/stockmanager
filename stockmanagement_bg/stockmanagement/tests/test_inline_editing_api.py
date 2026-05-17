"""
Property-based tests for inline editing API — outstock quantity validation.

Feature: inline-editing
"""
from decimal import Decimal

from django.contrib.auth.models import User
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from stockmanagement.models import Group, Item, Brand, Outstock
from stockmanagement.views import OutstockViewSet


class TestOutstockQuantityValidation(TestCase):
    """
    Feature: inline-editing, Property: Outstock quantity exceeding item quantity returns 400

    For any outstock quantity greater than the item's available quantity,
    the create endpoint SHALL return 400 with 'quantity' in the error response.

    Validates: Requirement 7.4
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user, _ = User.objects.get_or_create(
            username='testuser_outstock',
            defaults={'password': 'testpass123'},
        )
        self.group, _ = Group.objects.get_or_create(
            name="TestGroup", defaults={"description": "Test"}
        )
        self.brand, _ = Brand.objects.get_or_create(name="TestBrand")
        self.item, _ = Item.objects.get_or_create(
            code="OUT-TEST-001",
            defaults={
                "description": "Test item for outstock",
                "unit": "pcs",
                "group": self.group,
                "brand": self.brand,
                "quantity": Decimal("10.00"),
            },
        )
        # Reset item quantity for each test
        Item.objects.filter(pk=self.item.pk).update(quantity=Decimal("10.00"))
        self.item.refresh_from_db()

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(
        excess=st.decimals(min_value=Decimal("0.01"), max_value=Decimal("1000.00"), places=2),
    )
    def test_outstock_quantity_exceeding_item_returns_400(self, excess):
        """
        Property: Outstock save never succeeds when quantity > item.quantity

        Generate random quantities above the item's available stock.
        Assert API returns 400 and 'quantity' field in error response.

        Validates: Requirement 7.4
        """
        self.item.refresh_from_db()
        over_quantity = self.item.quantity + excess

        data = {
            "item": self.item.pk,
            "quantity": str(over_quantity),
            "stock_id": "TEST-OUT-001",
            "requester": "TestUser",
            "department": "TestDept",
            "stock_date": "2026-01-15",
            "store_type": "metal",
        }

        request = self.factory.post('/api/outstock/', data, format='json')
        force_authenticate(request, user=self.user)

        view = OutstockViewSet.as_view({'post': 'create'})
        response = view(request)

        self.assertEqual(
            response.status_code, 400,
            f"Expected 400 for quantity={over_quantity} exceeding item quantity="
            f"{self.item.quantity}, got {response.status_code}"
        )

        response_data = response.data if hasattr(response, 'data') else {}
        self.assertIn(
            'quantity', response_data,
            f"Expected 'quantity' in error response, got keys: {list(response_data.keys())}"
        )

    def test_outstock_quantity_within_limit_succeeds(self):
        """
        Sanity check: outstock with valid quantity returns 201.
        """
        data = {
            "item": self.item.pk,
            "quantity": "5.00",
            "stock_id": "TEST-OUT-OK",
            "requester": "TestUser",
            "department": "TestDept",
            "stock_date": "2026-01-15",
            "store_type": "metal",
        }

        request = self.factory.post('/api/outstock/', data, format='json')
        force_authenticate(request, user=self.user)

        view = OutstockViewSet.as_view({'post': 'create'})
        response = view(request)

        self.assertEqual(
            response.status_code, 201,
            f"Expected 201 for valid quantity, got {response.status_code}. "
            f"Response: {getattr(response, 'data', response.content)}"
        )

    def test_outstock_zero_quantity_returns_400(self):
        """
        Edge case: quantity of 0 should also be rejected.
        """
        data = {
            "item": self.item.pk,
            "quantity": "0",
            "stock_id": "TEST-OUT-ZERO",
            "requester": "TestUser",
            "department": "TestDept",
            "stock_date": "2026-01-15",
            "store_type": "metal",
        }

        request = self.factory.post('/api/outstock/', data, format='json')
        force_authenticate(request, user=self.user)

        view = OutstockViewSet.as_view({'post': 'create'})
        response = view(request)

        self.assertEqual(
            response.status_code, 400,
            f"Expected 400 for zero quantity, got {response.status_code}"
        )
