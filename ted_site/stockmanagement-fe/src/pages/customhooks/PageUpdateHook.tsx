import { useReducer } from "react"
import { PageNumberUpdateFunctionType } from "../../util/types/PageTypes"

type CountActionType = {
    type: "next" | "previous" | "goto"
    payload?: {newPage: number}
}

type PageNumberUpdaterType = {
    currentPageNumber: number, 
    pageNumberUpdater: PageNumberUpdateFunctionType
}

function updatePageNumberState(state: number, action: CountActionType): number {
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

export function usePageNumberUpdater(): PageNumberUpdaterType {
    const INITIAL_PAGE_NUMBER = 1
    const [currentPageNumber, updatePageNumber] = useReducer(updatePageNumberState, INITIAL_PAGE_NUMBER)

    function changePageNumberToNextPage(){
        updatePageNumber({type: "next"})
    }

    function changePageNumberToPreviousPage(){
        updatePageNumber({type: "previous"})
    }

    function changePageNumberTo(newPageNumber: number){
        updatePageNumber({type: "goto", payload: {newPage: newPageNumber}})
    }

    function changePageNumberToFirstPage(){
        changePageNumberTo(INITIAL_PAGE_NUMBER)
    }

    return {
        currentPageNumber: currentPageNumber,
        pageNumberUpdater: {
            changePageNumberToNextPage: changePageNumberToNextPage, 
            changePageNumberToPreviousPage: changePageNumberToPreviousPage, 
            changePageNumberToFirstPage: changePageNumberToFirstPage, 
            changePageNumberTo: changePageNumberTo 
        }
    }
}
