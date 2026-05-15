# Implementation Plan: Search System

## Overview

Replace broken legacy search with DRF's `SearchFilter` + `django-filter` on backend, debounced MUI TextField on frontend. Backend: configure filter backends on ViewSets, simplify `get_queryset()`. Frontend: rewrite Search component, modify PageChanger context. Cleanup: remove legacy search code.

## Tasks

- [x] 1. Backend: Install dependencies and configure DRF filter backends
  - [x] 1.1 Install django-filter and add to INSTALLED_APPS
    - Add `django-filter>=23.0` to `requirements.txt`
    - Add `'django_filters'` to `INSTALLED_APPS` in `settings.py`
    - _Requirements: 6.1_

  - [x] 1.2 Configure filter backends on `ItemViewSet`
    - Add `filter_backends = [SearchFilter, DjangoFilterBackend]`
    - Set `search_fields = ['name', 'code', 'description', 'unit', 'group__name', 'brand__name', 'notes']`
    - Set `filterset_fields` dict with numeric fields (quantity, max_price, min_price, sum_price, min_quanity, max_quanity) using `['exact', 'gte', 'lte']` lookups
    - _Requirements: 1.1, 1.4, 6.1, 6.2_

  - [x] 1.3 Configure filter backends on `GroupViewSet`
    - Add `filter_backends = [SearchFilter, DjangoFilterBackend]`
    - Set `search_fields = ['name', 'description']`
    - No filterset_fields needed for Group
    - _Requirements: 1.1, 1.4_

  - [x] 1.4 Configure filter backends on `InstockViewSet`
    - Add `filter_backends = [SearchFilter, DjangoFilterBackend]`
    - Set `search_fields = ['invoice_id', 'purchase_order_id', 'supplier', 'item__name', 'store_type', 'notes']`
    - Set `filterset_fields` dict with numeric (quantity, price) and date (stock_date) fields using `['exact', 'gte', 'lte']` lookups
    - _Requirements: 1.1, 1.4, 6.2, 6.3_

  - [x] 1.5 Configure filter backends on `OutstockViewSet`
    - Add `filter_backends = [SearchFilter, DjangoFilterBackend]`
    - Set `search_fields = ['stock_id', 'requester', 'department', 'item__name', 'customer__name', 'store_type', 'notes']`
    - Set `filterset_fields` dict with numeric (quantity, remaining_quantity) and date (stock_date) fields using `['exact', 'gte', 'lte']` lookups
    - _Requirements: 1.1, 1.4, 6.2, 6.3_

  - [x] 1.6 Modify `FormDataMixin.get_queryset()` and `list()` method
    - Simplify `get_queryset()` to return `self.model.objects.all().order_by(self.order_by)` (remove manual filter logic)
    - Update `list()` to call `self.filter_queryset(self.get_queryset())` before pagination
    - Ensure DRF filter backends handle all filtering (search, django-filter params)
    - _Requirements: 1.2, 1.3, 1.5, 1.7, 6.4, 6.5_

- [x] 2. Checkpoint - Backend filter configuration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Frontend: Rewrite Search component and update PageChanger context
  - [x] 3.1 Add search state to `PageChanger` context
    - Add `searchTerm` state (`useState<string>("")`)
    - Add `updateSearchTerm(term: string)` handler that sets loading, stores term, resets page to 1
    - Modify `updateDataFor` to append `&search=${encodeURIComponent(search)}` when search is non-empty
    - Modify `changePageTo` to clear searchTerm and reset page on tab change
    - Remove legacy search state: `searchFilters`, `FilterOptionType` usage, `searchPageFor`, `removeSearchFilter`
    - Expose `searchTerm` and `updateSearchTerm` from context
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 5.5_

  - [x] 3.2 Rewrite `Search.tsx` component
    - Replace entire component with MUI `TextField` (`variant="outlined"`, `size="small"`, `placeholder="Search..."`)
    - Implement controlled input with local state
    - Add 300ms debounce on input change (update local state immediately, debounce the context call)
    - Call `onSearchChange(trimmedValue)` after debounce; treat whitespace-only as empty search
    - Display `"{resultCount} results"` from API response count
    - Remove all Axios imports, suggestion endpoint calls, FilterOptionType, PillTag, Autocomplete
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.8, 5.1, 5.2, 5.3_

  - [x] 3.3 Implement error handling in search flow
    - Wrap `Requests.get()` in try/catch in PageChanger data fetching
    - On HTTP error (non-2xx): set pageData to `[]`, stop loading, show error message
    - On network error (fetch rejection): preserve existing pageData, stop loading, log to console, show error message
    - Preserve searchTerm in both error cases
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 2.7_

- [x] 4. Checkpoint - Frontend search working end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Backend: Remove legacy search code
  - [x] 5.1 Remove `SelectFieldSearch` view and URL route
    - Delete `SelectFieldSearch` view class from `views.py`
    - Remove `path('suggestions/<str:model>', SelectFieldSearch.as_view())` from URL configuration
    - _Requirements: 5.4_

- [x] 6. Frontend: Remove legacy search types and imports
  - [x] 6.1 Remove legacy type definitions and unused imports
    - Remove `FilterOptionType`, `SearchPageForType`, `RemoveSearchFilterType` type definitions if no longer referenced
    - Remove any remaining Axios imports across search-related files
    - Clean up any dead code paths referencing suggestion endpoints
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 7. Checkpoint - Legacy code removed, app functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Backend: Property tests with hypothesis
  - [x] 8.1 Write property test for search results containment
    - **Property 1: Search results contain the search term**
    - Use `hypothesis` with `hypothesis[django]` to generate random model instances and search terms
    - Assert every returned record contains the search term (case-insensitive) in at least one searchable field
    - Use DRF's `APIRequestFactory` for test requests
    - **Validates: Requirements 1.2**

  - [x] 8.2 Write property test for multi-word AND logic
    - **Property 2: Multi-word search uses AND logic**
    - Generate multi-word search queries, assert all returned records contain ALL words across searchable fields
    - **Validates: Requirements 1.3**

  - [x] 8.3 Write property test for pagination structure under search
    - **Property 3: Pagination structure preserved under search**
    - Generate search terms matching > PAGE_SIZE records, assert response has exactly PAGE_SIZE results, correct count, valid next/previous links
    - **Validates: Requirements 1.5**

  - [x] 8.4 Write property test for whitespace-only search
    - **Property 4: Whitespace-only search returns unfiltered results**
    - Generate whitespace-only strings, assert response matches unfiltered result set
    - **Validates: Requirements 1.7**

  - [x] 8.5 Write property test for combined search and filter AND logic
    - **Property 8: Combined search and filter uses AND logic**
    - Generate search terms + valid numeric/date filter params, assert results satisfy BOTH constraints
    - **Validates: Requirements 6.4, 6.5**

  - [x] 8.6 Write property test for invalid filter parameter handling
    - **Property 9: Invalid filter parameters are ignored**
    - Generate query params referencing non-existent fields or disallowed lookups, assert they're ignored
    - **Validates: Requirements 6.6**

  - [x] 8.7 Write property test for adversarial input safety
    - **Property 10: Adversarial search input cannot cause injection**
    - Generate SQL metacharacters, XSS payloads, ORM traversal attempts as search terms
    - Assert no 500 errors, no data leakage outside search_fields
    - **Validates: Security requirements**

- [x] 9. Frontend: Property tests with fast-check
  - [x] 9.1 Write property test for search term persistence across pages
    - **Property 5: Search term persists across page navigation**
    - Use `fast-check` to generate random search terms and page numbers
    - Assert constructed URL always includes `search={encoded_term}` param
    - **Validates: Requirements 3.1**

  - [x] 9.2 Write property test for pagination reset on new search
    - **Property 6: New search resets pagination to page 1**
    - Generate arbitrary current page numbers > 1 and new search terms
    - Assert next request uses `page=1`
    - **Validates: Requirements 3.2**

  - [x] 9.3 Write property test for URL encoding of search term
    - **Property 7: Search term is URL-encoded**
    - Generate search terms with special characters (spaces, &, =, #, unicode)
    - Assert URL contains `encodeURIComponent(term)` output, not raw term
    - **Validates: Requirements 3.4**

- [x] 10. Backend: Unit tests
  - [x] 10.1 Write unit tests for ViewSet configuration
    - Verify `filter_backends` contains `SearchFilter` and `DjangoFilterBackend` on each ViewSet
    - Verify `search_fields` matches expected list per ViewSet
    - Verify `filterset_fields` matches expected dict per ViewSet
    - Verify unauthenticated request returns 401
    - Verify search with no matches returns empty paginated response
    - Verify `SelectFieldSearch` view and URL are removed (import should fail)
    - _Requirements: 1.1, 1.4, 1.6, 1.8, 5.4_

- [x] 11. Frontend: Unit tests
  - [x] 11.1 Write unit tests for Search component
    - Test Search component renders TextField with correct MUI props (variant, size, placeholder)
    - Test debounce fires after 300ms, not before
    - Test loading state set on search, cleared on response/error
    - Test result count displayed from API response
    - Test clear input resets search and fetches page 1
    - Test error scenarios: network failure preserves data, HTTP error shows empty table
    - Verify no axios imports, no legacy type references in component
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 5.1_

- [x] 12. E2E tests with Cypress
  - [x] 12.1 Write E2E tests for search functionality
    - Test search input visible on each table page
    - Test type search term → table filters after debounce
    - Test clear search → table shows all records
    - Test pagination works with active search
    - Test tab change clears search input
    - _Requirements: 1.2, 2.2, 2.6, 3.1, 3.3_

- [x] 13. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend uses Python (Django/DRF), frontend uses TypeScript (React/MUI)
- Install `hypothesis` + `hypothesis[django]` as dev dependencies for backend property tests
- Install `fast-check` as dev dependency for frontend property tests
- Install `@testing-library/react` + `vitest` as dev dependencies if not already present

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["5.1", "6.1"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "9.1", "9.2", "9.3"] },
    { "id": 7, "tasks": ["10.1", "11.1"] },
    { "id": 8, "tasks": ["12.1"] }
  ]
}
```
