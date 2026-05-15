import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { EXCLUDED_MODELS } from "util/constants"
import { DataTypeArray, FieldsDataType, PageDisplayType, PageName, PaginationType, TableLoaderType } from "util/types/PageTypes"
import { ProviderProps } from "util/types/types"
import { usePagination } from "pages/customhooks/PageNumberDisplayHook"
import { usePageNumberUpdater } from "pages/customhooks/PageUpdateHook"
import { useAuth } from "./Login"
import { Requests } from "util/requests"


type PageTypeChangerContextType = {
    currentPageName: PageName
    modalInputs: FieldsDataType
    isPageLoading: boolean
    pageData: DataTypeArray
    pageDisplay: PageDisplayType
    pagination: PaginationType
    searchTerm: string
    errorMessage: string
    updateSearchTerm: (term: string) => void
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
    searchTerm: "",
    errorMessage: "",
    updateSearchTerm: () => {},
    tableLoader: {
        changePageTo: () => {},
    }
})

export const usePageTypeChanger = () => useContext(PageTypeChangerContext)


export function PageTypeChangerProvider({ children }: ProviderProps) {
    const { authHeader, clearToken } = useAuth()

    const { currentPageNumber, pageNumberUpdater } = usePageNumberUpdater()
    const { pageDisplay, pageDisplayUpdater } = usePagination()

    const [currentPageName, setCurrentPageNameTo] = useState<PageName>("instock")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isPageLoading, setIsPageLoadingTo] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>("")

    const [modalInputs, setModalInputsTo] = useState<FieldsDataType>([])
    const [pageData, setPageDataTo] = useState<DataTypeArray>([])


    const updateDataFor = useCallback(async (newPageName: PageName, newPageNumber: number, search: string, active: boolean) => {
        let url = `${import.meta.env.VITE_BASE_URL}/api/${newPageName}/?page=${newPageNumber}`
        if (search.trim().length > 0) {
            url += `&search=${encodeURIComponent(search)}`
        }

        try {
            const response = await Requests.get(url, authHeader.current)
            setIsPageLoadingTo(false)
            setErrorMessage("")
            if (!active) return

            setPageDataTo(response.results)
            pageDisplayUpdater.updatePageNumbersToDisplay(
                response.count,
                newPageNumber
            )
            pageDisplayUpdater.updateHasPreviousPageTo(response.previous)
            pageDisplayUpdater.updateHasNextPageTo(response.next)

        } catch (error: any) {
            setIsPageLoadingTo(false)
            if (!active) return

            const isHttpError = error?.message?.startsWith("Request Error")
            if (isHttpError) {
                // HTTP error (non-2xx): clear page data
                setPageDataTo([])
            } else {
                // Network error (fetch rejection): preserve existing pageData
                console.error("Network error during search:", error)
            }
            setErrorMessage("Search could not be completed")
        }
    }, [authHeader])


    const requestModelInputsFor = useCallback(async (newPageName: PageName, active: boolean) => {
        try {
            const response = await Requests.get(`${import.meta.env.VITE_BASE_URL}/fields/${newPageName}`, authHeader.current)
            if (!active) return

            setModalInputsTo(response)
            setCurrentPageNameTo(newPageName)
        } catch (error: any) {
            console.error(error.message)
        } finally {
            if (active) setIsPageLoadingTo(false)
        }
    }, [authHeader])

    useEffect(() => {
        let active = true

        updateDataFor(currentPageName, currentPageNumber, searchTerm, active)

        return () => {
            active = false
        }
    }, [updateDataFor, currentPageName, currentPageNumber, searchTerm])

    useEffect(() => {
        let active = true

        if (!EXCLUDED_MODELS.has(currentPageName))
            requestModelInputsFor(currentPageName, active)

        return () => {
            active = false
        }
    }, [requestModelInputsFor, currentPageName])

    function updateSearchTerm(term: string) {
        setIsPageLoadingTo(true)
        setSearchTerm(term)
        pageNumberUpdater.changePageNumberToFirstPage()
    }

    const tableLoader = {
        changePageTo(newPageName: PageName) {
            setIsPageLoadingTo(true)
            setSearchTerm("")
            pageNumberUpdater.changePageNumberToFirstPage()
            setCurrentPageNameTo(newPageName)
        },
    }

    const pagination = {
        currentPageNumber,
        changePageNumberTo(newPageNumber: number) {
            setIsPageLoadingTo(true)
            pageNumberUpdater.changePageNumberTo(newPageNumber)
        },
        changePageNumberToNextPage() {
            this.changePageNumberTo(currentPageNumber + 1)
        },
        changePageNumberToPreviousPage() {
            this.changePageNumberTo(currentPageNumber - 1)
        }
    }



    return (
        <PageTypeChangerContext.Provider value={{ currentPageName, modalInputs, isPageLoading, pageData, pageDisplay, pagination, searchTerm, errorMessage, updateSearchTerm, tableLoader }}>
            {children}
        </PageTypeChangerContext.Provider>
    )

}
