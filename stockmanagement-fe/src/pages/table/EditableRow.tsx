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
}

export function EditableRow({ modalInputs, currentPageName, isNewRow }: EditableRowProps) {
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

    return (
        <tr className="table-row bg-blue-50">
            {editableFields.map((field, index) => (
                <EditableCell
                    key={field.fieldName}
                    fieldName={field.fieldName}
                    fieldType={field.fieldType}
                    fieldChoices={field.fieldChoices}
                    value={editingData[field.fieldName]}
                    error={validationErrors[field.fieldName]}
                    onChange={updateField}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    inputRef={inputRefs.current[index]}
                />
            ))}
            <td className="table-cell text-left p-1 border dark-outline background-color whitespace-nowrap">
                <button
                    className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 mr-1 disabled:opacity-50"
                    onClick={() => save(currentPageName, modalInputs)}
                    disabled={isSaving}
                >
                    {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                    className="px-2 py-1 text-xs font-medium text-white bg-gray-500 rounded hover:bg-gray-600 mr-1"
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
            </td>
        </tr>
    )
}
