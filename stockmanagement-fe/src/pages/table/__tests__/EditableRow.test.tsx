// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { EditableRow } from '../EditableRow'
import { FieldsDataType } from 'util/types/PageTypes'

/**
 * Unit tests for EditableRow component
 * Feature: inline-editing
 * Validates: Requirements 1.3, 2.3, 5.3, 7.1
 */

// Mock InlineEditingContext
const mockSave = vi.fn()
const mockCancel = vi.fn()
const mockUpdateField = vi.fn()
const mockMoveToOutstock = vi.fn()

vi.mock('pages/context/InlineEditingContext', () => ({
    useInlineEditing: () => ({
        editingData: { item: 'Widget', quantity: '5', stock_date: '2024-01-01' },
        validationErrors: {},
        isSaving: false,
        updateField: mockUpdateField,
        save: mockSave,
        cancel: mockCancel,
        moveToOutstock: mockMoveToOutstock,
    }),
}))

vi.mock('pages/context/PageChanger', () => ({
    usePageTypeChanger: () => ({
        tableLoader: { changePageTo: vi.fn() },
    }),
}))

vi.mock('../ModelAutocomplete', () => ({
    default: () => <div data-testid="mock-autocomplete" />,
}))

const mockModalInputs: FieldsDataType = [
    { fieldName: 'id', fieldType: 'AutoField', fieldChoices: [] },
    { fieldName: 'item', fieldType: 'ForeignKey', fieldChoices: [] },
    { fieldName: 'quantity', fieldType: 'IntegerField', fieldChoices: [] },
    { fieldName: 'stock_date', fieldType: 'DateField', fieldChoices: [] },
]

const mockDataColumns = ['id', 'item', 'quantity', 'stock_date']

describe('EditableRow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Save and Cancel buttons rendered in edit mode', () => {
        it('renders Save button', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            expect(screen.getByText('Save')).toBeDefined()
        })

        it('renders Cancel button', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            expect(screen.getByText('Cancel')).toBeDefined()
        })

        it('Save button calls save with correct args', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            fireEvent.click(screen.getByText('Save'))
            expect(mockSave).toHaveBeenCalledWith('instock', mockModalInputs)
        })

        it('Cancel button calls cancel', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            fireEvent.click(screen.getByText('Cancel'))
            expect(mockCancel).toHaveBeenCalled()
        })
    })

    describe('Move to Outstock button', () => {
        it('shows Move to Outstock button for instock pages when not new row', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            expect(screen.getByText('Move to Outstock')).toBeDefined()
        })

        it('does NOT show Move to Outstock button for non-instock pages', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="item" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            expect(screen.queryByText('Move to Outstock')).toBeNull()
        })

        it('does NOT show Move to Outstock button for new rows', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={true} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            expect(screen.queryByText('Move to Outstock')).toBeNull()
        })

        it('Move to Outstock button calls moveToOutstock', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            fireEvent.click(screen.getByText('Move to Outstock'))
            expect(mockMoveToOutstock).toHaveBeenCalled()
        })
    })

    describe('Escape key triggers cancel', () => {
        it('pressing Escape on an input calls cancel', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            const quantityInput = screen.getByDisplayValue('5')
            fireEvent.keyDown(quantityInput, { key: 'Escape' })
            expect(mockCancel).toHaveBeenCalled()
        })
    })

    describe('AutoField fields are excluded', () => {
        it('does not render an input for AutoField (id)', () => {
            render(
                <table><tbody>
                    <EditableRow modalInputs={mockModalInputs} currentPageName="instock" isNewRow={false} dataColumns={mockDataColumns} />
                </tbody></table>
            )
            // id field should not be rendered as an input
            expect(screen.queryByRole('spinbutton', { name: /id/i })).toBeNull()
        })
    })
})
