
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { PageDisplayType, PaginationType } from 'util/types/PageTypes'
import 'styles/pagination.css'

type PaginationPropType = {
    pageDisplay: PageDisplayType
    pagination: PaginationType
    
}

// TODO: Replace error variables with props
export function Pagination({pageDisplay, pagination}: PaginationPropType){

    return (
        <div className="flex">
            <div className="inline-flex flex-1 items-center justify-end sm:hidden">
                <button className="
                    relative inline-flex p-2 pagination-button
                    text-sm font-medium rounded-md"
                >
                    Previous
                </button>
                <button className="ml-3 relative inline-flex items-center p-2 border 
                    text-sm font-medium rounded-m pagination-button"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:inline-flex  sm:justify-end">
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                        {pageDisplay.hasNextPage &&
                            <button className="relative inline-flex items-center p-2
                                rounded-l-md border text-sm font-medium pagination-button"
                                onClick={() => pagination.changePageNumberToPreviousPage()}
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        }
                        {pageDisplay.pageNumbersToDisplay.map((pageNumber) => (
                            <button key={pageNumber} aria-current="page" className={` 
                                relative inline-flex items-center px-4 py-2 border text-sm font-medium ml-0
                                ${pagination.currentPageNumber === pageNumber ?
                                    "pagination-button active"
                                :
                                    "pagination-button"
                                }`}
                                onClick={() => pagination.changePageNumberTo(pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        ))}
                        {pageDisplay.hasNextPage && 
                            <button className="relative inline-flex items-center p-2
                                rounded-r-md border text-sm font-medium pagination-button"
                                onClick={() => pagination.changePageNumberToNextPage()}
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