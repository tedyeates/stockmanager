import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateRow, mapServerErrors } from 'util/validation'
import { FieldsDataTypeRow } from 'util/types/PageTypes'

// Feature: inline-editing, Property 3: Client-side validation correctly identifies invalid fields
// Feature: inline-editing, Property 4: Server error response mapping

const editableFieldTypeArb = fc.constantFrom(
  'CharField', 'TextField', 'IntegerField', 'DecimalField', 'DateField', 'ChoiceField', 'ForeignKey'
)

const fieldRowArb: fc.Arbitrary<FieldsDataTypeRow> = fc.record({
  fieldName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z][a-z_]*$/.test(s)),
  fieldType: editableFieldTypeArb,
  fieldChoices: fc.array(fc.string(), { maxLength: 5 }),
})

describe('Feature: inline-editing, Property 3: Client-side validation correctly identifies invalid fields', () => {
  it('returns error for every empty required field and no errors for filled fields', () => {
    fc.assert(
      fc.property(
        fc.array(fieldRowArb, { minLength: 1, maxLength: 10 }).filter(
          fields => new Set(fields.map(f => f.fieldName)).size === fields.length
        ),
        fc.func(fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.string({ minLength: 1 }), fc.integer({ min: 1, max: 999 }))),
        (fields, valueFn) => {
          const rowData: Record<string, any> = {}
          for (let i = 0; i < fields.length; i++) {
            rowData[fields[i].fieldName] = valueFn(i as any)
          }

          const result = validateRow(rowData, fields)

          for (const field of fields) {
            const value = rowData[field.fieldName]
            const isEmpty = value === undefined || value === null || value === ''

            if (isEmpty) {
              expect(result.errors).toHaveProperty(field.fieldName)
            } else if (
              (field.fieldType === 'IntegerField' || field.fieldType === 'DecimalField') &&
              isNaN(Number(value))
            ) {
              expect(result.errors).toHaveProperty(field.fieldName)
            } else {
              expect(result.errors).not.toHaveProperty(field.fieldName)
            }
          }

          const hasErrors = Object.keys(result.errors).length > 0
          expect(result.isValid).toBe(!hasErrors)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: inline-editing, Property 4: Server error response mapping', () => {
  it('maps every field in server response to a non-empty error string', () => {
    const serverResponseArb = fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z_]+$/.test(s) && s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 })
    )

    fc.assert(
      fc.property(
        serverResponseArb,
        (serverResponse) => {
          const result = mapServerErrors(serverResponse)

          for (const field of Object.keys(serverResponse)) {
            expect(result).toHaveProperty(field)
            expect(result[field].length).toBeGreaterThan(0)
            expect(result[field]).toBe(serverResponse[field][0])
          }

          for (const field of Object.keys(result)) {
            expect(serverResponse).toHaveProperty(field)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
