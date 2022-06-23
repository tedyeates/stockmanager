import axios from "axios"
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { DataType, FilterOptionType, ProviderProps, UseStateType } from "../util/types"
import { useLoad, usePaging } from "./ApiContextManager"
import { useAuth } from "./Login"


type DataTypeArray = Array<DataType>

type DataContextType = {
    data: Array<DataType>
    hasLoadedData: boolean
    filters: Array<FilterOptionType>
    setFilters:  UseStateType<Array<FilterOptionType>>
}

type GetDataResponse = {
    count: number,
    next: string | null,
    previous: string | null,
    results: DataTypeArray
}

const DataContext = createContext<DataContextType>({
    data: [],
    hasLoadedData: false,
    filters: [],
    setFilters: () => {}
})

export const useData = () => useContext(DataContext)

export function TableProvider({children}: ProviderProps) {
    const {authHeader} = useAuth()
    
    const {setPageInfo, currentPage, updateCurrentPage} = usePaging()

    const [filters, setFilters] = useState<Array<FilterOptionType>>([])
    const {active} = useLoad()
    
    const [hasLoadedData, setHasLoadedData] = useState(false)
    const [data, setData] = useState<DataTypeArray>([])

    const gettingData = useRef(false)

    const getData = ()  => {
        let url = `${process.env.REACT_APP_BASE_URL}/api/${active.name}/?page=${currentPage}`
        filters.forEach(({name, value}) => {
            url = `${url}&${name}=${value}`
        })
        console.log(url)
        return axios.get(url, {headers: authHeader.current})
    }

    
    const updateData = () => {
        setHasLoadedData(false)
        gettingData.current = true
        getData().then(res => {
            console.log(res)
            setHasLoadedData(true)

            setData(res.data.results)
            setPageInfo({
                next: res.data.next,
                previous: res.data.previous,
                count: res.data.count
            })
            gettingData.current = false
        }).catch(error => {
            console.log(error.message)
            console.log(error.response)
        })
    }


    // Reload data when active page changes
    useEffect(() => {
        console.log("hello")

        setFilters([])
        updateCurrentPage({type: "goto", payload: {newPage: 1}})

    }, [active])


    // Reload data when active page changes
    useEffect(() => {
        console.log(gettingData.current)
        
        if(!gettingData.current)
            updateData()


        // Cancel any already running ajax request to prevent double rendering
        return () => {
            gettingData.current = false
        }
    }, [currentPage, filters, active.name])

    return (
        <DataContext.Provider value={{data, hasLoadedData, filters, setFilters}}>
            { children }
        </DataContext.Provider>
    )
}