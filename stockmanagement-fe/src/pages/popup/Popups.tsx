import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import axios, { AxiosResponse } from "axios"
import { useState } from "react";

import { ErrorState } from "./Errors";
import { Form } from "./Forms";
import { useAuth } from "../context/Login";
import { usePopupToggle, useRowData } from "../context/PopupContextManager";
import { formatDate, title } from "util/strings"

import "styles/buttons.css"
import { ChangePageToType, DataType, FieldsDataType, PageName } from "util/types/PageTypes";
import { INSTOCK_EXCLUDE_FIELDS } from "util/constants";


type PopupProps = {
    isPageLoading: boolean
    currentPageName: PageName
    changePageTo: ChangePageToType
    modalInputs: FieldsDataType
}

type requestMethodParameters = {
    id?:number
    modelName: PageName
    ModelAttributes: DataType
}

export function Popup({isPageLoading, currentPageName, changePageTo, modalInputs}: PopupProps) {
    const authContext = useAuth()

    const {isOpen, closePopup} = usePopupToggle()
    const {rowData, updateRowData, prefillPopup} = useRowData()

    const [errors, setErrors] = useState<ErrorState>({})
    const AUTH_HEADER = authContext.authHeader.current

    function createModelOfType(modelName: PageName, modelAttributes: DataType): Promise<AxiosResponse<any>>{
        return axios.post(`${process.env.REACT_APP_BASE_URL}/api/${modelName}/`, modelAttributes, {
            headers: AUTH_HEADER
        })
    }

    function updateModelOfType(id:number, modelName: PageName, modelAttributes: DataType): Promise<AxiosResponse<any>> {
        console.log(id)
        return axios.put(`${process.env.REACT_APP_BASE_URL}/api/${modelName}/${id}/`, modelAttributes, {
            headers: AUTH_HEADER
        })
    }

    function getRequestMethodFor(id: number|undefined, newPageName:PageName, popupData: DataType): Promise<AxiosResponse<any>>{
        if(id === undefined) return createModelOfType(newPageName, popupData)
        return updateModelOfType(id, newPageName, popupData)
    }

    /**
     * Creates/updates data and then updates table data with new data
     * @param name        Name of router endpoint for Model
     * @param data Contains outstock data to save
     * @param type Type of data: stocks, groups and items
     */
    function createDataFor(newPageName: PageName, popupData: DataType) {

        // Override current data with new data
        let {id, ...newPopupData} = popupData
        console.log(id)
        getRequestMethodFor(id, newPageName, newPopupData).then(() => {
            changePageTo(newPageName)
            closePopup()
            setErrors({})
        })
        .catch(error => {
            setErrors(error.response.data)
        })
    }

    /**
     * Saves field value onChange and configures data for being sent to server
     * @param {string} fieldName Name of the field to store value against, must be same as server attribute
     * @param {string} inputType If inputType is a number convert to float
     * @param {any} value value from filed to update row data
     */
    function changeField(fieldName: string, inputType: string, value: any=undefined){
        if(inputType === 'number' && value !== '')
            value = parseFloat(value)
        if(inputType === 'date' && value){
            value = formatDate(value)
        }

        updateRowData(fieldName, value)
    }


    function moveOutstock(){
        let newRowData = Object.assign({}, rowData)

        INSTOCK_EXCLUDE_FIELDS.forEach(fieldName => {
            if(fieldName in newRowData)
                delete newRowData[fieldName]
        })

        
        changePageTo("outstock")
        prefillPopup(newRowData)
        
        // createData("outstock", 'stocks', {...rowData, id: -1})
    }

    return (
        <div>
            <Dialog open={isOpen && !isPageLoading} onClose={closePopup}>
                <DialogTitle>{title(currentPageName)}</DialogTitle>
                <DialogContent aria-label={`create/edit ${currentPageName} popup`}>
                <form
                    name={`${currentPageName}-form`}
                    aria-label={`create/edit ${currentPageName} form`} 
                    id="popup-form" className="w-full max-w-lg"
                >
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
                        name="cancel-button"
                        className="t-button" 
                        onClick={closePopup}
                    >
                        Cancel
                    </button>
                    <button
                        name="save-button"
                        className="t-button" 
                        onClick={() => createDataFor(currentPageName, rowData)}
                    >
                        Save
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
