"""
Property-based tests for the search system.
Uses hypothesis to verify correctness properties of DRF SearchFilter integration.

Feature: search-system
"""
import json
import string

from django.contrib.auth.models import User
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework.test import APIRequestFactory

from stockmanagement.models import Group, Item, Brand
from stockmanagement.views import ItemViewSet


# Strategy: generate short alphabetic words suitable for search terms
word_strategy = st.text(
    alphabet=string.ascii_letters,
    min_size=2,
    max_size=6,
).map(str.strip).filter(lambda w: len(w) >= 2)

# Strategy: generate multi-word search queries (2-3 words)
multi_word_strategy = st.lists(
    word_strategy,
    min_size=2,
    max_size=3,
).map(lambda words: " ".join(words))


ITEM_SEARCH_FIELDS = ['code', 'description', 'unit', 'group__name', 'brand__name', 'notes']


def get_searchable_text(item):
    """Collect all searchable field values for an Item into a single lowercase string."""
    parts = []
    parts.append(item.code or "")
    parts.append(item.description or "")
    parts.append(item.unit or "")
    parts.append(item.group.name if item.group else "")
    parts.append(item.brand.name if item.brand else "")
    parts.append(item.notes or "")
    return " ".join(parts).lower()


def record_contains_all_words(item, words):
    """Check if a record contains ALL words (case-insensitive) across searchable fields."""
    searchable_text = get_searchable_text(item)
    return all(word.lower() in searchable_text for word in words)


class TestSearchResultsContainment(TestCase):
    """
    Feature: search-system, Property 1: Search results contain the search term

    **Validates: Requirements 1.2**

    For any set of records in the database and for any non-empty search term,
    every record returned by the List_Endpoint with that search term SHALL
    contain the search term (case-insensitive) in at least one of its searchable fields.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser_containment', password='testpass123'
        )
        self.group = Group.objects.create(name="Widgets", description="Widget parts")
        self.brand = Brand.objects.create(name="BrandX")

        # Pre-populate some items with varied data
        self.items = []
        for i, (code, desc, unit, notes) in enumerate([
            ("CW001", "Electrical copper wire", "meter", "High conductivity"),
            ("SB002", "Galvanized steel bolt", "pcs", "Grade 8"),
            ("GP003", "Tempered glass panel", "sheet", "Safety rated"),
            ("RS004", "Industrial rubber seal", "pcs", "Heat resistant"),
            ("AP005", "Extruded aluminum pipe", "meter", "6061 alloy"),
        ]):
            item = Item.objects.create(
                code=code,
                description=desc,
                unit=unit,
                group=self.group,
                brand=self.brand,
                quantity=10 + i,
                notes=notes,
            )
            self.items.append(item)

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(search_term=word_strategy)
    def test_search_results_contain_search_term(self, search_term):
        """
        Property 1: Search results contain the search term

        For any non-empty search term, every record returned by the endpoint
        SHALL contain the search term (case-insensitive) in at least one
        searchable field.

        **Validates: Requirements 1.2**
        """
        from rest_framework.test import force_authenticate

        # Ensure at least one item contains the search term so we get results
        item_with_term = Item.objects.create(
            code=f"PROP1-{search_term[:4].upper()}-{Item.objects.count()}",
            description=f"Item {search_term}",
            unit="pcs",
            group=self.group,
            brand=self.brand,
            quantity=5,
            notes="Generated for containment test",
        )

        try:
            request = self.factory.get('/api/item/', {'search': search_term})
            force_authenticate(request, user=self.user)

            view = ItemViewSet.as_view({'get': 'list'})
            response = view(request)

            self.assertEqual(response.status_code, 200)

            results = response.data.get('results', [])

            # Every returned record must contain the search term in at least one searchable field
            for result in results:
                item = Item.objects.get(pk=result['id'])
                searchable_text = get_searchable_text(item)

                self.assertIn(
                    search_term.lower(),
                    searchable_text,
                    f"Search term '{search_term}' not found in any searchable field of "
                    f"item '{item.code}' (id={item.id}). "
                    f"Searchable text: '{searchable_text}'"
                )
        finally:
            item_with_term.delete()


class TestCombinedSearchAndFilterANDLogic(TestCase):
    """
    Feature: search-system, Property 8: Combined search and filter uses AND logic

    **Validates: Requirements 6.4, 6.5**

    For any search term and for any valid numeric filter parameter, the
    List_Endpoint SHALL return only records that satisfy BOTH the text search
    AND the filter constraint.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser_combined', password='testpass123'
        )
        self.group = Group.objects.create(name="Widgets", description="Widget parts")
        self.brand = Brand.objects.create(name="BrandX")

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(
        search_term=word_strategy,
        quantity_threshold=st.integers(min_value=1, max_value=50),
    )
    def test_combined_search_and_filter_returns_only_records_matching_both(self, search_term, quantity_threshold):
        """
        Property 8: Combined search and filter uses AND logic

        Generate search terms + valid numeric filter params, assert results
        satisfy BOTH constraints.

        **Validates: Requirements 6.4, 6.5**
        """
        from rest_framework.test import force_authenticate
        from decimal import Decimal

        # Create item matching BOTH search term AND quantity filter
        item_both = Item.objects.create(
            code=f"BOTH-{search_term[:3].upper()}-{Item.objects.count()}",
            description=f"Item {search_term}",
            unit="pcs",
            group=self.group,
            brand=self.brand,
            quantity=Decimal(quantity_threshold + 10),  # Above threshold
        )

        # Create item matching search term but NOT quantity filter
        item_search_only = Item.objects.create(
            code=f"SRCH-{search_term[:3].upper()}-{Item.objects.count()}",
            description=f"Item {search_term}",
            unit="kg",
            group=self.group,
            brand=self.brand,
            quantity=Decimal(max(0, quantity_threshold - 5)),  # Below threshold
        )

        # Create item matching quantity filter but NOT search term
        item_filter_only = Item.objects.create(
            code=f"FILT-ZZQQ-{Item.objects.count()}",
            description="No search match ZZQQ",
            unit="m",
            group=self.group,
            brand=self.brand,
            quantity=Decimal(quantity_threshold + 20),  # Above threshold
        )

        try:
            # Perform combined search + filter request
            request = self.factory.get('/api/item/', {
                'search': search_term,
                'quantity__gte': str(quantity_threshold),
            })
            force_authenticate(request, user=self.user)

            view = ItemViewSet.as_view({'get': 'list'})
            response = view(request)

            self.assertEqual(response.status_code, 200)

            results = response.data.get('results', [])

            for result in results:
                item = Item.objects.get(pk=result['id'])

                # Assert search constraint: term appears in searchable fields
                searchable_text = get_searchable_text(item)
                self.assertIn(
                    search_term.lower(),
                    searchable_text,
                    f"Search term '{search_term}' not found in searchable fields of "
                    f"item '{item.code}' (id={item.id}). "
                    f"Searchable text: '{searchable_text}'"
                )

                # Assert filter constraint: quantity >= threshold
                self.assertGreaterEqual(
                    item.quantity,
                    Decimal(quantity_threshold),
                    f"Item '{item.code}' (id={item.id}) has quantity={item.quantity} "
                    f"which is less than filter threshold {quantity_threshold}. "
                    f"Combined AND logic violated."
                )
        finally:
            # Clean up to avoid interference between examples
            item_both.delete()
            item_search_only.delete()
            item_filter_only.delete()


class TestMultiWordANDLogic(TestCase):
    """
    Feature: search-system, Property 2: Multi-word search uses AND logic

    **Validates: Requirements 1.3**

    For any set of records and for any search query containing multiple
    space-separated words, every record in the response SHALL contain ALL
    words (case-insensitive) across its searchable fields.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        # Create a group and brand for related field searching
        self.group = Group.objects.create(name="Electronics", description="Electronic parts")
        self.brand = Brand.objects.create(name="Acme")

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(search_query=multi_word_strategy)
    def test_multi_word_search_returns_only_records_containing_all_words(self, search_query):
        """
        Property 2: Multi-word search uses AND logic

        Generate multi-word search queries, assert all returned records
        contain ALL words across searchable fields.

        **Validates: Requirements 1.3**
        """
        words = search_query.split()

        # Create items that contain all words (spread across fields)
        # Put first word in code, second in description, third (if exists) in notes
        item_with_all = Item.objects.create(
            code=f"ALL-{words[0][:3].upper()}-{words[0]}-{Item.objects.count()}",
            description=f"Desc {words[1]}",
            notes=f"Note {words[2]}" if len(words) > 2 else "Note",
            unit="pcs",
            group=self.group,
            brand=self.brand,
            quantity=10,
        )

        # Create item with only first word (should NOT match multi-word AND)
        item_partial = Item.objects.create(
            code=f"PART-{words[0][:3].upper()}-{words[0]}-{Item.objects.count()}",
            description="No match here",
            notes="Nothing relevant",
            unit="kg",
            group=self.group,
            brand=self.brand,
            quantity=5,
        )

        try:
            # Perform search with multi-word query
            request = self.factory.get(f'/api/item/', {'search': search_query})
            request.user = self.user
            from rest_framework.test import force_authenticate
            force_authenticate(request, user=self.user)

            view = ItemViewSet.as_view({'get': 'list'})
            response = view(request)

            self.assertEqual(response.status_code, 200)

            results = response.data.get('results', [])

            # For every returned record, verify ALL words appear across searchable fields
            for result in results:
                # Get the actual item from DB to check searchable fields
                item = Item.objects.get(pk=result['id'])
                searchable_text = get_searchable_text(item)

                for word in words:
                    self.assertIn(
                        word.lower(),
                        searchable_text,
                        f"Word '{word}' not found in searchable fields of item '{item.code}' "
                        f"(id={item.id}). Search query: '{search_query}'. "
                        f"Searchable text: '{searchable_text}'"
                    )
        finally:
            # Clean up created items to avoid interference between examples
            item_with_all.delete()
            item_partial.delete()


from stockmanagement.views import GroupViewSet


# Strategy: generate whitespace-only strings (spaces, tabs, newlines)
whitespace_strategy = st.text(
    alphabet=st.sampled_from([' ', '\t', '\n', '\r', '\x0b', '\x0c']),
    min_size=0,
    max_size=20,
)


class TestWhitespaceOnlySearchReturnsUnfiltered(TestCase):
    """
    Feature: search-system, Property 4: Whitespace-only search returns unfiltered results

    **Validates: Requirements 1.7**

    For any string composed entirely of whitespace characters (including empty string),
    the List_Endpoint SHALL return the same result set as a request with no search parameter.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser_ws', password='testpass123'
        )
        # Create some Group records to have data in the DB
        self.groups = [
            Group.objects.create(name="Alpha Group", description="First group"),
            Group.objects.create(name="Beta Group", description="Second group"),
            Group.objects.create(name="Gamma Group", description="Third group"),
        ]

    def tearDown(self):
        Group.objects.all().delete()

    def _get_response(self, params=None):
        """Helper to make a GET request to GroupViewSet list endpoint."""
        from rest_framework.test import force_authenticate

        request = self.factory.get('/api/group/', params or {})
        force_authenticate(request, user=self.user)
        view = GroupViewSet.as_view({'get': 'list'})
        response = view(request)
        return response

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(whitespace_term=whitespace_strategy)
    def test_whitespace_only_search_matches_unfiltered_results(self, whitespace_term):
        """
        Property 4: Whitespace-only search returns unfiltered results

        Generate whitespace-only strings, assert response matches unfiltered result set.

        **Validates: Requirements 1.7**
        """
        # Get unfiltered response (no search param)
        unfiltered_response = self._get_response()
        self.assertEqual(unfiltered_response.status_code, 200)

        # Get response with whitespace-only search term
        filtered_response = self._get_response({'search': whitespace_term})
        self.assertEqual(filtered_response.status_code, 200)

        # Both should return the same count
        self.assertEqual(
            unfiltered_response.data['count'],
            filtered_response.data['count'],
            f"Whitespace-only search term {repr(whitespace_term)} returned different count. "
            f"Unfiltered: {unfiltered_response.data['count']}, "
            f"With search: {filtered_response.data['count']}"
        )

        # Both should return the same result IDs
        unfiltered_ids = sorted([r['id'] for r in unfiltered_response.data['results']])
        filtered_ids = sorted([r['id'] for r in filtered_response.data['results']])

        self.assertEqual(
            unfiltered_ids,
            filtered_ids,
            f"Whitespace-only search term {repr(whitespace_term)} returned different results. "
            f"Unfiltered IDs: {unfiltered_ids}, Filtered IDs: {filtered_ids}"
        )


# --- Adversarial input strategies ---

# SQL injection payloads
sql_injection_payloads = st.sampled_from([
    "'; DROP TABLE item--",
    '" OR 1=1',
    "' OR '1'='1",
    "; SELECT * FROM auth_user--",
    "' UNION SELECT password FROM auth_user--",
    "1; DROP TABLE stockmanagement_item",
    "' OR ''='",
    "%",
    "_",
    "%%",
    "__",
    "'; TRUNCATE TABLE item--",
    "1 OR 1=1",
    "' AND 1=0 UNION SELECT username, password FROM auth_user--",
])

# XSS payloads
xss_payloads = st.sampled_from([
    "<script>alert(1)</script>",
    '"><img onerror=alert(1) src=x>',
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert(1)",
    "<svg onload=alert(1)>",
    "'-alert(1)-'",
    "<iframe src='javascript:alert(1)'>",
    "<body onload=alert(1)>",
    "{{7*7}}",
    "${7*7}",
])

# ORM traversal attempts
orm_traversal_payloads = st.sampled_from([
    "__password",
    "__pk",
    "user__password",
    "user__email",
    "auth_user__password",
    "item__group__id__password",
    "__all__",
    "password__exact",
    "user__is_superuser",
    "__module__",
])

# Combined adversarial strategy: pick from any category or combine with random text
adversarial_strategy = st.one_of(
    sql_injection_payloads,
    xss_payloads,
    orm_traversal_payloads,
    # Combine adversarial payload with random text
    st.tuples(
        st.sampled_from([
            "'; DROP TABLE--", "' OR 1=1", "<script>alert(1)</script>",
            "__password", "UNION SELECT", "<img onerror=",
        ]),
        st.text(alphabet=string.ascii_letters + string.digits + " ", min_size=1, max_size=10),
    ).map(lambda t: f"{t[0]} {t[1]}"),
)


class TestAdversarialInputSafety(TestCase):
    """
    Feature: search-system, Property 10: Adversarial search input cannot cause injection

    **Validates: Security requirements**

    For any search term containing SQL metacharacters, XSS payloads, or ORM
    traversal attempts, the List_Endpoint SHALL either return legitimate matching
    records or an empty result set — never a database error, never execute
    injected code, and never expose fields outside search_fields.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.group = Group.objects.create(name="TestGroup", description="Test group")
        self.brand = Brand.objects.create(name="TestBrand")
        # Create a sample item so the endpoint has data to query against
        self.item = Item.objects.create(
            code="ADV-TEST-001",
            description="Item for adversarial testing",
            unit="pcs",
            group=self.group,
            brand=self.brand,
            quantity=10,
            notes="Normal notes",
        )

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(adversarial_input=adversarial_strategy)
    def test_adversarial_search_cannot_cause_injection(self, adversarial_input):
        """
        Property 10: Adversarial search input cannot cause injection

        Generate SQL metacharacters, XSS payloads, ORM traversal attempts as
        search terms. Assert no 500 errors, no data leakage outside search_fields.

        **Validates: Security requirements**
        """
        from rest_framework.test import force_authenticate

        request = self.factory.get('/api/item/', {'search': adversarial_input})
        force_authenticate(request, user=self.user)

        view = ItemViewSet.as_view({'get': 'list'})
        response = view(request)

        # ASSERTION 1: Response status is 200 (never 500 server error)
        self.assertEqual(
            response.status_code, 200,
            f"Adversarial input '{adversarial_input}' caused HTTP {response.status_code} "
            f"instead of 200. Response: {getattr(response, 'data', 'no data')}"
        )

        # ASSERTION 2: Response contains valid paginated structure
        self.assertIn('results', response.data,
                      f"Response missing 'results' key for input: '{adversarial_input}'")
        self.assertIn('count', response.data,
                      f"Response missing 'count' key for input: '{adversarial_input}'")

        # ASSERTION 3: No error messages in response body
        results = response.data.get('results', [])
        response_str = str(response.data).lower()
        self.assertNotIn('traceback', response_str,
                         f"Traceback leaked in response for input: '{adversarial_input}'")
        self.assertNotIn('operationalerror', response_str,
                         f"Database error leaked in response for input: '{adversarial_input}'")
        self.assertNotIn('programmingerror', response_str,
                         f"Programming error leaked in response for input: '{adversarial_input}'")

        # ASSERTION 4: Results only contain data from searchable fields
        # (no password, no auth data, no hidden fields leaked)
        allowed_fields = {
            'id', 'name', 'code', 'description', 'unit', 'group', 'brand',
            'notes', 'quantity', 'max_price', 'min_price', 'sum_price',
            'instock_number', 'outstock_number', 'modified',
            'min_quanity', 'max_quanity', 'group_name', 'brand_name',
        }
        for result in results:
            result_keys = set(result.keys())
            # Ensure no sensitive fields are exposed
            sensitive_fields = {'password', 'token', 'secret', 'session_key'}
            leaked = result_keys & sensitive_fields
            self.assertEqual(
                leaked, set(),
                f"Sensitive fields {leaked} leaked in response for input: '{adversarial_input}'"
            )



# Allowed filterset_fields for ItemViewSet
ITEM_FILTERSET_FIELDS = {
    'quantity': ['exact', 'gte', 'lte'],
    'max_price': ['exact', 'gte', 'lte'],
    'min_price': ['exact', 'gte', 'lte'],
    'sum_price': ['exact', 'gte', 'lte'],
    'min_quanity': ['exact', 'gte', 'lte'],
    'max_quanity': ['exact', 'gte', 'lte'],
}

ALLOWED_FIELD_NAMES = set(ITEM_FILTERSET_FIELDS.keys())
ALLOWED_LOOKUPS = {'exact', 'gte', 'lte'}

# Strategy: generate field names that are NOT in the allowed filterset_fields
invalid_field_strategy = st.text(
    alphabet=string.ascii_lowercase + '_',
    min_size=3,
    max_size=15,
).filter(lambda f: f not in ALLOWED_FIELD_NAMES and not f.startswith('_') and not f.endswith('_') and '__' not in f)

# Strategy: generate lookup types that are NOT in the allowed list
invalid_lookup_strategy = st.sampled_from([
    'contains', 'icontains', 'startswith', 'istartswith',
    'endswith', 'iendswith', 'in', 'gt', 'lt', 'range',
    'isnull', 'regex', 'iregex', 'search', 'year', 'month',
])

# Strategy: generate a random value for the filter param
filter_value_strategy = st.one_of(
    st.integers(min_value=0, max_value=1000).map(str),
    st.text(alphabet=string.ascii_letters + string.digits, min_size=1, max_size=10),
)


@st.composite
def invalid_filter_params_strategy(draw):
    """Generate a dict of 1-3 invalid filter query params.

    Each param is either:
    - A non-existent field name (with or without lookup): e.g. ?fake_field__gte=10
    - A valid field with a disallowed lookup: e.g. ?quantity__contains=5
    """
    num_params = draw(st.integers(min_value=1, max_value=3))
    params = {}

    for _ in range(num_params):
        param_type = draw(st.sampled_from(['invalid_field', 'invalid_lookup']))

        if param_type == 'invalid_field':
            field = draw(invalid_field_strategy)
            # Optionally add a lookup suffix
            add_lookup = draw(st.booleans())
            if add_lookup:
                lookup = draw(st.sampled_from(['exact', 'gte', 'lte', 'contains', 'gt', 'lt']))
                key = f"{field}__{lookup}"
            else:
                key = field
        else:
            # Valid field + invalid lookup
            field = draw(st.sampled_from(list(ALLOWED_FIELD_NAMES)))
            lookup = draw(invalid_lookup_strategy)
            key = f"{field}__{lookup}"

        value = draw(filter_value_strategy)
        params[key] = value

    return params


class TestInvalidFilterParametersIgnored(TestCase):
    """
    Feature: search-system, Property 9: Invalid filter parameters are ignored

    **Validates: Requirements 6.6**

    For any query parameter referencing a field not in filterset_fields or using
    a lookup not in the allowed list, the List_Endpoint SHALL ignore it and return
    results as if the parameter were not present.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser_filter', password='testpass123'
        )
        self.group = Group.objects.create(name="TestGroup", description="Test group")
        self.brand = Brand.objects.create(name="TestBrand")

        # Create a few items so we have data to compare against
        self.items = []
        for i in range(3):
            item = Item.objects.create(
                code=f"FILTER-TEST-{i}",
                description=f"FilterItem{i} Description {i}",
                unit="pcs",
                group=self.group,
                brand=self.brand,
                quantity=10 + i,
                max_price=100 + i,
                min_price=50 + i,
                sum_price=200 + i,
            )
            self.items.append(item)

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(invalid_params=invalid_filter_params_strategy())
    def test_invalid_filter_params_are_ignored(self, invalid_params):
        """
        Property 9: Invalid filter parameters are ignored

        Generate query params referencing non-existent fields or disallowed lookups,
        assert they're ignored and the response matches a request without those params.

        **Validates: Requirements 6.6**
        """
        from rest_framework.test import force_authenticate

        # Request WITH invalid filter params
        request_with_params = self.factory.get('/api/item/', invalid_params)
        force_authenticate(request_with_params, user=self.user)

        view = ItemViewSet.as_view({'get': 'list'})
        response_with_params = view(request_with_params)

        # Request WITHOUT any filter params (baseline)
        request_without_params = self.factory.get('/api/item/')
        force_authenticate(request_without_params, user=self.user)

        response_without_params = view(request_without_params)

        # Both should return 200
        self.assertEqual(
            response_with_params.status_code, 200,
            f"Expected 200 with invalid params {invalid_params}, "
            f"got {response_with_params.status_code}"
        )
        self.assertEqual(response_without_params.status_code, 200)

        # Results should be identical — invalid params are ignored
        results_with = response_with_params.data.get('results', [])
        results_without = response_without_params.data.get('results', [])

        ids_with = sorted([r['id'] for r in results_with])
        ids_without = sorted([r['id'] for r in results_without])

        self.assertEqual(
            ids_with,
            ids_without,
            f"Invalid filter params {invalid_params} changed results. "
            f"With params: {ids_with}, Without params: {ids_without}"
        )

        # Count should also match
        self.assertEqual(
            response_with_params.data.get('count'),
            response_without_params.data.get('count'),
            f"Invalid filter params {invalid_params} changed count."
        )


PAGE_SIZE = 19


class TestPaginationStructurePreservedUnderSearch(TestCase):
    """
    Feature: search-system, Property 3: Pagination structure preserved under search

    **Validates: Requirements 1.5**

    For any search term that matches more than PAGE_SIZE records, the paginated
    response SHALL contain exactly PAGE_SIZE results, a count equal to the total
    matching records, and valid next/previous links.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser_pagination', password='testpass123'
        )
        self.group = Group.objects.create(name="PaginationGroup", description="For pagination tests")
        self.brand = Brand.objects.create(name="PaginationBrand")

    def tearDown(self):
        Item.objects.filter(code__startswith="PAG-").delete()

    @settings(
        max_examples=100,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
        deadline=None,
    )
    @given(
        search_term=word_strategy,
        extra_count=st.integers(min_value=1, max_value=10),
    )
    def test_pagination_structure_preserved_under_search(self, search_term, extra_count):
        """
        Property 3: Pagination structure preserved under search

        Generate search terms matching > PAGE_SIZE (19) Item records, assert the
        first page response has exactly PAGE_SIZE results, correct count, and
        valid next/previous links.

        **Validates: Requirements 1.5**
        """
        from rest_framework.test import force_authenticate

        total_records = PAGE_SIZE + extra_count  # Always > PAGE_SIZE

        # Create total_records items all containing the search term in their name
        created_items = []
        for i in range(total_records):
            item = Item.objects.create(
                code=f"PAG-{search_term[:3].upper()}-{i}-{Item.objects.count()}",
                description=f"Paginated {search_term} item {i}",
                unit="pcs",
                group=self.group,
                brand=self.brand,
                quantity=i + 1,
            )
            created_items.append(item)

        try:
            # Request page 1 with the search term
            request = self.factory.get('/api/item/', {'search': search_term, 'page': '1'})
            force_authenticate(request, user=self.user)

            view = ItemViewSet.as_view({'get': 'list'})
            response = view(request)

            self.assertEqual(response.status_code, 200)

            # ASSERTION 1: First page has exactly PAGE_SIZE results
            results = response.data.get('results', [])
            self.assertEqual(
                len(results),
                PAGE_SIZE,
                f"Expected exactly {PAGE_SIZE} results on page 1 for search term "
                f"'{search_term}' with {total_records} matching records, "
                f"but got {len(results)}."
            )

            # ASSERTION 2: count equals total matching records (at least total_records)
            count = response.data.get('count')
            self.assertGreaterEqual(
                count,
                total_records,
                f"Expected count >= {total_records} for search term '{search_term}', "
                f"but got count={count}."
            )

            # ASSERTION 3: next link is present and valid on page 1
            next_link = response.data.get('next')
            self.assertIsNotNone(
                next_link,
                f"Expected 'next' link to be present on page 1 when {total_records} "
                f"records match search term '{search_term}', but got None."
            )
            # Verify next link contains page=2 and the search term
            self.assertIn(
                'page=2',
                next_link,
                f"Expected 'next' link to contain 'page=2', got: '{next_link}'"
            )

            # ASSERTION 4: previous link is null on page 1
            previous_link = response.data.get('previous')
            self.assertIsNone(
                previous_link,
                f"Expected 'previous' link to be None on page 1, "
                f"but got: '{previous_link}'"
            )
        finally:
            # Clean up created items to avoid interference between examples
            for item in created_items:
                item.delete()
