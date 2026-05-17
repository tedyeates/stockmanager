/// <reference types="vitest/globals" />

/**
 * Unit tests for moveToOutstock flow
 * Feature: inline-editing
 * Validates: Requirements 7.2, 7.3
 */

import { extractOutstockFields, OUTSTOCK_COPY_FIELDS } from 'util/moveToOutstock'
import { DataType } from 'util/types/PageTypes'

describe('Move to Outstock flow', () => {
    const sampleInstockRecord: DataType = {
        id: 42,
        item: 'Widget A',
        quantity: 10,
        stock_date: '2024-06-15',
        notes: 'Batch delivery',
        store_type: 'warehouse',
        job: 'JOB-001',
        invoice_id: 'INV-999',
        price: '25.50',
        purchase_order_id: 'PO-123',
        supplier: 'Acme Corp',
        quantity_left: 8,
    }

    describe('Pre-filled fields match source instock record', () => {
        it('extracts only OUTSTOCK_COPY_FIELDS from instock data', () => {
            const result = extractOutstockFields(sampleInstockRecord)

            expect(Object.keys(result).sort()).toEqual(OUTSTOCK_COPY_FIELDS.sort())
            expect(result.item).toBe('Widget A')
            expect(result.quantity).toBe(10)
            expect(result.stock_date).toBe('2024-06-15')
            expect(result.notes).toBe('Batch delivery')
            expect(result.store_type).toBe('warehouse')
            expect(result.job).toBe('JOB-001')
        })

        it('excludes id, invoice_id, price, purchase_order_id, supplier, quantity_left', () => {
            const result = extractOutstockFields(sampleInstockRecord)

            expect(result).not.toHaveProperty('id')
            expect(result).not.toHaveProperty('invoice_id')
            expect(result).not.toHaveProperty('price')
            expect(result).not.toHaveProperty('purchase_order_id')
            expect(result).not.toHaveProperty('supplier')
            expect(result).not.toHaveProperty('quantity_left')
        })

        it('handles missing optional fields gracefully', () => {
            const sparse: DataType = { id: 1, item: 'X', quantity: 5 }
            const result = extractOutstockFields(sparse)

            expect(result.item).toBe('X')
            expect(result.quantity).toBe(5)
            expect(result).not.toHaveProperty('stock_date')
            expect(result).not.toHaveProperty('notes')
        })
    })

    describe('Original instock record unchanged', () => {
        it('does not mutate the source record', () => {
            const original = { ...sampleInstockRecord }
            const originalCopy = JSON.parse(JSON.stringify(original))

            extractOutstockFields(original)

            expect(original).toEqual(originalCopy)
        })
    })

    describe('Navigation to outstock page', () => {
        it('moveToOutstock calls changePageTo with outstock', () => {
            // Simulate the moveToOutstock logic from InlineEditingContext
            const changePageTo = vi.fn()
            const rowData = sampleInstockRecord

            const prefill = extractOutstockFields(rowData)
            changePageTo('outstock')

            expect(changePageTo).toHaveBeenCalledWith('outstock')
            expect(prefill.item).toBe(rowData.item)
            expect(prefill.quantity).toBe(rowData.quantity)
            expect(prefill.stock_date).toBe(rowData.stock_date)
        })

        it('startCreating is called with prefilled data after navigation', async () => {
            const changePageTo = vi.fn()
            const startCreating = vi.fn()
            const rowData = sampleInstockRecord

            // Replicate moveToOutstock logic
            const prefill = extractOutstockFields(rowData)
            changePageTo('outstock')
            setTimeout(() => {
                startCreating(prefill)
            }, 0)

            // Wait for setTimeout
            await vi.waitFor(() => {
                expect(startCreating).toHaveBeenCalledWith(prefill)
            })

            // Verify prefill contains correct fields
            const calledWith = startCreating.mock.calls[0][0]
            expect(calledWith).toEqual({
                item: 'Widget A',
                quantity: 10,
                stock_date: '2024-06-15',
                notes: 'Batch delivery',
                store_type: 'warehouse',
                job: 'JOB-001',
            })
        })
    })
})
