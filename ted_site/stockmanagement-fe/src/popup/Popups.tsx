import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import axios, { AxiosResponse } from "axios"
import { useState } from "react";

import { useLoad } from "../context/ApiContextManager";
import { ErrorState } from "./Errors";
import { Form } from "./Forms";
import { useAuth } from "../context/Login";
import { usePopupToggle, useRowData } from "../context/PopupContextManager";
import { formatDate, title } from "../util/strings"
import { DataType } from "../util/types"
import { useFields } from "../context/FieldContextProvider";

import "../styles/buttons.css"


export function Popup() {
    const authContext = useAuth()

    const {active, setActive} = useLoad()
    const {hasLoadedField} = useFields()

    const {isOpen, closePopup} = usePopupToggle()
    const {rowData, updateRowData, prefillPopup} = useRowData()

    const [errors, setErrors] = useState<ErrorState>({})
    

    /**
     * Check if id provided then update else create
     * @param name Model to update
     * @param data Data for update/create
     * @param id  Id of model to update
     * @returns 
     */
    function checkUpdate(name: string, data: DataType, id:number=-1): Promise<AxiosResponse<any>>{
        const AUTH_HEADER = authContext.authHeader.current
        if (id < 0) 
            return  axios.post(`${process.env.REACT_APP_BASE_URL}/api/${name}/`, data, {
                headers: AUTH_HEADER
            })
        return axios.put(`${process.env.REACT_APP_BASE_URL}/api/${name}/${id}/`, data, {
            headers: AUTH_HEADER
        })
    }
    

    /**
     * Creates/updates data and then updates table data with new data
     * @param name        Name of router endpoint for Model
     * @param data Contains outstock data to save
     * @param type Type of data: stocks, groups and items
     */
    function createData(name: string, type: string, popupData: DataType) {
        console.log(popupData)
        // Override current data with new data
        const id = popupData?.id ?? -1
        if(id) delete popupData.id

        checkUpdate(name, popupData, id)
            .then(res => {
                setActive({name: name, type: type})
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
        console.log(newRowData)
        setActive({name:"outstock", type:"stock"})
        prefillPopup(newRowData)
        
        // createData("outstock", 'stocks', {...rowData, id: -1})
    }


    return (
        <div>
            <Dialog open={isOpen && hasLoadedField} onClose={closePopup}>
                <DialogTitle>{title(active.name)}</DialogTitle>
                <DialogContent>
                <form id="popup-form" className="w-full max-w-lg">
                    <Form 
                        onChange={changeField}
                        errors={errors}
                    />
                </form>
                </DialogContent>
                <DialogActions>
                    {active.name === "instock" ?
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
                        onClick={() => createData(active.name, active.type, rowData)}
                    >
                        Save
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
