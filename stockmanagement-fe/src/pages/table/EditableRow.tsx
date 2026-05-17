import { useRef, useCallback, createRef } from "react"
import { FieldsDataType, PageName } from "util/types/PageTypes"
import { getEditableFields } from "util/fieldMapper"
import { getNavigationAction } from "util/keyboardNavigation"
import { useInlineEditing } from "pages/context/InlineEditingContext"
import { usePageTypeChanger } from "pages/context/PageChanger"
import { EditableCell } from "./EditableCell"

type EditableRowProps = {
    modalInputs: FieldsDataType
    currentPageName: PageName
    isNewRow: boolean
    dataColumns: string[]
}

export function EditableRow({ modalInputs, currentPageName, isNewRow, dataColumns }: EditableRowProps) {
    const { editingData, validationErrors, isSaving, updateField, save, cancel, moveToOutstock } = useInlineEditing()
    const { tableLoader } = usePageTypeChanger()

    const editableFields = getEditableFields(modalInputs)
    const inputRefs = useRef<React.RefObject<HTMLInputElement | HTMLElement>[]>(
        editableFields.map(() => createRef<HTMLInputElement | HTMLElement>())
    )

    // Keep refs array in sync with field count
    if (inputRefs.current.length !== editableFields.length) {
        inputRefs.current = editableFields.map(() => createRef<HTMLInputElement | HTMLElement>())
    }

    const focusField = useCallback((index: number) => {
        const ref = inputRefs.current[index]
        if (ref?.current) {
            (ref.current as HTMLElement).focus()
        }
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent, fieldIndex: number) => {
        const action = getNavigationAction(e, fieldIndex, editableFields.length)
        if (action === 'none') return

        e.preventDefault()
        switch (action) {
            case 'next':
                focusField(fieldIndex + 1)
                break
            case 'previous':
                focusField(fieldIndex - 1)
                break
            case 'save':
                save(currentPageName, modalInputs)
                break
            case 'cancel':
                cancel()
                break
        }
    }, [editableFields.length, focusField, save, cancel, currentPageName, modalInputs])

    const handleMoveToOutstock = useCallback(() => {
        moveToOutstock(editingData, tableLoader.changePageTo)
    }, [editingData, moveToOutstock, tableLoader.changePageTo])

    // Build a set of editable field names for quick lookup
    const editableFieldMap = new Map(editableFields.map((field, idx) => [field.fieldName, { field, idx }]))

    const actionButtons = (
        <div className="absolute right-2 top-full z-10 mt-0.5 flex gap-1 whitespace-nowrap bg-white shadow-md rounded px-2 py-1 border border-gray-200">
            <button
                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                onClick={() => save(currentPageName, modalInputs)}
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save"}
            </button>
            <button
                className="px-2 py-1 text-xs font-medium text-white bg-gray-500 rounded hover:bg-gray-600"
                onClick={cancel}
            >
                Cancel
            </button>
            {currentPageName === 'instock' && !isNewRow && (
                <button
                    className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    onClick={handleMoveToOutstock}
                >
                    Move to Outstock
                </button>
            )}
        </div>
    )

    return (
        <tr className="relative bg-blue-50">
            {/* Render cells matching data column order */}
            {dataColumns.map((colKey) => {
                const entry = editableFieldMap.get(colKey)
                if (entry) {
                    const { field, idx } = entry
                    return (
                        <EditableCell
                            key={field.fieldName}
                            fieldName={field.fieldName}
                            fieldType={field.fieldType}
                            fieldChoices={field.fieldChoices}
                            value={editingData[field.fieldName]}
                            error={validationErrors[field.fieldName]}
                            onChange={updateField}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            inputRef={inputRefs.current[idx]}
                        />
                    )
                }
                let displayValue = editingData[colKey] ?? ''
                if (Array.isArray(displayValue)) {
                    displayValue = displayValue.join(colKey === 'size' ? ' x ' : ', ')
                } else if (displayValue !== null && typeof displayValue === 'object') {
                    displayValue = displayValue.name || displayValue.code || ''
                }
                return <td key={`readonly-${colKey}`} className="table-cell text-left p-2 border dark-outline background-color text-gray-500">{displayValue}</td>
            })}
            {/* Total Price placeholder for instock pages */}
            {currentPageName === 'instock' && (
                <td className="table-cell p-2 border dark-outline background-color relative">
                    {actionButtons}
                </td>
            )}
            {/* For non-instock pages, anchor actions to last cell */}
            {currentPageName !== 'instock' && (
                <td className="p-0 border-0 relative" style={{width: 0, overflow: 'visible'}}>
                    {actionButtons}
                </td>
            )}
        </tr>
    )
}
