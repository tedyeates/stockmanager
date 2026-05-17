"""
Unit tests for search system ViewSet configuration.

Feature: search-system
Validates: Requirements 1.1, 1.4, 1.6, 1.8, 5.4
"""
import pytest
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.test import APIClient

from stockmanagement.views import (
    GroupViewSet,
    ItemViewSet,
    InstockViewSet,
    OutstockViewSet,
)


# --- Sub-task: Verify filter_backends contains SearchFilter and DjangoFilterBackend ---


class TestFilterBackendsConfiguration:
    """Verify filter_backends contains SearchFilter and DjangoFilterBackend on each ViewSet."""

    @pytest.mark.parametrize("viewset_class", [
        GroupViewSet,
        ItemViewSet,
        InstockViewSet,
        OutstockViewSet,
    ])
    def test_viewset_has_search_filter(self, viewset_class):
        assert SearchFilter in viewset_class.filter_backends

    @pytest.mark.parametrize("viewset_class", [
        GroupViewSet,
        ItemViewSet,
        InstockViewSet,
        OutstockViewSet,
    ])
    def test_viewset_has_django_filter_backend(self, viewset_class):
        assert DjangoFilterBackend in viewset_class.filter_backends


# --- Sub-task: Verify search_fields matches expected list per ViewSet ---


class TestSearchFieldsConfiguration:
    """Verify search_fields matches expected list per ViewSet."""

    def test_group_search_fields(self):
        assert GroupViewSet.search_fields == ['name', 'description']

    def test_item_search_fields(self):
        expected = ['code', 'description', 'unit', 'group__name', 'brand__name', 'notes']
        assert ItemViewSet.search_fields == expected

    def test_instock_search_fields(self):
        expected = ['invoice_id', 'purchase_order_id', 'supplier', 'item__code', 'store_type', 'notes']
        assert InstockViewSet.search_fields == expected

    def test_outstock_search_fields(self):
        expected = ['stock_id', 'requester', 'department', 'item__code', 'customer__name', 'store_type', 'notes']
        assert OutstockViewSet.search_fields == expected


# --- Sub-task: Verify filterset_fields matches expected dict per ViewSet ---


class TestFiltersetFieldsConfiguration:
    """Verify filterset_fields matches expected dict per ViewSet."""

    def test_group_has_no_filterset_fields(self):
        assert not hasattr(GroupViewSet, 'filterset_fields') or GroupViewSet.filterset_fields is None

    def test_item_filterset_fields(self):
        expected = {
            'quantity': ['exact', 'gte', 'lte'],
            'max_price': ['exact', 'gte', 'lte'],
            'min_price': ['exact', 'gte', 'lte'],
            'sum_price': ['exact', 'gte', 'lte'],
            'min_quanity': ['exact', 'gte', 'lte'],
            'max_quanity': ['exact', 'gte', 'lte'],
        }
        assert ItemViewSet.filterset_fields == expected

    def test_instock_filterset_fields(self):
        expected = {
            'quantity': ['exact', 'gte', 'lte'],
            'price': ['exact', 'gte', 'lte'],
            'stock_date': ['exact', 'gte', 'lte'],
        }
        assert InstockViewSet.filterset_fields == expected

    def test_outstock_filterset_fields(self):
        expected = {
            'quantity': ['exact', 'gte', 'lte'],
            'remaining_quantity': ['exact', 'gte', 'lte'],
            'stock_date': ['exact', 'gte', 'lte'],
        }
        assert OutstockViewSet.filterset_fields == expected


# --- Sub-task: Verify unauthenticated request returns 401 ---


@pytest.mark.django_db
class TestUnauthenticatedAccess:
    """Verify unauthenticated request returns 401."""

    @pytest.mark.parametrize("url", [
        '/api/group/',
        '/api/item/',
        '/api/instock/',
        '/api/outstock/',
    ])
    def test_unauthenticated_request_returns_401(self, url):
        client = APIClient()
        response = client.get(url)
        assert response.status_code == 401


# --- Sub-task: Verify search with no matches returns empty paginated response ---


@pytest.mark.django_db
class TestEmptySearchResults:
    """Verify search with no matches returns empty paginated response."""

    @pytest.fixture
    def auth_client(self):
        from django.contrib.auth.models import User
        user = User.objects.create_user(username='testuser', password='testpass123')
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    @pytest.mark.parametrize("url", [
        '/api/group/',
        '/api/item/',
        '/api/instock/',
        '/api/outstock/',
    ])
    def test_search_no_matches_returns_empty_paginated(self, auth_client, url):
        response = auth_client.get(url, {'search': 'zzzznonexistentterm9999'})
        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 0
        assert data['results'] == []
        assert 'next' in data
        assert 'previous' in data


# --- Sub-task: Verify SelectFieldSearch view and URL are removed ---


class TestLegacySearchRemoved:
    """Verify SelectFieldSearch view and URL are removed (import should fail)."""

    def test_select_field_search_not_importable(self):
        """Importing SelectFieldSearch from views should raise ImportError."""
        with pytest.raises(ImportError):
            from stockmanagement.views import SelectFieldSearch  # noqa: F401

    def test_suggestions_url_not_in_urlconf(self):
        """No URL pattern matching 'suggestions/' should exist."""
        from django.urls import resolve, Resolver404
        with pytest.raises(Resolver404):
            resolve('/suggestions/item')

    def test_suggestions_url_not_in_api_urlconf(self):
        """No URL pattern matching 'api/suggestions/' should exist."""
        from django.urls import resolve, Resolver404
        with pytest.raises(Resolver404):
            resolve('/api/suggestions/item')
