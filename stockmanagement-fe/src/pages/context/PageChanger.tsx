import axios from "axios"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { EXCLUDED_MODELS } from "util/constants"
import { DataTypeArray, FieldsDataType, FilterOptionType, PageDisplayType, PageName, PaginationType, TableLoaderType } from "util/types/PageTypes"
import { ProviderProps } from "util/types/types"
import { usePagination } from "pages/customhooks/PageNumberDisplayHook"
import { usePageNumberUpdater } from "pages/customhooks/PageUpdateHook"
import { useAuth } from "./Login"
import { Requests } from "util/requests"


type PageTypeChangerContextType = {
    currentPageName: PageName
    modalInputs: FieldsDataType
    isPageLoading: boolean
    pageData:DataTypeArray
    pageDisplay: PageDisplayType
    pagination: PaginationType
    searchFilters: Array<FilterOptionType>
    tableLoader: TableLoaderType
}


const PageTypeChangerContext = createContext<PageTypeChangerContextType>({
    currentPageName: "instock",
    modalInputs: [],
    isPageLoading: false,
    pageData: [],
    pageDisplay: {
        pageNumbersToDisplay: [],
        numberOfResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
    },
    pagination: {
        currentPageNumber: 1,
        changePageNumberTo: () => {}, 
        changePageNumberToNextPage: () => {}, 
        changePageNumberToPreviousPage: () => {}, 
    },
    searchFilters: [],
    tableLoader: {
        changePageTo: () => {},
        searchPageFor: () => {},
        removeSearchFilter: () => {},
    }
})

export const usePageTypeChanger = () => useContext(PageTypeChangerContext)


export function PageTypeChangerProvider({ children }: ProviderProps ) {
    const {authHeader, clearToken} = useAuth()

    const {currentPageNumber, pageNumberUpdater} = usePageNumberUpdater()
    const {pageDisplay, pageDisplayUpdater} = usePagination()

    const [currentPageName, setCurrentPageNameTo] = useState<PageName>("instock")
    const [searchFilters, setSearchFiltersTo] = useState<Array<FilterOptionType>>([])
    const [isPageLoading, setIsPageLoadingTo] = useState<boolean>(false)
    
    const [modalInputs, setModalInputsTo] = useState<FieldsDataType>([])
    const [pageData, setPageDataTo] = useState<DataTypeArray>([])
    

    const updateDataFor = useCallback(async (newPageName: PageName, newPageNumber:number, filters: Array<FilterOptionType>, active:boolean) => {
        let url = `${process.env.REACT_APP_BASE_URL}/api/${newPageName}/?page=${newPageNumber}`
        // TODO: include filters
        filters.forEach(({name, value}) => {
            url = `${url}&${name}=${encodeURIComponent(value)}`
        })

        try {
            const response = await Requests.get(url, authHeader.current)
            setIsPageLoadingTo(false)
            if(!active) return
            
            setPageDataTo(response.results)
            pageDisplayUpdater.updatePageNumbersToDisplay(
                response.count, 
                newPageNumber
            )
            pageDisplayUpdater.updateHasPreviousPageTo(response.previous)
            pageDisplayUpdater.updateHasNextPageTo(response.next)

        } catch (error) {
            setIsPageLoadingTo(false)
            setPageDataTo([])
        }
    }, [authHeader])


    const requestModelInputsFor = useCallback(async (newPageName: PageName, active:boolean) => {
        // TODO: fix fields
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/fields/${newPageName}`, {
                headers: authHeader.current
            })
            if(!active) return

            setModalInputsTo(response.data)
            setCurrentPageNameTo(newPageName)
        } catch (error: any) {
            console.error(error.message)
            if (error.response) console.error(error.response)
        } finally {
            if (active) setIsPageLoadingTo(false)
        }
    }, [authHeader])

    useEffect(() => {
        let active = true

        updateDataFor(currentPageName, currentPageNumber, searchFilters, active)

        return () => {
            active = false
        }
    }, [updateDataFor, currentPageName, currentPageNumber, searchFilters])

    useEffect(() => {
        let active = true
        
        if(!EXCLUDED_MODELS.has(currentPageName))
            requestModelInputsFor(currentPageName, active)

        return () => {
            active = false
        }
    }, [requestModelInputsFor, currentPageName])

    function clearSearchFilters(){
        setSearchFiltersTo([])
    }

    function searchPage(filters: Array<FilterOptionType>){
        setIsPageLoadingTo(true)
        pageNumberUpdater.changePageNumberToFirstPage()
        
        setSearchFiltersTo(filters)
    }

    const tableLoader = {
        changePageTo(newPageName: PageName) {
            setIsPageLoadingTo(true)
            clearSearchFilters()
            pageNumberUpdater.changePageNumberToFirstPage()
            setCurrentPageNameTo(newPageName)
        },
        searchPageFor(newFilter:FilterOptionType){
            let updatedFilters = [...searchFilters, newFilter]
            searchPage(updatedFilters)
        },
        removeSearchFilter(filterToRemove:FilterOptionType){
            let searchFiltersWithoutRemovedFilter = searchFilters.filter(({name, value, seperator}) => 
                filterToRemove.name !== name || filterToRemove.value !== value || filterToRemove.seperator !== seperator
            )
            searchPage(searchFiltersWithoutRemovedFilter)
        }
    }

    const pagination = {
        currentPageNumber,
        changePageNumberTo(newPageNumber:number){
            setIsPageLoadingTo(true)
            pageNumberUpdater.changePageNumberTo(newPageNumber)
        },
        changePageNumberToNextPage(){
            this.changePageNumberTo(currentPageNumber + 1)
        },
        changePageNumberToPreviousPage(){
            this.changePageNumberTo(currentPageNumber - 1)
        }
    }

    

    return (
        <PageTypeChangerContext.Provider value={{currentPageName, modalInputs, isPageLoading, pageData, pageDisplay, pagination, searchFilters, tableLoader}}>
            {children}
        </PageTypeChangerContext.Provider>
    )

}