import { Autocomplete, TextField } from "@mui/material"
import axios from "axios"
import { throttle } from "lodash"
import { HTMLAttributes, ReactElement, useEffect, useMemo, useState } from "react"
import { useAuth } from "../context/Login"
import { PillTag } from "../Shapes"
import { title } from "../../util/strings"
import { FilterOptionType, PageDisplayType, RemoveSearchFilterType, SearchPageForType } from "../../util/types/PageTypes"


type SearchPropsType = {
    pageDisplay: PageDisplayType
    currentPageName: string
    searchFilters: Array<FilterOptionType>
    searchPageFor: SearchPageForType
    removeSearchFilter: RemoveSearchFilterType
}

export function Search({pageDisplay, currentPageName, searchFilters, searchPageFor, removeSearchFilter}: SearchPropsType) {
    const auth = useAuth()
    
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState<string>("")
    const [value, setValue] = useState<FilterOptionType|null>(null)
    const [options, setOptions] = useState<Array<FilterOptionType>>([])

    const suggestions = useMemo(() => {
        return throttle((searchTerm:string, active:boolean) => {
            axios.get( `${process.env.REACT_APP_BASE_URL}/search/${currentPageName}?search_term=${searchTerm}`, {
                headers: auth.authHeader.current
            }).then(response => {
                if (!active) return undefined
                let newOptions: Array<FilterOptionType> = []

                response.data.results.forEach((option:FilterOptionType) => {
                    newOptions.push(option)
                })

                setOptions(newOptions)
            })
        }, 200)
    }, [currentPageName, auth.authHeader])


    useEffect(() => {
        let active = true

        if(inputValue === null) return
        suggestions(inputValue, active)

        return () => {
            active = false
        }
    }, [inputValue])

    function onChange(newValue: FilterOptionType|null){
        if(newValue !== null && newValue.name !== "" ){
            searchPageFor(newValue)
            setInputValue("")
        }
        setValue(null)
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
                suggestionType = "Contains"
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
                    open={open}
                    onOpen={() => {
                        setOpen(true);
                    }}
                    onClose={() => {
                        setOpen(false);
                    }}
                    value={value}
                    groupBy={(option) => title(option.display_name ?? "")}
                    getOptionLabel={option => `${option.name}${option.seperator}${option.value}` ?? ""}
                    onInputChange={(_, newInputValue) => {  
                        setInputValue(newInputValue)
                    }}
                    isOptionEqualToValue={(option, value) => (
                        option.name === value.name && option.value === value.value && option.seperator === value.seperator
                    )}
                    onChange={(_, newValue) => {onChange(newValue ?? null)}}
                    renderOption={renderOption}
                    renderInput={(params) => <TextField {...params} size="small" label="Search Table" variant="outlined" />}
                />      
                <div className="text-left mt-1 flex-1 flex justify-between">
                    <div className="inline-flex">
                        {searchFilters.map((filter, index) => {
                            return (
                                <PillTag
                                    key={`tag-${index}`}
                                    size={6}
                                    color="blue-700"
                                    closeClass="bg-blue-500 hover:bg-blue-600"
                                    text={`${title(filter.display_name)} ${filter.seperator} ${filter.value}`}
                                    className={"ml-1"}
                                    onClick={() => removeSearchFilter(filter)}
                                />
                            )
                        })}
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">{pageDisplay.numberOfResults}</span> results
                        </p>
                    </div>  
                </div>
            </div>
        </>
    )
}
