import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { FieldsDataType, ProviderProps } from "../util/types";
import { useLoad } from "./ApiContextManager";
import { useAuth } from "./Login";

const FieldContext = createContext<FieldsDataType>([])
export const useFields = () => useContext(FieldContext)

export function FieldProvider({children}: ProviderProps) {
    const {authHeader} = useAuth()
    const {active} = useLoad()
    const {updateHasLoaded} = useLoad()

    const [fields, setFields] = useState<FieldsDataType>([])

    const gettingFields = useRef(true)

    const getFields = useCallback(() => {
        axios
            .get(`${process.env.REACT_APP_BASE_URL}/fields/${active.name}`, {
                headers: authHeader.current
            })
            .then(res => {
                if( gettingFields.current){
                    console.log(res.data)
                    updateHasLoaded("fields", true)

                    setFields(res.data)
                }
            }).catch(error => {
                console.log(error.message)
                console.log(error.response)
            })
    }, [authHeader])

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
        <FieldContext.Provider value={fields}>
            { children }
        </FieldContext.Provider>
    )
}