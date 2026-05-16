/// <reference types="vitest/globals" />
import * as fc from 'fast-check'

// Feature: inline-editing, Property 2: Edit-cancel round trip preserves original data

/**
 * Simulates the InlineEditingContext state transitions:
 * - startEditing: copies rowData into editingData
 * - updateField: modifies a field in editingData
 * - cancel: resets editingData to {}
 *
 * The property we verify: after startEditing(data) + arbitrary modifications + cancel(),
 * the editing state is fully reset (editMode='none', editingData={}, editingRowId=null).
 * The original data object is never mutated.
 */

type DataType = { [key: string]: any }
type EditMode = 'none' | 'editing' | 'creating'

type State = {
  editMode: EditMode
  editingRowId: number | null
  editingData: DataType
}

function startEditing(rowData: DataType): State {
  return {
    editMode: 'editing',
    editingRowId: rowData.id ?? null,
    editingData: { ...rowData },
  }
}

function updateField(state: State, fieldName: string, value: any): State {
  return {
    ...state,
    editingData: { ...state.editingData, [fieldName]: value },
  }
}

function cancel(): State {
  return {
    editMode: 'none',
    editingRowId: null,
    editingData: {},
  }
}

// Arbitrary for field names (safe identifiers)
const fieldNameArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => /^[a-z][a-z_]*$/.test(s))

// Arbitrary for DataType objects with an id field
const dataTypeArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
}).chain(base =>
  fc.dictionary(fieldNameArb, fc.oneof(fc.string(), fc.integer(), fc.constant(null)), { minKeys: 0, maxKeys: 10 })
    .map(extra => ({ ...extra, ...base }))
)

// Arbitrary for field modifications (fieldName + new value)
const modificationArb = fc.tuple(
  fieldNameArb,
  fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.boolean())
)

describe('Feature: inline-editing, Property 2: Edit-cancel round trip preserves original data', () => {
  it('cancel always resets state regardless of modifications made', () => {
    fc.assert(
      fc.property(
        dataTypeArb,
        fc.array(modificationArb, { minLength: 0, maxLength: 20 }),
        (originalData, modifications) => {
          // Capture original for mutation check
          const originalCopy = JSON.parse(JSON.stringify(originalData))

          // Start editing
          let state = startEditing(originalData)

          // Apply arbitrary modifications
          for (const [field, value] of modifications) {
            state = updateField(state, field, value)
          }

          // Cancel
          state = cancel()

          // State is fully reset
          expect(state.editMode).toBe('none')
          expect(state.editingRowId).toBeNull()
          expect(state.editingData).toEqual({})

          // Original data was never mutated
          expect(originalData).toEqual(originalCopy)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('startEditing produces a copy, not a reference to original', () => {
    fc.assert(
      fc.property(
        dataTypeArb,
        (originalData) => {
          const state = startEditing(originalData)

          // editingData is a shallow copy, not the same reference
          expect(state.editingData).not.toBe(originalData)
          expect(state.editingData).toEqual(originalData)
          expect(state.editMode).toBe('editing')
          expect(state.editingRowId).toBe(originalData.id)
        }
      ),
      { numRuns: 100 }
    )
  })
})
