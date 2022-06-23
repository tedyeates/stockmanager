import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { EXCLUDED_MODELS } from "../util/constants";
import { FieldsDataType, ProviderProps } from "../util/types";
import { useLoad } from "./ApiContextManager";
import { useAuth } from "./Login";


export type FieldContextType = {
    fields: FieldsDataType
    hasLoadedField: boolean
}

const FieldContext = createContext<FieldContextType>({
    fields: [],
    hasLoadedField: false
})

export const useFields = () => useContext(FieldContext)

export function FieldProvider({children}: ProviderProps) {
    const {authHeader} = useAuth()
    const {active} = useLoad()
    const [hasLoadedField, setHasLoadedField] = useState(false)

    const [fields, setFields] = useState<FieldsDataType>([])

    const gettingFields = useRef(true)

    const getFields = useCallback(() => {
        setHasLoadedField(false)
        if(EXCLUDED_MODELS.has(active.name)) return

        axios
            .get(`${process.env.REACT_APP_BASE_URL}/fields/${active.name}`, {
                headers: authHeader.current
            })
            .then(res => {
                if( gettingFields.current){
                    console.log(res.data)
                    setHasLoadedField(true)

                    setFields(res.data)
                }
            }).catch(error => {
                console.log(error.message)
                console.log(error.response)
            })
    }, [authHeader, active.name])

    // Reload data when active page changes
    useEffect(() => {
        gettingFields.current = true

        getFields()

        // Cancel any already running ajax request to prevent double rendering
        return () => {
            gettingFields.current = false
        }
    }, [active.name, active.type, getFields])

    return (
        <FieldContext.Provider value={{fields, hasLoadedField}}>
            { children }
        </FieldContext.Provider>
    )
}