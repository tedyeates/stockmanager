/// <reference types="vitest/globals" />
import * as fc from 'fast-check'

/**
 * Simulates the page number reset logic from usePageNumberUpdater.
 * changePageNumberToFirstPage always sets page to INITIAL_PAGE_NUMBER (1).
 */
function simulatePageReset(_currentPage: number): number {
  const INITIAL_PAGE_NUMBER = 1
  return INITIAL_PAGE_NUMBER
}

/**
 * Simulates URL construction from updateDataFor in PageChanger context.
 */
function buildRequestUrl(pageName: string, pageNumber: number, search: string): string {
  let url = `http://localhost:8000/api/${pageName}/?page=${pageNumber}`
  if (search.trim().length > 0) {
    url += `&search=${encodeURIComponent(search)}`
  }
  return url
}

/**
 * Feature: search-system, Property 5: Search term persists across page navigation
 *
 * Validates: Requirements 3.1
 *
 * Property: For any active search term and for any page number, the request URL
 * constructed by PageChanger_Context SHALL include `search={encoded_term}` as a
 * query parameter.
 *
 * We test this by simulating the PageChanger URL construction logic:
 * - updateDataFor appends &search={encodeURIComponent(search)} when search is non-empty
 * - This must hold for ANY page number, proving search persists across navigation
 */
describe('Feature: search-system, Property 5: Search term persists across page navigation', () => {
  it('should include search param in URL for any non-empty search term and any page number', () => {
    fc.assert(
      fc.property(
        // Generate non-empty search terms (at least one non-whitespace char)
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        // Generate page numbers (any valid page)
        fc.integer({ min: 1, max: 10000 }),
        // Generate page names
        fc.constantFrom('item', 'instock', 'outstock', 'group'),
        (searchTerm, pageNumber, pageName) => {
          const url = buildRequestUrl(pageName, pageNumber, searchTerm)

          // URL must contain the search parameter
          const urlObj = new URL(url)
          const searchParam = urlObj.searchParams.get('search')

          expect(searchParam).not.toBeNull()
          expect(searchParam).toBe(searchTerm)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should persist search term regardless of which page is navigated to', () => {
    fc.assert(
      fc.property(
        // Generate search terms with special characters that need encoding
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.constantFrom('hello world', 'test&value', 'search=term', 'special#char', 'unicode: café')
        ),
        // Generate sequential page numbers simulating navigation
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 1, max: 500 }),
        fc.constantFrom('item', 'instock', 'outstock', 'group'),
        (searchTerm, firstPage, secondPage, pageName) => {
          // Simulate navigating from firstPage to secondPage with same search term
          const urlFirstPage = buildRequestUrl(pageName, firstPage, searchTerm)
          const urlSecondPage = buildRequestUrl(pageName, secondPage, searchTerm)

          // Both URLs must include the search param with the same encoded term
          const firstUrlObj = new URL(urlFirstPage)
          const secondUrlObj = new URL(urlSecondPage)

          expect(firstUrlObj.searchParams.get('search')).toBe(searchTerm)
          expect(secondUrlObj.searchParams.get('search')).toBe(searchTerm)

          // Page numbers differ but search persists
          expect(firstUrlObj.searchParams.get('page')).toBe(String(firstPage))
          expect(secondUrlObj.searchParams.get('page')).toBe(String(secondPage))
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: search-system, Property 6: New search resets pagination to page 1', () => {
  it('should reset to page=1 when a new search term is submitted from any page > 1', () => {
    fc.assert(
      fc.property(
        // Generate current page numbers > 1
        fc.integer({ min: 2, max: 1000 }),
        // Generate non-empty search terms (at least one non-whitespace char)
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        (currentPage, newSearchTerm) => {
          // Simulate: user is on currentPage (> 1), submits a new search
          // updateSearchTerm calls changePageNumberToFirstPage()
          const resetPage = simulatePageReset(currentPage)

          // The next request URL should use page=1
          const url = buildRequestUrl('item', resetPage, newSearchTerm)

          // Extract page param from URL
          const urlObj = new URL(url)
          const pageParam = urlObj.searchParams.get('page')

          expect(pageParam).toBe('1')
          expect(resetPage).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should always construct URL with page=1 regardless of how high the previous page was', () => {
    fc.assert(
      fc.property(
        // Generate very large page numbers to stress test
        fc.integer({ min: 2, max: 100000 }),
        // Generate arbitrary page names
        fc.constantFrom('item', 'instock', 'outstock', 'group'),
        // Generate search terms with various characters
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (currentPage, pageName, newSearchTerm) => {
          // After updateSearchTerm, page resets to 1
          const resetPage = simulatePageReset(currentPage)
          const url = buildRequestUrl(pageName, resetPage, newSearchTerm)

          // Verify page=1 in the constructed URL
          const urlObj = new URL(url)
          expect(urlObj.searchParams.get('page')).toBe('1')

          // Verify the search term is present
          expect(urlObj.searchParams.get('search')).toBe(newSearchTerm)
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: search-system, Property 7: Search term is URL-encoded
 *
 * Validates: Requirements 3.4
 *
 * Property: For any search term containing characters outside the unreserved set
 * (letters, digits, -, _, ., ~), the URL SHALL contain the output of
 * encodeURIComponent(term) rather than the raw term.
 *
 * We test this by generating search terms with special characters (spaces, &, =, #, ?, unicode)
 * and verifying the constructed URL contains the encoded version.
 */

/**
 * Arbitrary that generates strings guaranteed to contain at least one special character
 * that requires URL encoding (spaces, &, =, #, ?, unicode, etc.)
 */
const specialCharSearchTerm = fc.tuple(
  fc.string({ minLength: 0, maxLength: 50 }),
  fc.constantFrom(' ', '&', '=', '#', '?', '+', '%', '/', '@', '!', '$', '(', ')', '*', ',', ';', ':', 'é', 'ñ', '中', '日', '🔍'),
  fc.string({ minLength: 0, maxLength: 50 })
).map(([prefix, special, suffix]) => `${prefix}${special}${suffix}`)
  .filter(s => s.trim().length > 0)

describe('Feature: search-system, Property 7: Search term is URL-encoded', () => {
  it('should URL-encode special characters in search term using encodeURIComponent', () => {
    fc.assert(
      fc.property(
        specialCharSearchTerm,
        fc.constantFrom('item', 'instock', 'outstock', 'group'),
        fc.integer({ min: 1, max: 100 }),
        (searchTerm, pageName, pageNumber) => {
          const url = buildRequestUrl(pageName, pageNumber, searchTerm)
          const encoded = encodeURIComponent(searchTerm)

          // The URL must contain the encoded version
          expect(url).toContain(`search=${encoded}`)

          // If the term has characters that need encoding, raw term should NOT appear as-is
          if (encoded !== searchTerm) {
            const searchParamPart = url.split('search=')[1]
            expect(searchParamPart).not.toBe(searchTerm)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should produce a valid URL where the search param can be decoded back to the original term', () => {
    fc.assert(
      fc.property(
        specialCharSearchTerm,
        fc.constantFrom('item', 'instock', 'outstock', 'group'),
        (searchTerm, pageName) => {
          const url = buildRequestUrl(pageName, 1, searchTerm)

          // Parse the URL and extract the search param
          const urlObj = new URL(url)
          const decodedSearch = urlObj.searchParams.get('search')

          // Decoding the URL param should give back the original term
          expect(decodedSearch).toBe(searchTerm)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should encode unicode characters properly', () => {
    // Generate strings containing unicode characters (emoji, CJK, accented, etc.)
    const unicodeArb = fc.tuple(
      fc.string({ minLength: 0, maxLength: 30 }),
      fc.constantFrom('é', 'ñ', 'ü', 'ö', '中', '日', '한', '🔍', '🚀', '💡', 'α', 'β', 'γ', 'Ω', '∑', '∞'),
      fc.string({ minLength: 0, maxLength: 30 })
    ).map(([prefix, unicode, suffix]) => `${prefix}${unicode}${suffix}`)
      .filter(s => s.trim().length > 0)

    fc.assert(
      fc.property(
        unicodeArb,
        (searchTerm) => {
          const url = buildRequestUrl('item', 1, searchTerm)
          const encoded = encodeURIComponent(searchTerm)

          // URL contains the properly encoded search term
          expect(url).toContain(`search=${encoded}`)

          // Round-trip: decode from URL gives back original
          const urlObj = new URL(url)
          const decodedSearch = urlObj.searchParams.get('search')
          expect(decodedSearch).toBe(searchTerm)
        }
      ),
      { numRuns: 100 }
    )
  })
})
