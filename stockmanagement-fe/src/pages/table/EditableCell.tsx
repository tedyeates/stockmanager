import { forwardRef, useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import ModelAutocomplete from "./ModelAutocomplete"
import { mapFieldTypeToControl } from "util/fieldMapper"
import { title } from "util/strings"

type EditableCellProps = {
    fieldName: string
    fieldType: string
    fieldChoices: string[]
    value: any
    error: string | undefined
    onChange: (fieldName: string, value: any) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    inputRef: React.RefObject<HTMLInputElement | HTMLElement>
}

export const EditableCell = forwardRef<HTMLTableCellElement, EditableCellProps>(
    function EditableCell({ fieldName, fieldType, fieldChoices, value, error, onChange, onKeyDown, inputRef }, ref) {
        const [showTooltip, setShowTooltip] = useState(false)
        const controlType = mapFieldTypeToControl(fieldType)

        const borderClass = error ? "border-2 border-red-500" : "border border-gray-300"
        const baseInputClass = `w-full px-2 py-1 text-sm rounded ${borderClass} focus:outline-none focus:ring-1 focus:ring-blue-500`

        function renderInput() {
            switch (controlType) {
                case 'number':
                    return (
                        <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            type="number"
                            name={fieldName}
                            className={baseInputClass}
                            value={value ?? ''}
                            onChange={e => onChange(fieldName, e.target.value)}
                            onKeyDown={onKeyDown}
                        />
                    )
                case 'decimal':
                    return (
                        <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            type="number"
                            step=".01"
                            name={fieldName}
                            className={baseInputClass}
                            value={value ?? ''}
                            onChange={e => onChange(fieldName, e.target.value)}
                            onKeyDown={onKeyDown}
                        />
                    )
                case 'date': {
                    let selected: Date | null = null
                    if (value) {
                        const [year, month, day] = value.split('-')
                        selected = new Date(Number(year), Number(month) - 1, Number(day))
                    }
                    return (
                        <DatePicker
                            dateFormat="dd/MM/yyyy"
                            name={fieldName}
                            selected={selected}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                    onChange(fieldName, formatted)
                                } else {
                                    onChange(fieldName, '')
                                }
                            }}
                            customInput={
                                <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    aria-label={fieldName}
                                    className={baseInputClass}
                                    onKeyDown={onKeyDown}
                                />
                            }
                        />
                    )
                }
                case 'select':
                    return (
                        <select
                            ref={inputRef as React.RefObject<HTMLSelectElement>}
                            name={fieldName}
                            className={baseInputClass}
                            value={value ?? ''}
                            onChange={e => onChange(fieldName, e.target.value)}
                            onKeyDown={onKeyDown}
                        >
                            <option value="">--</option>
                            {fieldChoices.map(choice => (
                                <option key={choice} value={choice}>{title(choice)}</option>
                            ))}
                        </select>
                    )
                case 'autocomplete':
                    return (
                        <div onKeyDown={onKeyDown}>
                            <ModelAutocomplete
                                modelType={fieldName}
                                value={value ?? null}
                                onChange={(_fieldName, _fieldType, newValue) => onChange(fieldName, newValue)}
                            />
                        </div>
                    )
                case 'hidden':
                    return null
                default:
                    return (
                        <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            type="text"
                            name={fieldName}
                            className={baseInputClass}
                            value={value ?? ''}
                            onChange={e => onChange(fieldName, e.target.value)}
                            onKeyDown={onKeyDown}
                        />
                    )
            }
        }

        if (controlType === 'hidden') return null

        return (
            <td
                ref={ref}
                className="table-cell text-left p-1 border dark-outline background-color relative"
                onMouseEnter={() => error && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => error && setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
            >
                {renderInput()}
                {error && showTooltip && (
                    <div className="absolute z-50 bottom-full left-0 mb-1 px-2 py-1 text-xs text-white bg-red-600 rounded shadow whitespace-nowrap">
                        {error}
                    </div>
                )}
            </td>
        )
    }
)
