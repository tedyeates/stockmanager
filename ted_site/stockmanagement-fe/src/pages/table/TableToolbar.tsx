import { FaFileDownload, FaPlus } from "react-icons/fa";

import { usePopupToggle } from "../context/PopupContextManager";

import { ExpandButton } from "../ExpandButton";
import { Pagination } from "./Pagination";
import { Search } from "./Search";

import { title } from "../../util/strings";
import axios from "axios";
import { useAuth } from "../context/Login";
import { useState } from "react";
import fileDownload from "js-file-download";
import { LoadingSpinner } from "./LoadingSpinner";
import { usePageTypeChanger } from "../context/PageChanger";


export function TableToolbar(){
    const {authHeader} = useAuth()
    const pageTypeChanger = usePageTypeChanger()
    const {openPopup} = usePopupToggle()


    const [isExportDownloading, setIsExportDownloadingTo] = useState<boolean>(false)

    const exportToCSV = () => {
        if(isExportDownloading) return
        setIsExportDownloadingTo(true)

        console.log("exporting")
        let url = `${process.env.REACT_APP_BASE_URL}/api/${pageTypeChanger.currentPageName}/export/`
        pageTypeChanger.searchFilters.forEach(({name, value}, index) => {
            if(index === 0)
                url = `${url}?${name}=${value}`
            else
                url = `${url}&${name}=${value}`
        })
        console.log(url)
        axios.get(url, {
            headers: authHeader.current,
            responseType: 'blob'
        }).then(res => {
            console.log(res)
            fileDownload(res.data, `${pageTypeChanger.currentPageName}.csv`)
        }).finally(() => {
            setIsExportDownloadingTo(false)
        })
    }

    return (
        <div className="background-color h-22 px-4 py-2 flex justify-between sm:px-6">
            <Search 
                pageDisplay={pageTypeChanger.pageDisplay}  
                currentPageName={pageTypeChanger.currentPageName} 
                searchFilters={pageTypeChanger.searchFilters} 
                searchPageFor={pageTypeChanger.tableLoader.searchPageFor} 
                removeSearchFilter={pageTypeChanger.tableLoader.removeSearchFilter} 
            />
            <div className="h-1/2 flex">
                {pageTypeChanger.isPageLoading &&
                    <div className="mx-2">
                        <ExpandButton
                            text={`Create ${title(pageTypeChanger.currentPageName)}`}
                            icon={<FaPlus/>}
                            onClick={openPopup}
                        />
                    </div>
                }
                <div className="mr-2">
                    <ExpandButton
                        text={isExportDownloading ? "dowloading..." : "Export CSV"}
                        icon={isExportDownloading ? <LoadingSpinner className="h-4 w-4" /> : <FaFileDownload />}
                        onClick={() => exportToCSV()}
                    />
                </div>
                <Pagination 
                    pageDisplay={pageTypeChanger.pageDisplay} 
                    pagination={pageTypeChanger.pagination} 
                />
            </div>
        </div>
    )
}