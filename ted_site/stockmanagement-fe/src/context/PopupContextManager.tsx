import { createContext, useContext, useEffect, useState } from "react";
import { formatDateString } from "../util/strings";
import { DataType, ProviderProps } from "../util/types";


type TogglePopupContextType = {
    isOpen: boolean
    closePopup: () => void
    openPopup: () => void
}

type RowDataContextType = {
    rowData: DataType
    updateRowData: (fieldName: string, value: any) => void
    prefillPopup: (data: DataType) => void
}

const DATE_FIELDS = ['stock_date']

const TogglePopupContext = createContext<TogglePopupContextType>({
    isOpen: false,
    openPopup: () => {},
    closePopup: () => {}
})

const RowDataContext = createContext<RowDataContextType>({
    rowData: {},
    updateRowData: () => {},
    prefillPopup: () => {}
})

export const usePopupToggle = () => useContext(TogglePopupContext)
export const useRowData = () => useContext(RowDataContext)

export function PopupProvider({ children }: ProviderProps){
    const [rowData, setRowData] = useState({})
    const [isOpen, setOpen] = useState(false)

    function closePopup(){
        setOpen(false)
        setRowData({})
    }

    function openPopup(){
        setOpen(true)
    }

    function updateRowData(fieldName: string, value:any){
        setRowData({
            ...rowData,
            [fieldName]: value
        })
    }

    useEffect(()=>{
        console.log(rowData)
    }, [isOpen])

    /**
     * Callback for click of table row. 
     * Opens popup and stores column data from row
     * @param data row column data
     */
    function prefillPopup(data: DataType) {
        console.log(data)
        let rowData = {...data}
        console.log(rowData)
        DATE_FIELDS.forEach((field) => {
            if(field in rowData) {
                rowData[field] = formatDateString(rowData[field])
            }
        })
        setOpen(true)
        setRowData(rowData)
    }

    return (
        <TogglePopupContext.Provider value={{isOpen, openPopup, closePopup}}>
            <RowDataContext.Provider value={{rowData, updateRowData, prefillPopup}}>
                { children }
            </RowDataContext.Provider>
        </TogglePopupContext.Provider>
    )
} 