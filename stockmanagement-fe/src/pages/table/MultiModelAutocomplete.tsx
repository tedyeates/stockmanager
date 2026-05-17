import { useCallback, useEffect, useRef, useState } from "react"
import { Requests } from "util/requests"
import { useAuth } from "pages/context/Login"
import { DataType } from "util/types/PageTypes"
import "styles/forms.css"

type AutocompleteValue = DataType & {
    id?: number
    name?: string
    code?: string
    job_id?: string
}

type MultiModelAutocompleteProps = {
    modelType: string
    value: AutocompleteValue[] | string[] | null
    onChange: (fieldName: string, fieldType: string, newValue: AutocompleteValue[]) => void
}

function getLabel(option: AutocompleteValue | string): string {
    if (typeof option === 'string') return option
    return option.name ?? option.code ?? option.job_id ?? ''
}

function getKey(option: AutocompleteValue | string, idx: number): string | number {
    if (typeof option === 'string') return option
    return option.id ?? option.job_id ?? idx
}

export default function MultiModelAutocomplete({ modelType, value, onChange }: MultiModelAutocompleteProps) {
    const auth = useAuth()

    const selected: AutocompleteValue[] = normalizeValue(value)

    const [inputValue, setInputValue] = useState('')
    const [options, setOptions] = useState<AutocompleteValue[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const [isLoading, setIsLoading] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    function normalizeValue(val: AutocompleteValue[] | string[] | null): AutocompleteValue[] {
        if (!val || !Array.isArray(val)) return []
        return val.map(v => {
            if (typeof v === 'string') return { job_id: v } as AutocompleteValue
            return v
        })
    }

    const fetchOptions = useCallback(async (searchTerm: string) => {
        setIsLoading(true)
        try {
            const url = `${import.meta.env.VITE_BASE_URL}/api/${modelType}/?search=${encodeURIComponent(searchTerm)}`
            const data = await Requests.get(url, auth.authHeader.current)
            setOptions(data.results ?? [])
        } catch {
            setOptions([])
        } finally {
            setIsLoading(false)
        }
    }, [modelType, auth.authHeader])

    useEffect(() => {
        fetchOptions('')
    }, [fetchOptions])

    function isSelected(option: AutocompleteValue): boolean {
        return selected.some(s =>
            (s.id != null && s.id === option.id) ||
            (s.job_id != null && s.job_id === option.job_id)
        )
    }

    function toggleOption(option: AutocompleteValue) {
        let newSelected: AutocompleteValue[]
        if (isSelected(option)) {
            newSelected = selected.filter(s =>
                !((s.id != null && s.id === option.id) || (s.job_id != null && s.job_id === option.job_id))
            )
        } else {
            newSelected = [...selected, option]
        }
        onChange(modelType, 'array', newSelected)
    }

    function removeChip(option: AutocompleteValue) {
        const newSelected = selected.filter(s =>
            !((s.id != null && s.id === option.id) || (s.job_id != null && s.job_id === option.job_id))
        )
        onChange(modelType, 'array', newSelected)
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value
        setInputValue(val)
        setIsOpen(true)
        setHighlightIndex(-1)

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            fetchOptions(val)
        }, 200)
    }

    function handleFocus() {
        setIsOpen(true)
        if (options.length === 0) fetchOptions(inputValue)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true)
                e.preventDefault()
            }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightIndex(prev => Math.min(prev + 1, options.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightIndex(prev => Math.max(prev - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (highlightIndex >= 0 && highlightIndex < options.length) {
                    toggleOption(options[highlightIndex])
                }
                break
            case 'Escape':
                setIsOpen(false)
                setHighlightIndex(-1)
                break
            case 'Backspace':
                if (inputValue === '' && selected.length > 0) {
                    removeChip(selected[selected.length - 1])
                }
                break
        }
    }

    useEffect(() => {
        if (highlightIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightIndex] as HTMLElement
            item?.scrollIntoView({ block: 'nearest' })
        }
    }, [highlightIndex])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setHighlightIndex(-1)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="flex flex-wrap items-center gap-1 min-h-[30px] px-1 py-0.5 border border-gray-300 rounded bg-white focus-within:ring-1 focus-within:ring-blue-500">
                {selected.map((item, idx) => (
                    <span
                        key={getKey(item, idx)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                        {getLabel(item)}
                        <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700 font-bold leading-none"
                            onClick={() => removeChip(item)}
                            tabIndex={-1}
                            aria-label={`Remove ${getLabel(item)}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    className="flex-1 min-w-[60px] px-1 py-0.5 text-sm outline-none border-none bg-transparent"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={selected.length === 0 ? `Select ${modelType}...` : ''}
                    autoComplete="off"
                />
            </div>

            {isOpen && (
                <ul
                    ref={listRef}
                    className="absolute z-50 w-full mt-0.5 max-h-40 overflow-y-auto bg-white border border-gray-300 rounded shadow-md text-sm"
                    role="listbox"
                >
                    {isLoading && (
                        <li className="px-2 py-1.5 text-gray-400">Loading...</li>
                    )}
                    {!isLoading && options.length === 0 && (
                        <li className="px-2 py-1.5 text-gray-400">No results</li>
                    )}
                    {!isLoading && options.map((option, idx) => {
                        const checked = isSelected(option)
                        return (
                            <li
                                key={option.id ?? option.job_id ?? idx}
                                role="option"
                                aria-selected={checked}
                                className={`px-2 py-1.5 cursor-pointer flex items-center gap-2 ${
                                    highlightIndex === idx ? 'bg-blue-100' : ''
                                } ${checked ? 'font-medium' : ''} hover:bg-blue-50`}
                                onMouseDown={() => toggleOption(option)}
                                onMouseEnter={() => setHighlightIndex(idx)}
                            >
                                <span className={`inline-block w-3.5 h-3.5 border rounded-sm text-center leading-[14px] text-[10px] ${
                                    checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400'
                                }`}>
                                    {checked ? '✓' : ''}
                                </span>
                                {getLabel(option)}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
