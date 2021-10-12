import Button from "@mui/material/Button"
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import axios, { AxiosResponse } from "axios"
import { Component } from "react"
import { API_URL } from "./constants/dev"

import { CutForm } from "./CutForm"
import { Form } from "./Forms"
import { title } from "./util/strings"
import { DataType, FormDataType } from "./util/types"

type PopupProps = {
    data: FormDataType
    rowData: DataType
    
    title: string
    canCut: boolean
    getData: (name:string) => void
}

type PopupState = {
    rowData: DataType
    errors: DataType
    open: boolean
}

export class Popup extends Component<PopupProps, PopupState> {

    constructor(props: PopupProps) {
        super(props)

        this.state = {
            rowData: {},
            errors: {},
            open: false
        }
    }

    /**
     * Clode popup on cancel
     */
    closePopup = (): void => {
        this.setState({
            open: false,
            rowData: {},
        })
    }

    /**
     * Open popup
     */
    openPopup = (): void => {
        this.setState({
            open: true,
        })
    }
    
    /**
     * Callback for click of table row. 
     * Opens popup and stores column data from row
     * @param {Object} data row column data
     */
    rowSelect(data: DataType): void {
        let {date, modified, ...rowData} = data
        this.setState({
            open: true,
            rowData: rowData
        })
    }
    

    /**
     * Check if id provided then update else create
     * @param {String} name Model to update
     * @param {Object} data Data for update/create
     * @param {Integer} id  Id of model to update
     * @returns 
     */
    checkUpdate(name: string, data: DataType, id:number=-1): Promise<AxiosResponse<any>>{
        if (id < 0) 
            return  axios.post(`${API_URL}${name}/`, data)
        return axios.put(`${API_URL}${name}/${id}/`, data)
    }
    

    /**
     * Creates/updates data and then updates table data with new data
     * @param {String} name        Name of router endpoint for Model
     */
    createData(name: string, popupData: DataType): void{
        console.log("create")
        console.log(popupData)
        // Override current data with new data
        const id = popupData?.id ?? -1
        if(id) delete popupData.id

        this.checkUpdate(name, popupData, id)
            .then((res) => {
                this.props.getData(name)
                this.setState({
                    errors: {}
                })
                this.closePopup()
            })
            .catch((error) => {
                console.log(error.response.data)
                this.setState({
                    errors: error.response.data
                })
            })
    }


    /**
     * Saves field value onChange and configures data for being sent to server
     * @param {Event}  event     Onchange event triggering function, contains field value
     * @param {String} fieldName Name of the field to store value against, must be same as server attribute
     * @param {String} inputType If inputType is a number convert to float
     */
    changeField = (fieldName: string, inputType: string, value: any=null): void => {
        value = inputType === 'number' ? parseFloat(value) : value
        
        // Arrow function ensures this refers to Popup when called from Form
        this.setState(({rowData}) => ({
            rowData: {
                ...rowData,
                [fieldName]: value
            }
        }))
    }

    render() {
        return (
        <div>
            <Dialog open={this.state.open} onClose={this.closePopup}>
                <DialogTitle>{title(this.props.title)}</DialogTitle>
                <DialogContent>
                <form id="popup-form" className="w-full max-w-lg">
                    <Form 
                        data={this.props.data}
                        onChange={this.changeField}
                        rowData={this.state.rowData}
                        errors={this.state.errors}
                    />
                    {this.props.canCut ?
                        <>
                            <CutForm
                                itemData={this.props.data.item} 
                                rowData={this.state.rowData}
                                onChange={this.changeField}
                                errors={this.state.errors}
                            />
                        </>
                        : 
                        <></>
                    }
                </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.closePopup}>Cancel</Button>
                    <Button onClick={() => this.createData(this.props.title, this.state.rowData)}>Save</Button>
                </DialogActions>
            </Dialog>
          </div>
        )
    }
}
