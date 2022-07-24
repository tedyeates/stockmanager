import {useEffect, useMemo, useRef, useState } from "react"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"

import axios from "axios"
import throttle from 'lodash/throttle'

import { useAuth } from 'pages/context/Login'
import { DataType } from "util/types/PageTypes"


type AutocompleteValue = DataType & {
    id: number
    name: string
}

type AutocompleteProps = {
    modelType: string
    value: AutocompleteValue
    onChange: (fieldName:string, fieldType:string, newValue:AutocompleteValue | null) => void
}

export default function ModelAutocomplete({modelType, value, onChange}: AutocompleteProps){
    const auth = useAuth()

    const [inputValue, setInputValue] = useState('')
    const [options, setOptions] = useState<AutocompleteValue[]>([value])

    const suggestions = useMemo(() => {
        return throttle(
            (searchTerm:string, active:boolean) => {
                axios.get( `${process.env.REACT_APP_BASE_URL}/suggestions/${modelType}?search_term=${searchTerm}`, {
                    headers: auth.authHeader.current
                }).then(response => {
                    if(!active) return
                    
                    let newOptions: AutocompleteValue[] = []
                    let foundOption = false

                    response.data.results.forEach((option:AutocompleteValue) => {
                        if(value.id === option.id) foundOption = true
                        
                        newOptions.push(option)
                    })

                    if(!foundOption) newOptions.push(value)

                    setOptions(newOptions)
                })
            }, 200)
    }, [modelType, auth.authHeader, value])

    useEffect(() => {
        let active = true

        suggestions(inputValue, active)

        return () => {
            active = false
        }
    }, [inputValue])

    return (
        <Autocomplete 
            className='form-dropdown'
            getOptionLabel={(option:any) => option ? (option.name ?? '') : ''}
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            value={value}
            onChange={(_, newValue:AutocompleteValue | null) => {
                onChange(modelType, 'object', newValue)
            }}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue)
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => 
                <TextField {...params} variant='outlined' size='small'/>
            }

        />
    )
}