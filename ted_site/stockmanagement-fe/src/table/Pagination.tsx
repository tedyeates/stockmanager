import { useLoad, usePaging } from "../context/ApiContextManager"
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { useEffect, useState } from "react"
import { useData } from "../context/TableContextManager"

export function Pagination(){

    const [pageOptions, setOptions] = useState<Array<number>>([])
    const {pageInfo, currentPage, updateCurrentPage} = usePaging()
    const {active} = useLoad()
    
    useEffect(() => {
        const LIMIT = 25
        const NUMBER_PAGES_TO_SHOW = 10

        if (pageInfo.count === 0) {
            setOptions([])
            return 
        }

        let pageStart = currentPage < 6 ? 1 : currentPage - Math.trunc(NUMBER_PAGES_TO_SHOW / 2) + 1
        let pagesLeft = Math.ceil(pageInfo.count / LIMIT) - pageStart + 1
        let pagesToShow = Math.min(pagesLeft, NUMBER_PAGES_TO_SHOW)

        setOptions([ ...Array(pagesToShow).keys() ].map(i => i + pageStart))
    }, [currentPage, pageInfo])


    return (
        <div className="flex">
            <div className="inline-flex flex-1 items-center justify-end sm:hidden">
                <button className="
                    relative inline-flex p-2 border border-gray-300 
                    text-sm font-medium rounded-md text-gray-700 
                    bg-white hover:bg-gray-50"
                >
                    Previous
                </button>
                <button className="ml-3 relative inline-flex items-center p-2 border 
                    border-gray-300 text-sm font-medium rounded-md text-gray-700 
                    bg-white hover:bg-gray-50"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:inline-flex  sm:justify-end">
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                        {pageInfo.previous === null ||
                            <button className="relative inline-flex items-center p-2
                                rounded-l-md border border-gray-300 bg-white text-sm font-medium 
                                text-gray-500 hover:bg-gray-50"
                                onClick={() => updateCurrentPage({type: "previous"})}
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        }
                        {pageOptions.map((option) => (
                            <button key={option} aria-current="page" className={` 
                                relative inline-flex items-center px-4 py-2 border text-sm font-medium ml-0
                                ${currentPage === option ?
                                    "bg-blue-50 border-blue-500 text-blue-600 "
                                :
                                    "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                                onClick={() => updateCurrentPage({type: "goto", payload: {newPage: option}})}
                            >
                                {option}
                            </button>
                        ))}
                        {pageInfo.next === null ||
                            <button className="relative inline-flex items-center p-2
                                rounded-r-md border border-gray-300 bg-white text-sm font-medium
                                text-gray-500 hover:bg-gray-50"
                                disabled={pageInfo.next === null}
                                onClick={() => updateCurrentPage({type: "next"})}
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        }
                    </nav>
                </div>
            </div>
        </div>
    )
}