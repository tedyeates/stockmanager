import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { extractOutstockFields, OUTSTOCK_COPY_FIELDS } from 'util/moveToOutstock'

// Feature: inline-editing, Property 6: Move-to-outstock field extraction

const instockFieldNames = [
  'id', 'item', 'quantity', 'stock_date', 'notes', 'store_type', 'job',
  'invoice_id', 'price', 'purchase_order_id', 'supplier', 'quantity_left'
]

const instockDataArb = fc.record(
  Object.fromEntries(
    instockFieldNames.map(name => [
      name,
      fc.oneof(fc.string({ minLength: 1 }), fc.integer({ min: 1, max: 9999 }), fc.constant(null))
    ])
  ),
  { requiredKeys: [] }
)

describe('Feature: inline-editing, Property 6: Move-to-outstock field extraction', () => {
  it('result contains only OUTSTOCK_COPY_FIELDS keys present in source, with matching values', () => {
    fc.assert(
      fc.property(
        instockDataArb,
        (instockData) => {
          const result = extractOutstockFields(instockData)

          // Only allowed keys present
          for (const key of Object.keys(result)) {
            expect(OUTSTOCK_COPY_FIELDS).toContain(key)
          }

          // All copy fields present in source are in result with same value
          for (const field of OUTSTOCK_COPY_FIELDS) {
            if (field in instockData) {
              expect(result[field]).toBe(instockData[field])
            } else {
              expect(result).not.toHaveProperty(field)
            }
          }

          // Excluded fields never present
          const excluded = ['id', 'invoice_id', 'price', 'purchase_order_id', 'supplier', 'quantity_left']
          for (const field of excluded) {
            expect(result).not.toHaveProperty(field)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
