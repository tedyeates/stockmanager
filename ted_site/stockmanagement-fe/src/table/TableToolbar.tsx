import { FaFileDownload, FaPlus } from "react-icons/fa";

import { useLoad } from "../context/ApiContextManager";
import { useFields } from "../context/FieldContextProvider";
import { usePopupToggle } from "../context/PopupContextManager";

import { ExpandButton } from "../ExpandButton";
import { Pagination } from "./Pagination";
import { Search } from "./Search";

import { title } from "../util/strings";
import axios from "axios";
import { useAuth } from "../context/Login";
import { useEffect, useRef, useState } from "react";
import fileDownload from "js-file-download";
import { useData } from "../context/TableContextManager";
import { LoadingSpinner } from "./LoadingSpinner";


export function TableToolbar(){
    const {authHeader} = useAuth()
    const {active} = useLoad()
    const {hasLoadedField} = useFields()
    const {openPopup} = usePopupToggle()
    const {filters} = useData()


    const [downloading, setDownloading] = useState<boolean>(false)
    const sentExportRequest = useRef<boolean>(false)

    const exportToCSV = () => {
        console.log("exporting")
        let url = `${process.env.REACT_APP_BASE_URL}/api/${active.name}/export/`
        filters.forEach(({name, value}, index) => {
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
            fileDownload(res.data, `${active.name}.csv`)
        }).finally(() => {
            setDownloading(false)
            sentExportRequest.current = false
        })
    }

    useEffect(() => {
        console.log(downloading)
        console.log(sentExportRequest.current)
        if(downloading && !sentExportRequest.current){
            sentExportRequest.current = true
            exportToCSV()
        }


    }, [downloading])

    return (
        <div className="bg-white h-22 px-4 py-2 flex justify-between sm:px-6">
            <Search />
            <div className="h-1/2 flex">
                {hasLoadedField &&
                    <div className="mx-2">
                        <ExpandButton
                            text={`Create ${title(active.name)}`}
                            icon={<FaPlus/>}
                            onClick={openPopup}
                        />
                    </div>
                }
                <div className="mr-2">
                    <ExpandButton
                        text={downloading ? "dowloading..." : "Export CSV"}
                        icon={downloading ? <LoadingSpinner className="h-4 w-4" /> : <FaFileDownload />}
                        onClick={() => setDownloading(true)}
                    />
                </div>
                <Pagination />
            </div>
        </div>
    )
}