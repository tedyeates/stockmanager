import { createContext, useContext, useState } from "react";
import { formatDateString } from "../util/strings";
import { DataType, ProviderProps, RowDataContextType, TogglePopupContextType } from "../util/types";

const DATE_FIELDS = ['stock_date']

const TogglePopupContext = createContext<TogglePopupContextType>({
    isOpen: false,
    openPopup: () => {},
    closePopup: () => {}
})

const RowDataContext = createContext<RowDataContextType>({
    rowData: {},
    updateRowData: () => {},
    rowSelect: () => {}
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

    /**
     * Callback for click of table row. 
     * Opens popup and stores column data from row
     * @param data row column data
     */
    function rowSelect(data: DataType) {
        let rowData = {...data}
        DATE_FIELDS.forEach((field) => {
            rowData[field] = formatDateString(rowData[field])
        })
        setOpen(true)
        setRowData(rowData)
    }

    return (
        <TogglePopupContext.Provider value={{isOpen, openPopup, closePopup}}>
            <RowDataContext.Provider value={{rowData, updateRowData, rowSelect}}>
                { children }
            </RowDataContext.Provider>
        </TogglePopupContext.Provider>
    )
} 