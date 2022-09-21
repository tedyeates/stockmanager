import { useState } from "react"
import { LIMIT, NUMBER_PAGES_TO_SHOW } from "../../util/constants"


//TODO: Add functionality for next and previous page display
export function usePagination(){
    const [pageNumbersToDisplay, setPageNumbersToDisplayTo] = useState<Array<number>>([])
    const [hasNextPage, setHasNextPageTo] = useState<boolean>(false)
    const [hasPreviousPage, setHasPreviousPageTo] = useState<boolean>(false)
    const [numberOfResults, setNumberOfResultsTo] = useState<number>(0)

    function clearPageNumbersToDisplay(){
        setPageNumbersToDisplayTo([])
    }

    function updatePageNumbersToDisplay(resultCount:number, currentPage:number){
        setNumberOfResultsTo(resultCount)
        if(resultCount === 0) return clearPageNumbersToDisplay()

        const pageNumberToDisplayFirst = currentPage < 6 ? 1 : currentPage - Math.trunc(NUMBER_PAGES_TO_SHOW / 2) + 1
        const numberOfPagesLeft = Math.ceil(resultCount / LIMIT) - pageNumberToDisplayFirst + 1
        const numberOfPageButtonsToShow = Math.min(numberOfPagesLeft, NUMBER_PAGES_TO_SHOW)

        const pageNumbersToDisplay = [...Array(numberOfPageButtonsToShow).keys() ].map(
            index => index + pageNumberToDisplayFirst
        )
        setPageNumbersToDisplayTo(pageNumbersToDisplay)
    }

    function updateHasPreviousPageTo(previousPageUrl:string|null){
        setHasPreviousPageTo(previousPageUrl !== null)
    }

    function updateHasNextPageTo(nextPageUrl:string|null){
        setHasNextPageTo(nextPageUrl !== null)
    }

    return {
        pageDisplay: {
            pageNumbersToDisplay: pageNumbersToDisplay, 
            numberOfResults: numberOfResults,
            hasNextPage: hasNextPage,
            hasPreviousPage: hasPreviousPage,
        },
        pageDisplayUpdater:{
            updatePageNumbersToDisplay: updatePageNumbersToDisplay,
            updateHasPreviousPageTo: updateHasPreviousPageTo,
            updateHasNextPageTo: updateHasNextPageTo
        }

    }
}