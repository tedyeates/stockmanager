import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { mapFieldTypeToControl, getEditableFields, InputControlType } from 'util/fieldMapper'
import { FieldsDataTypeRow } from 'util/types/PageTypes'

// Feature: inline-editing, Property 1: Field schema to editable controls mapping

const KNOWN_TYPES: Record<string, InputControlType> = {
  AutoField: 'hidden',
  IntegerField: 'number',
  DecimalField: 'decimal',
  DateField: 'date',
  ChoiceField: 'select',
  ForeignKey: 'autocomplete',
}

const fieldTypeArb = fc.oneof(
  fc.constantFrom('AutoField', 'IntegerField', 'DecimalField', 'DateField', 'ChoiceField', 'ForeignKey'),
  fc.constantFrom('CharField', 'TextField', 'EmailField', 'URLField', 'SlugField', 'UnknownField')
)

const fieldRowArb: fc.Arbitrary<FieldsDataTypeRow> = fc.record({
  fieldName: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  fieldType: fieldTypeArb,
  fieldChoices: fc.array(fc.string(), { maxLength: 5 }),
})

describe('Feature: inline-editing, Property 1: Field schema to editable controls mapping', () => {
  it('getEditableFields excludes all AutoField entries', () => {
    fc.assert(
      fc.property(
        fc.array(fieldRowArb, { minLength: 0, maxLength: 20 }),
        (fields) => {
          const result = getEditableFields(fields)
          expect(result.every(f => f.fieldType !== 'AutoField')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('getEditableFields preserves all non-excluded entries', () => {
    fc.assert(
      fc.property(
        fc.array(fieldRowArb, { minLength: 0, maxLength: 20 }),
        (fields) => {
          const result = getEditableFields(fields)
          const expected = fields.filter(f => f.fieldType !== 'AutoField' && f.fieldName !== 'modified')
          expect(result).toEqual(expected)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('mapFieldTypeToControl returns correct InputControlType for all field types', () => {
    fc.assert(
      fc.property(
        fieldTypeArb,
        (fieldType) => {
          const result = mapFieldTypeToControl(fieldType)
          const expected = KNOWN_TYPES[fieldType] ?? 'text'
          expect(result).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })
})
