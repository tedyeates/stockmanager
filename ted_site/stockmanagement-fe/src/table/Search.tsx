import { Autocomplete, TextField } from "@mui/material"
import axios from "axios"
import { throttle } from "lodash"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "../context/Login"
import { PillTag } from "../Shapes"
import { useLoad, usePaging } from "../context/ApiContextManager"
import { title } from "../util/strings"


type SuggestionOptionType = {
    name?: string
    value?: string
}

type FilterOptionType = {
    name: string
    value: string
}

export function Search() {
    const auth = useAuth()
    const {active} = useLoad()
    const {pages} = usePaging()

    const [inputValue, setInputValue] = useState<string>("")
    const [value, setValue] = useState<SuggestionOptionType>({})
    const [options, setOptions] = useState<Array<SuggestionOptionType>>([])
    const [filters, setFilters] = useState<Array<FilterOptionType>>([])
    const loadSuggestions = useRef(true)

    const suggestions = useMemo(() => {
        return throttle(
            (searchTerm:string) => {
                axios.get( `${process.env.REACT_APP_BASE_URL}/search/${active.name}?search_term=${searchTerm}`, {
                    headers: auth.authHeader.current
                }).then(response => {
                    if(loadSuggestions.current){
                        let newOptions: Array<SuggestionOptionType> = []

                        response.data.results.forEach((option:SuggestionOptionType) => {
                            newOptions.push(option)
                        })
                        console.log(response.data)

                        setOptions(newOptions)
                    }
                })
            }, 200)
    }, [active.name, auth.authHeader])
    
    // Get options on loading
    useEffect(() => {
        loadSuggestions.current = true

        suggestions(inputValue)

        // Cancels setting options if stops loading or is closed
        return () => {
            loadSuggestions.current = false
        }
    }, [inputValue, suggestions])

    function onChange(newValue: SuggestionOptionType){
        if(newValue.name !== undefined && newValue.value !== undefined)
            setFilters(oldFilters => [...oldFilters, {name: newValue.name!, value: newValue.value!}])
        setValue({})
    }

    return (
        <>
            <div className="w-1/2 inline-block">    
                <Autocomplete
                    id="table-search"
                    inputValue={inputValue}
                    filterOptions={(x) => x}
                    options={options}
                    autoComplete
                    includeInputInList
                    filterSelectedOptions
                    value={value}
                    groupBy={(option) => title(option.name ?? "")}
                    getOptionLabel={option => option ? title(option.value?.toString() ?? "") : ''}
                    onInputChange={(_, newInputValue) => {
                        setInputValue(newInputValue)
                    }}
                    isOptionEqualToValue={(option, value) => option.name === value.name && option.value === value.value}
                    onChange={(_, newValue) => {onChange(newValue ?? {})}}
                    renderInput={(params) => <TextField {...params} size="small" label="Search Table" variant="outlined" />}
                />      
                <div className="text-left mt-1 flex-1 flex justify-between">
                    <div className="inline-flex">
                        {filters.map(({name, value}, index) => {
                            let filterName = name
                            return (
                                <PillTag
                                    key={`tag-${index}`}
                                    size={6}
                                    color="blue-700"
                                    closeClass="bg-blue-500 hover:bg-blue-600"
                                    text={`${title(name)} = ${value}`}
                                    className={"ml-1"}
                                    onClick={() => setFilters(filters.filter(({name}) => 
                                        filterName !== name
                                    ))}
                                />
                            )
                        })}
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">{pages.count}</span> results
                        </p>
                    </div>  
                </div>
            </div>
        </>
    )
}
