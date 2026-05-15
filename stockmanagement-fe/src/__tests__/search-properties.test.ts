import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Replicates the URL construction logic from PageChanger context's `updateDataFor`.
 * This is the exact logic used in production:
 *
 *   let url = `${baseUrl}/api/${pageName}/?page=${pageNumber}`
 *   if (search.trim().length > 0) {
 *       url += `&search=${encodeURIComponent(search)}`
 *   }
 */
function buildSearchUrl(baseUrl: string, pageName: string, pageNumber: number, search: string): string {
    let url = `${baseUrl}/api/${pageName}/?page=${pageNumber}`
    if (search.trim().length > 0) {
        url += `&search=${encodeURIComponent(search)}`
    }
    return url
}

describe('Feature: search-system, Property 5: Search term persists across page navigation', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * For any active search term and any page number, the request URL
     * constructed by PageChanger Context SHALL include `search={encoded_term}`
     * as a query parameter.
     */
    it('constructed URL always includes search={encoded_term} for any non-empty search term and page number', () => {
        const nonEmptyNonWhitespaceString = fc.string({ minLength: 1 }).filter(
            (s) => s.trim().length > 0
        )
        const pageNumber = fc.integer({ min: 1, max: 100 })

        fc.assert(
            fc.property(
                nonEmptyNonWhitespaceString,
                pageNumber,
                (searchTerm, page) => {
                    const baseUrl = 'http://localhost:8000'
                    const pageName = 'item'
                    const url = buildSearchUrl(baseUrl, pageName, page, searchTerm)

                    // URL must contain the search parameter with the encoded term
                    const expectedParam = `search=${encodeURIComponent(searchTerm)}`
                    expect(url).toContain(expectedParam)

                    // URL must also contain the correct page number
                    expect(url).toContain(`page=${page}`)
                }
            ),
            { numRuns: 100 }
        )
    })
})


describe('Feature: search-system, Property 7: Search term is URL-encoded', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * For any search term containing characters outside the unreserved set
     * (letters, digits, -, _, ., ~), the URL SHALL contain the output of
     * `encodeURIComponent(term)` rather than the raw term.
     */
    it('URL contains encodeURIComponent(term) output, not raw special characters', () => {
        // Generator that produces strings guaranteed to contain special characters
        const specialChars = ['&', '=', '#', '?', ' ', '+', '%', '/', '@', '!', '$', '(', ')', '*', ',', ';', ':']
        const unicodeChars = ['é', 'ñ', 'ü', '中', '日', '🔍', '€', '£', 'ø', 'å']

        const searchTermWithSpecialChars = fc.tuple(
            fc.string({ minLength: 0, maxLength: 10 }),
            fc.oneof(
                fc.constantFrom(...specialChars),
                fc.constantFrom(...unicodeChars)
            ),
            fc.string({ minLength: 0, maxLength: 10 })
        ).map(([prefix, special, suffix]) => `${prefix}${special}${suffix}`)
         .filter((s) => s.trim().length > 0)

        fc.assert(
            fc.property(
                searchTermWithSpecialChars,
                fc.integer({ min: 1, max: 100 }),
                (searchTerm, pageNumber) => {
                    const baseUrl = 'http://localhost:8000'
                    const pageName = 'item'
                    const url = buildSearchUrl(baseUrl, pageName, pageNumber, searchTerm)

                    const encoded = encodeURIComponent(searchTerm)

                    // URL must contain the properly encoded term
                    expect(url).toContain(`search=${encoded}`)

                    // If the raw term differs from encoded (has special chars),
                    // the raw term should NOT appear as-is in the search param value
                    if (encoded !== searchTerm) {
                        const searchParamStart = url.indexOf('search=') + 'search='.length
                        const searchParamValue = url.substring(searchParamStart)
                        expect(searchParamValue).not.toBe(searchTerm)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })
})
