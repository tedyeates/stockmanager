import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import axios from "axios"
import { useState } from "react";

import { ErrorState } from "./Errors";
import { Form } from "./Forms";
import { useAuth } from "../context/Login";
import { usePopupToggle, useRowData } from "../context/PopupContextManager";
import { formatDate, title } from "util/strings"

import "styles/buttons.css"
import { ChangePageToType, DataType, FieldsDataType, PageName } from "util/types/PageTypes";


type PopupProps = {
    isPageLoading: boolean
    currentPageName: PageName
    changePageTo: ChangePageToType
    modalInputs: FieldsDataType
}

export function Popup({isPageLoading, currentPageName, changePageTo, modalInputs}: PopupProps) {
    const authContext = useAuth()

    const {isOpen, closePopup} = usePopupToggle()
    const {rowData, updateRowData, prefillPopup} = useRowData()

    const [errors, setErrors] = useState<ErrorState>({})
    const AUTH_HEADER = authContext.authHeader.current

    function createModel(modelName: PageName, modelAttributes: DataType){
        return axios.post(`${process.env.REACT_APP_BASE_URL}/api/${modelName}/`, modelAttributes, {
            headers: AUTH_HEADER
        })
    }

    function updateModel(id:number, modelName: PageName, modelAttributes: DataType){
        return axios.put(`${process.env.REACT_APP_BASE_URL}/api/${modelName}/${id}/`, modelAttributes, {
            headers: AUTH_HEADER
        })
    }

    /**
     * Creates/updates data and then updates table data with new data
     * @param name        Name of router endpoint for Model
     * @param data Contains outstock data to save
     * @param type Type of data: stocks, groups and items
     */
    function createData(newPageName: PageName, popupData: DataType) {
        console.log(popupData)
        // Override current data with new data
        const id = popupData?.id ?? -1
        if(id) delete popupData.id

        const requestMethod = id < 0 ? createModel(newPageName, popupData) : updateModel(id, newPageName, popupData)
        requestMethod.then(() => {
            changePageTo(newPageName)
            closePopup()
            setErrors({})
        })
        .catch(error => {
            console.log(error.response)
            setErrors(error.response.data)
        })
    }

    /**
     * Saves field value onChange and configures data for being sent to server
     * @param {string} fieldName Name of the field to store value against, must be same as server attribute
     * @param {string} inputType If inputType is a number convert to float
     * @param {any} value value from filed to update row data
     */
    function changeField(fieldName: string, inputType: string, value: any=null){
        if(inputType === 'number' && value !== '')
            value = parseFloat(value)
        if(inputType === 'date')
            value = formatDate(value)

        updateRowData(fieldName, value)
    }


    function moveOutstock(){
        let {id, invoice_id, price, purchase_order_id, supplier, ...newRowData} = rowData
        newRowData.instock = rowData.id
        
        changePageTo("outstock")
        prefillPopup(newRowData)
        
        // createData("outstock", 'stocks', {...rowData, id: -1})
    }
    console.log(isOpen)

    return (
        <div>
            <Dialog open={isOpen && !isPageLoading} onClose={closePopup}>
                <DialogTitle>{title(currentPageName)}</DialogTitle>
                <DialogContent>
                <form id="popup-form" className="w-full max-w-lg">
                    <Form 
                        onChange={changeField}
                        errors={errors} 
                        modalInputs={modalInputs}                    
                    />
                </form>
                </DialogContent>
                <DialogActions>
                    {currentPageName === "instock" ?
                        <>
                            <button
                                className="t-button" 
                                onClick={moveOutstock}
                            >
                                Move to Outstock
                            </button>
                            <div style={{flex: '1 0 0'}} />
                        </>
                        :
                        <></>
                        
                    }
                    <button 
                        className="t-button" 
                        onClick={closePopup}
                    >
                        Cancel
                    </button>
                    <button
                        className="t-button" 
                        onClick={() => createData(currentPageName, rowData)}
                    >
                        Save
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
