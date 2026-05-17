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

type AutocompleteProps = {
    modelType: string
    value: AutocompleteValue | string | null
    onChange: (fieldName: string, fieldType: string, newValue: AutocompleteValue | null) => void
}

function getDisplayValue(value: AutocompleteValue | string | null): string {
    if (!value) return ''
    if (typeof value === 'string') return value
    return value.name ?? value.code ?? value.job_id ?? ''
}

export default function ModelAutocomplete({ modelType, value, onChange }: AutocompleteProps) {
    const auth = useAuth()

    const [inputValue, setInputValue] = useState(getDisplayValue(value))
    const [options, setOptions] = useState<AutocompleteValue[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const [isLoading, setIsLoading] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    // Fetch on mount (empty search) so options are ready immediately
    useEffect(() => {
        fetchOptions('')
    }, [fetchOptions])

    // Sync display value when external value changes
    useEffect(() => {
        setInputValue(getDisplayValue(value))
    }, [value])

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

    function selectOption(option: AutocompleteValue) {
        setInputValue(option.name ?? option.code ?? option.job_id ?? '')
        setIsOpen(false)
        setHighlightIndex(-1)
        onChange(modelType, 'object', option)
    }

    function handleClear() {
        setInputValue('')
        setIsOpen(false)
        onChange(modelType, 'object', null)
        fetchOptions('')
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
                    selectOption(options[highlightIndex])
                }
                break
            case 'Escape':
                setIsOpen(false)
                setHighlightIndex(-1)
                break
        }
    }

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightIndex] as HTMLElement
            item?.scrollIntoView({ block: 'nearest' })
        }
    }, [highlightIndex])

    // Close on outside click
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

    // Cleanup debounce
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    const getOptionLabel = (option: AutocompleteValue) => option.name ?? option.code ?? option.job_id ?? ''

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="flex items-center">
                <input
                    type="text"
                    className="w-full px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={`Select ${modelType}...`}
                    autoComplete="off"
                />
                {value && (
                    <button
                        type="button"
                        className="absolute right-1 text-gray-400 hover:text-gray-600 text-sm px-1"
                        onClick={handleClear}
                        tabIndex={-1}
                        aria-label="Clear selection"
                    >
                        ×
                    </button>
                )}
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
                    {!isLoading && options.map((option, idx) => (
                        <li
                            key={option.id ?? option.job_id ?? idx}
                            role="option"
                            aria-selected={highlightIndex === idx}
                            className={`px-2 py-1.5 cursor-pointer ${
                                highlightIndex === idx ? 'bg-blue-100' : ''
                            } ${value && typeof value === 'object' && (value.id === option.id || value.job_id === option.job_id) ? 'font-medium' : ''} hover:bg-blue-50`}
                            onMouseDown={() => selectOption(option)}
                            onMouseEnter={() => setHighlightIndex(idx)}
                        >
                            {getOptionLabel(option)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
