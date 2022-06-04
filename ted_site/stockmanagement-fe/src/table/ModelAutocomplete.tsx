import {useEffect, useMemo, useRef, useState } from "react"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"

import axios from "axios"
import throttle from 'lodash/throttle'

import { useAuth } from '../context/Login'
import { DataType } from "../util/types"


type AutocompleteProps = {
    modelType: string
    value: DataType
    onChange: (fieldName:string, fieldType:string, newValue:number) => void
}

export default function ModelAutocomplete({modelType, value, onChange}: AutocompleteProps){
    const auth = useAuth()

    const [inputValue, setInputValue] = useState('')
    const [options, setOptions] = useState<DataType[]>([value])
    const active = useRef(true)

    const suggestions = useMemo(() => {
        return throttle(
            (searchTerm:string) => {
                axios.get( `${process.env.REACT_APP_BASE_URL}/suggestions/${modelType}?search_term=${searchTerm}`, {
                    headers: auth.authHeader.current
                }).then(response => {
                    if(active.current){
                        let newOptions: DataType[] = []
                        let foundOption = false

                        response.data.results.forEach((option:DataType) => {
                            if(value.id === option.id)
                                foundOption = true
                            newOptions.push(option)
                        })

                        if(!foundOption){
                            newOptions.push(value)
                        }

                        setOptions(newOptions)
                    }
                })
            }, 200)
    }, [modelType, auth.authHeader, value])

    // Get options on loading
    useEffect(() => {
        active.current = true

        suggestions(inputValue)

        // Cancels setting options if stops loading or is closed
        return () => {
            active.current = false
        }
    }, [value, inputValue, suggestions])


    return (
        <Autocomplete 
            className='form-dropdown'
            getOptionLabel={(option:any) => option ? (option.name ?? option?.code ?? '') : ''}
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            value={value}
            onChange={(_, newValue) => {
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