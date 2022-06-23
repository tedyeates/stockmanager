import { createContext, useContext, useReducer, useState } from "react"
import { ActiveType, ProviderProps } from "../util/types"


type PagesType = {
    next: string | null
    previous: string | null
    count: number
}

type CountActionType = {
    type: "next" | "previous" | "goto"
    payload?: {newPage: number}
}

type PageContextType = {
    pageInfo: PagesType
    setPageInfo: (page: PagesType) => void
    currentPage: number
    updateCurrentPage: (action: CountActionType) => void
}

type LoadContextType = {
    active: ActiveType
    setActive: (newActive: ActiveType) => void
}


const PageContext = createContext<PageContextType>({
    pageInfo: {
        next: null,
        previous: null,
        count: 0
    },
    setPageInfo: () => {},
    currentPage: 1,
    updateCurrentPage: () => {}
})
const LoadContext = createContext<LoadContextType>({
    active: {name: 'instock', type: 'stocks'},
    setActive: () => {}
})

export const usePaging = () => useContext(PageContext)
export const useLoad = () => useContext(LoadContext)

function reducer(state: number, action: CountActionType): number {
    switch(action.type){
        case "next":
            return state + 1
        case "previous":
            return state - 1
        case "goto":
            if(action.payload)
                return  action.payload.newPage
            return 1
        default:
            throw new Error("Invalid action type")
    }
}

export function ApiProvider({ children }: ProviderProps ) {
    const initialPage = 1
    
    const [pageInfo, setPageInfo] = useState<PagesType>({
        next: null,
        previous: null,
        count: 0, 
    })
    const [active, setActive] = useState<ActiveType>({name: 'instock', type: 'stocks'})
    const [currentPage, updateCurrentPage] = useReducer(reducer, initialPage)
    

    return (
        <PageContext.Provider value={{pageInfo, setPageInfo, currentPage, updateCurrentPage}}>
            <LoadContext.Provider value = {{active, setActive}}>
                { children }
            </LoadContext.Provider>
        </PageContext.Provider>
    )

}