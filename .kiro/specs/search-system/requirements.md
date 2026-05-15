# Requirements Document

## Introduction

A simplified, standards-based search system for the PC Elemac Stock Management application. The previous custom search implementation broke after a refactor and was overly complex (custom suggestion endpoints, separator-based filter types, Axios dependency). This redesign adopts DRF's built-in `SearchFilter` on the backend — the industry standard for Django REST APIs — paired with a simple text input on the frontend. One search box, one query parameter (`?search=term`), works across all fields in each table.

## Glossary

- **Search_Filter**: DRF's built-in `rest_framework.filters.SearchFilter` backend that provides single-parameter full-text searching across specified model fields
- **Search_Component**: The React frontend text input that sends the search query and displays results
- **Search_Term**: The user-entered text sent as the `?search=` query parameter
- **Searchable_Field**: A model field included in the ViewSet's `search_fields` list, searched using case-insensitive partial matching by default
- **Filter_Backend**: DRF's `django_filters.rest_framework.DjangoFilterBackend` that enables field-specific filtering with lookup expressions (exact, gte, lte, etc.)
- **PageChanger_Context**: The React context provider that manages page state, search term, and data fetching
- **List_Endpoint**: The existing DRF paginated list endpoint for each model (`/api/{model}/`)

## Requirements

### Requirement 1: Backend Search Integration

**User Story:** As a user, I want to type a search term and have the table filter to show only matching records, so that I can find specific items across any field.

#### Acceptance Criteria

1. THE List_Endpoint SHALL use DRF's SearchFilter as a filter backend on all Searchable model ViewSets (Item, Instock, Outstock, Group)
2. WHEN a `search` query parameter containing at least one non-whitespace character is included in a GET request to the List_Endpoint, THE Search_Filter SHALL return only records where at least one Searchable_Field contains the Search_Term (case-insensitive partial match)
3. WHEN multiple space-separated words are provided in the search parameter, THE Search_Filter SHALL return only records matching all words (AND logic across terms)
4. THE Search_Filter SHALL search across the following fields for each model:
   - **Item**: name, code, description, unit, group__name (related), brand__name (related), notes
   - **Instock**: invoice_id, purchase_order_id, supplier, item__name (related), store_type, notes
   - **Outstock**: stock_id, requester, department, item__name (related), customer__name (related), store_type, notes
   - **Group**: name, description
5. THE List_Endpoint SHALL preserve existing PageNumberPagination behavior (PAGE_SIZE=19, page count, next/previous links) when a search parameter is applied
6. IF a request to the List_Endpoint does not include a valid Token Authentication header, THEN THE List_Endpoint SHALL return an HTTP 401 Unauthorized response
7. IF the `search` query parameter is empty or contains only whitespace, THEN THE List_Endpoint SHALL return the unfiltered paginated result set (same behavior as no search parameter)
8. WHEN a `search` query parameter matches no records, THE List_Endpoint SHALL return a paginated response with an empty results list and a count of 0

### Requirement 2: Frontend Search Component

**User Story:** As a user, I want a search input above the table that filters results as I type, so that I can find records without complex filter selection.

#### Acceptance Criteria

1. THE Search_Component SHALL render a text input field positioned above the data table, using a Material UI `TextField` component with `variant="outlined"` and `size="small"`
2. WHEN the user types in the Search_Component and pauses for 300ms (debounce), THE Search_Component SHALL send the current input value as the `search` query parameter to the List_Endpoint (e.g., `/api/{pageName}/?page=1&search={value}`)
3. WHEN the Search_Component sends a search request, THE Search_Component SHALL set the page loading state to true and display the existing loading indicator until the API response is received or the request fails
4. WHEN the List_Endpoint returns a successful response, THE Search_Component SHALL display the `count` field from the paginated response as the total number of results (e.g., "{count} results")
5. THE Search_Component SHALL use the project's `Requests` utility class (`src/util/requests.tsx`) for all HTTP calls, passing the auth header from the Login context
6. WHEN the user clears the search input (input value becomes an empty string), THE Search_Component SHALL reset the search query parameter and fetch unfiltered results for page 1
7. IF the search request fails (network error or non-2xx response), THEN THE Search_Component SHALL stop the loading indicator, preserve the current search input value, and display no results in the table
8. WHEN the user types a search term with fewer than 1 character after trimming whitespace, THE Search_Component SHALL NOT send a search request and SHALL treat it as an empty search (fetch unfiltered results)

### Requirement 3: Search State Management

**User Story:** As a user, I want my search to persist while I navigate pages, so that I do not lose my search context when paginating.

#### Acceptance Criteria

1. WHILE a Search_Term is active, THE PageChanger_Context SHALL append the search term as a query parameter in the format `&search={encoded_value}` on every page data request
2. WHEN a new Search_Term is submitted, THE PageChanger_Context SHALL reset pagination to page 1
3. WHEN the user navigates to a different model tab, THE PageChanger_Context SHALL clear the active Search_Term, reset the search input value to an empty string, and reset pagination to page 1
4. THE PageChanger_Context SHALL encode the Search_Term using `encodeURIComponent` before appending it to request URLs
5. WHEN the user removes the Search_Term (clears input), THE PageChanger_Context SHALL remove the search parameter from requests and reset pagination to page 1

### Requirement 4: Error Handling

**User Story:** As a user, I want clear feedback when search fails, so that I understand what went wrong.

#### Acceptance Criteria

1. IF the List_Endpoint returns a non-2xx HTTP response during a search, THEN THE Search_Component SHALL display an empty table, preserve the search input value, and dismiss any loading indicator
2. IF the network request fails (fetch rejection), THEN THE Search_Component SHALL display the previously loaded table data, preserve the search input value, dismiss any loading indicator, and log the error to the console
3. IF the search term is empty or contains only whitespace, THEN THE Search_Component SHALL not send a search request and SHALL display unfiltered results
4. IF the List_Endpoint returns an error response or the network request fails during a search, THEN THE Search_Component SHALL display a user-visible error message indicating that the search could not be completed

### Requirement 5: Cleanup of Legacy Search Code

**User Story:** As a developer, I want the old broken search code removed, so that the codebase stays clean and maintainable.

#### Acceptance Criteria

1. THE Search_Component SHALL not contain any import statement for the `axios` package nor invoke any Axios methods (e.g., `axios.get`, `axios.post`)
2. THE Search_Component SHALL not make HTTP requests to URL paths containing `/suggestions/` or `/search/` segments
3. THE Search_Component SHALL not use the legacy `FilterOptionType` suggestion-selection pattern (no separator-based filter construction using `name`, `seperator`, and `value` fields; no `PillTag` components rendering individual field filters; no `Autocomplete` dropdown populated by field-specific suggestion results)
4. WHEN all acceptance criteria of Requirements 1 through 4 in this specification are implemented and verified, THE backend SHALL remove the `SelectFieldSearch` view class from `views.py` and its corresponding URL route (`path('suggestions/<str:model>', SelectFieldSearch.as_view())`) from the URL configuration
5. WHEN all acceptance criteria of Requirements 1 through 4 in this specification are implemented and verified, THE Search_Component file SHALL not import or reference the `FilterOptionType`, `SearchPageForType`, or `RemoveSearchFilterType` types if they are no longer used by the new search implementation

### Requirement 6: Extensibility for Numeric and Date Filtering

**User Story:** As a developer, I want the search architecture to support future numeric range and date filtering, so that the system can grow without a rewrite.

#### Acceptance Criteria

1. THE List_Endpoint SHALL support `django-filter` DjangoFilterBackend alongside SearchFilter in the `filter_backends` list, enabling field-specific filtering via query parameters (e.g., `?price__gte=10&price__lte=50`)
2. THE List_Endpoint SHALL define `filterset_fields` using dict format for numeric fields on each model with lookups `['exact', 'gte', 'lte']`: Item (quantity, max_price, min_price, sum_price, min_quantity, max_quantity), Instock (quantity, price), Outstock (quantity, remaining_quantity)
3. THE List_Endpoint SHALL define `filterset_fields` using dict format for date fields on each model with lookups `['exact', 'gte', 'lte']`: Instock (stock_date), Outstock (stock_date)
4. THE List_Endpoint SHALL allow combining text search (`?search=term`) with numeric/date filters (`?quantity__gte=5`) in a single request, returning only records that satisfy all provided parameters
5. WHEN both search and filter parameters are provided, THE List_Endpoint SHALL apply all constraints together using AND logic, returning the intersection of results matching both the search term and all filter conditions
6. IF a filter query parameter references a field not defined in `filterset_fields` or uses a lookup not in the allowed list for that field, THEN THE List_Endpoint SHALL ignore the unrecognized parameter and return results filtered only by the valid parameters
