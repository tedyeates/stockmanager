import { Autocomplete, TextField } from "@mui/material"
import axios from "axios"
import { throttle } from "lodash"
import { HTMLAttributes, ReactElement, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "../context/Login"
import { PillTag } from "../Shapes"
import { useLoad, usePaging } from "../context/ApiContextManager"
import { title } from "../util/strings"
import { useData } from "../context/TableContextManager"
import { FilterOptionType } from "../util/types"


const DEFAULT_SUGGESTION = {
    name: "",
    value: "",
    display_name: "",
    seperator: ""
}

export function Search() {
    const auth = useAuth()
    const {active} = useLoad()
    const {pageInfo, updateCurrentPage} = usePaging()
    const {filters, setFilters} = useData()

    const [inputValue, setInputValue] = useState<string>("")
    const [value, setValue] = useState<FilterOptionType>(DEFAULT_SUGGESTION)
    const [options, setOptions] = useState<Array<FilterOptionType>>([])
    const loadSuggestions = useRef(true)

    const suggestions = useMemo(() => {
        return throttle((searchTerm:string) => {
            axios.get( `${process.env.REACT_APP_BASE_URL}/search/${active.name}?search_term=${searchTerm}`, {
                headers: auth.authHeader.current
            }).then(response => {
                if(loadSuggestions.current){
                    let newOptions: Array<FilterOptionType> = []

                    response.data.results.forEach((option:FilterOptionType) => {
                        newOptions.push(option)
                    })

                    setOptions(newOptions)
                }
            })
        }, 200)
    }, [active.name, auth.authHeader])

    
    useEffect(() => {
        loadSuggestions.current = true

        suggestions(inputValue)

        // Cancels setting options if stops loading or is closed
        return () => {
            loadSuggestions.current = false
        }
    }, [inputValue, suggestions])

    function onChange(newValue: FilterOptionType){
        if(newValue !== undefined && newValue.name !== "" ){
            updateCurrentPage({type: "goto", payload: {newPage: 1}})
            setFilters((oldFilters:Array<FilterOptionType>) => [...oldFilters, newValue])
            setInputValue("")
        }
        setValue(DEFAULT_SUGGESTION)
    }

    function renderOption(props: HTMLAttributes<HTMLLIElement>, option: FilterOptionType): ReactElement {
        const fieldValue = option.value?.toString() ?? ""
        let suggestionType = ""
        switch(option.seperator){
            case ">":
                suggestionType = "Greater Than"
                break
            case "<":
                suggestionType = "Less Than"
                break
            default: 
                break
        }
        return <li {...props}><span className="text-gray-400">{suggestionType}</span>&nbsp;<span>{fieldValue}</span></li>
    }

    return (
        <>
            <div className="w-1/2 inline-block">    
                <Autocomplete
                    id="table-search"
                    inputValue={inputValue}
                    filterOptions={(x) => x} // Not null/undefined
                    options={options}
                    autoComplete
                    includeInputInList
                    filterSelectedOptions
                    value={value}
                    groupBy={(option) => title(option.display_name ?? "")}
                    getOptionLabel={option => `${option.name}${option.seperator}${option.value}` ?? ""}
                    onInputChange={(_, newInputValue) => {
                        setInputValue(newInputValue)
                    }}
                    isOptionEqualToValue={(option, value) => (
                        option.name === value.name && option.value === value.value && option.seperator === value.seperator
                    )}
                    onChange={(_, newValue) => {onChange(newValue ?? DEFAULT_SUGGESTION)}}
                    renderOption={renderOption}
                    renderInput={(params) => <TextField {...params} size="small" label="Search Table" variant="outlined" />}
                />      
                <div className="text-left mt-1 flex-1 flex justify-between">
                    <div className="inline-flex">
                        {filters.map(({name, value, display_name, seperator}, index) => {
                            let filter = {name: name, value: value, seperator: seperator}
                            return (
                                <PillTag
                                    key={`tag-${index}`}
                                    size={6}
                                    color="blue-700"
                                    closeClass="bg-blue-500 hover:bg-blue-600"
                                    text={`${title(display_name)} ${seperator} ${value}`}
                                    className={"ml-1"}
                                    onClick={() => setFilters(filters.filter(({name, value}) => 
                                        filter.name !== name || filter.value !== value || filter.seperator !== seperator
                                    ))}
                                />
                            )
                        })}
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">{pageInfo.count}</span> results
                        </p>
                    </div>  
                </div>
            </div>
        </>
    )
}
