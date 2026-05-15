import { TextField } from "@mui/material"
import { useEffect, useRef, useState } from "react"


type SearchProps = {
    searchTerm: string
    onSearchChange: (term: string) => void
    resultCount: number
}

export function Search({ searchTerm, onSearchChange, resultCount }: SearchProps) {
    const [inputValue, setInputValue] = useState<string>(searchTerm)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Sync local input when searchTerm prop changes externally (e.g., tab change clears it)
    useEffect(() => {
        setInputValue(searchTerm)
    }, [searchTerm])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        setInputValue(value)

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            const trimmed = value.trim()
            onSearchChange(trimmed)
        }, 300)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [])

    return (
        <div className="w-1/2 inline-block">
            <TextField
                value={inputValue}
                onChange={handleChange}
                size="small"
                variant="outlined"
                placeholder="Search..."
                fullWidth
            />
            <div className="text-left mt-1 flex-1 flex justify-end">
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{resultCount}</span> results
                </p>
            </div>
        </div>
    )
}
