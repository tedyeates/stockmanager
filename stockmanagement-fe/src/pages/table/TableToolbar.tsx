import { FaFileDownload, FaPlus } from "react-icons/fa";

import { usePopupToggle } from "../context/PopupContextManager";

import { ExpandButton } from "../ExpandButton";
import { Pagination } from "./Pagination";
import { Search } from "./Search";

import { title } from "../../util/strings";
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
        let url = `${import.meta.env.VITE_BASE_URL}/api/${pageTypeChanger.currentPageName}/export/`
        if (pageTypeChanger.searchTerm.trim().length > 0) {
            url = `${url}?search=${encodeURIComponent(pageTypeChanger.searchTerm)}`
        }
        console.log(url)
        fetch(url, {
            method: 'GET',
            headers: authHeader.current as HeadersInit,
        }).then(res => {
            if (!res.ok) throw new Error(`Export failed: ${res.status}`)
            return res.blob()
        }).then(blob => {
            fileDownload(blob, `${pageTypeChanger.currentPageName}.csv`)
        }).finally(() => {
            setIsExportDownloadingTo(false)
        })
    }

    return (
        <div className="background-color h-22 px-4 py-2 flex justify-between sm:px-6">
            <Search 
                searchTerm={pageTypeChanger.searchTerm}
                onSearchChange={pageTypeChanger.updateSearchTerm}
                resultCount={pageTypeChanger.pageDisplay.numberOfResults}
            />
            <div className="h-1/2 flex">
                {!pageTypeChanger.isPageLoading &&
                    <div className="mx-2">
                        <ExpandButton
                            text={`create ${pageTypeChanger.currentPageName}`}
                            icon={<FaPlus/>}
                            onClick={openPopup}
                        />
                    </div>
                }
                <div className="mr-2">
                    <ExpandButton
                        text={isExportDownloading ? "dowloading..." : "export CSV"}
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