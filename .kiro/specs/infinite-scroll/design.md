<!-- GitHub: #18 https://github.com/tedyeates/stockmanager/issues/18 -->
# Infinite Scroll

## Problem Statement

The current pagination UI requires users to click numbered page buttons to navigate stock data. For an inventory management app where users frequently scan through long lists of instocks/outstocks/items, this adds unnecessary friction. Users lose context when jumping between pages and can't easily scan large datasets.

## Solution

Replace the pagination UI with infinite scrolling. The table lives in a fixed-height scrollable container. As the user scrolls toward the bottom, the next batch of results loads automatically and appends to the existing data. A sticky table header keeps column names visible. Inline edits and deletes patch the local data without refetching. Creates prepend optimistically.

## User Stories

1. As a user, I want the table to automatically load more rows when I scroll to the bottom, so that I can browse stock data without clicking page buttons.
2. As a user, I want the table header to remain visible as I scroll down, so that I always know which column I'm reading.
3. As a user, I want to see skeleton placeholder rows while the next batch is loading, so that I know more data is coming.
4. As a user, I want to see 25 skeleton rows on initial page load, so the page structure is immediately apparent before data arrives.
5. As a user, I want to see 5 skeleton rows when loading subsequent batches, so I get a subtle loading indicator without visual noise.
6. As a user, I want the data to reset when I switch between pages (instock/outstock/item/group), so I start fresh on each model.
7. As a user, I want the data to reset when I change my search term, so results reflect my new query from the top.
8. As a user, I want the data to reset when I change sort/filter criteria, so I see correctly ordered results from the beginning.
9. As a user, I want a "scroll to top" button to appear when I've scrolled past the toolbar, so I can quickly return to the search and create controls.
10. As a user, I want the scroll-to-top button to disappear when I'm near the top, so it doesn't clutter the interface unnecessarily.
11. As a user, I want to see the total result count in the toolbar, so I know how many records match my current view/search.
12. As a user, I want to see "All {count} items loaded" text at the bottom when all data has been fetched, so I know I've reached the end.
13. As a user, I want inline edits to update the row in-place without refetching or losing my scroll position, so editing feels seamless.
14. As a user, I want deleting a row to remove it from the list without refetching, so the list stays stable after deletion.
15. As a user, I want newly created rows to appear at the top of the table immediately after saving, so I can confirm my creation worked.
16. As a user, I want the "Move to Outstock" flow to continue working — switching page resets data and pre-fills the create row.
17. As a user, I want the navbar and toolbar to remain naturally visible above the scroll container without needing sticky positioning, so the layout is simple and clean.

## Implementation Decisions

### Modules to modify

- **PageChanger context** — replaces page-number state with accumulated data array. Exposes `loadNextPage()`, `patchRow(id, data)`, `removeRow(id)`, `prependRow(data)`. Tracks `hasMore`, `isLoadingMore`, `totalCount`. Resets accumulated data on page name change, search change, or sort/filter change.

- **Table** — renders inside a fixed-height scrollable `div` (`height: calc(100vh - navbar - toolbar)`). Sticky `<thead>` via `position: sticky; top: 0` within the container. Removes `<Pagination>` component. Renders `ScrollSentinel` after last row. Renders `SkeletonRows` when loading.

- **InlineEditingContext** — after successful PUT, calls `patchRow(id, responseData)` instead of `refreshPage()`. After successful DELETE, calls `removeRow(id)`. After successful POST, calls `prependRow(responseData)`.

- **TableToolbar** — displays `totalCount` as "{count} items" text.

### New modules

- **ScrollSentinel** — renders an invisible `div` observed by IntersectionObserver. Calls `loadNextPage()` on intersection. Disabled when `hasMore` is false or `isLoadingMore` is true.

- **SkeletonRows** — renders animated placeholder `<tr>` elements matching the current table's column count. Accepts `count` prop (25 for initial, 5 for subsequent).

- **ScrollToTopButton** — floating button fixed to bottom-right of scroll container. Visible only when scroll position exceeds ~100px. Smooth-scrolls container to top on click.

### Removed modules

- `Pagination.tsx` — deleted
- `PageNumberDisplayHook.tsx` — deleted
- `PageUpdateHook.tsx` — deleted
- `pagination.css` — deleted (already empty)

### Backend

No changes. Keep offset pagination (`?page=N`), page size 25. Frontend accumulates pages client-side.

### Data flow

1. Page mount → fetch page 1 → set `pageData` to response results, set `totalCount` from response `count`, set `hasMore` from response `next !== null`
2. Scroll sentinel intersects → fetch page N+1 → append results to `pageData`, update `hasMore`
3. Search/sort/page-name change → reset `pageData` to `[]`, reset page to 1, fetch fresh
4. Inline edit → PUT → on success, find row by ID in `pageData`, replace with response
5. Inline delete → DELETE → on success, filter row out of `pageData`
6. Inline create → POST → on success, prepend response to `pageData`, increment `totalCount`

### Scroll container

The table's parent `div` has:
- `overflow-y: auto`
- `height: calc(100vh - {navbar height} - {toolbar height})`
- Contains `<table>` with sticky `<thead>`

IntersectionObserver uses this container as its `root` (not document).

## Testing Decisions

- **ScrollSentinel** — test that callback fires when element intersects (mock IntersectionObserver)
- **PageChanger** — test accumulation logic: appending, resetting on search/page change, patching, removing, prepending
- **SkeletonRows** — test renders correct number of `<tr>` elements with correct column count
- Test patterns: project uses Vitest + @testing-library/react + fast-check property tests. Follow existing patterns in `src/__tests__/` and `src/pages/__tests__/`.

## Out of Scope

- Virtual scrolling / DOM recycling (not needed at current data volumes)
- Cursor-based pagination (offset is sufficient for single-user app)
- Column sorting UI (future feature, but infinite scroll design accommodates it via reset-on-sort)
- Keyboard navigation changes for infinite scroll
- Mobile-specific infinite scroll behavior

## Further Notes

- Edited rows stay in place regardless of sort implications until next reset — matches Airtable/Notion behavior.
- The "scroll to top" button is the primary way users access toolbar/create when scrolled deep — keep it prominent and responsive.
- If data volumes grow significantly (1000+ items loaded in DOM), virtual scrolling can be added later as an optimization without changing the data layer.
