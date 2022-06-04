import axios from "axios"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { DataContextType, DataTypeArray, FieldsDataType, ProviderProps } from "../util/types"
import { useLoad, usePaging } from "./ApiContextManager"
import { useAuth } from "./Login"

const DataContext = createContext<DataContextType>({
    data: [],
    getData: () => {}
})

export const useData = () => useContext(DataContext)

export function TableProvider({children}: ProviderProps) {
    const {authHeader} = useAuth()
    
    const {updateHasLoaded, active} = useLoad()
    const {setPages} = usePaging()
    
    const [data, setData] = useState<DataTypeArray>([])
    const gettingData = useRef(true)

    const getData = useCallback((currentPage, filters={}) => {
        updateHasLoaded("data", false)
        
        axios
            .get(`${process.env.REACT_APP_BASE_URL}/api/${active.name}/?page=${currentPage}`, {
                headers: authHeader.current
            })
            .then(res => {
                if(gettingData.current){
                    console.log(res)
                    updateHasLoaded("data", true)

                    setData(res.data.results)
                    setPages({
                        next: res.data.next,
                        previous: res.data.previous,
                        count: res.data.count
                    })
                }
            }).catch(error => {
                console.log(error.message)
                console.log(error.response)
            })
    }, [authHeader, active])

    // Reload data when active page changes
    useEffect(() => {
        gettingData.current = true

        getData(1)

        // Cancel any already running ajax request to prevent double rendering
        return () => {
            gettingData.current = false
        }
    }, [active.name, active.type, getData])

    return (
        <DataContext.Provider value={{data, getData}}>
            { children }
        </DataContext.Provider>
    )
}