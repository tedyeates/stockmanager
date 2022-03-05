import Button from "@mui/material/Button"
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import axios, { AxiosResponse } from "axios"
import { Component } from "react"

import { CutForm } from "./CutForm"
import { Form } from "./Forms"
import { AuthContext } from "./Login";
import { TabData } from "./Navbar";
import { title } from "./util/strings"
import { DataType, FieldsDataType, FormDataType } from "./util/types"

type PopupProps = {
    data: FormDataType
    fields: FieldsDataType
    rowData: DataType
    active: TabData
    canCut: boolean
    getData: (name:string,type:string) => void
}

type PopupState = {
    rowData: DataType
    errors: DataType
    open: boolean
}

export class Popup extends Component<PopupProps, PopupState> {
    static contextType = AuthContext

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
            errors: {}
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
     * @param data row column data
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
     * @param name Model to update
     * @param data Data for update/create
     * @param id  Id of model to update
     * @returns 
     */
    checkUpdate(name: string, data: DataType, id:number=-1): Promise<AxiosResponse<any>>{
        const AUTH_HEADER = this.context.getAuthHeader()
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
    createData(name: string, type: string, popupData: DataType): void {
        // Override current data with new data
        const id = popupData?.id ?? -1
        if(id) delete popupData.id

        this.checkUpdate(name, popupData, id)
            .then(res => {
                this.props.getData(name, type)
                this.setState({
                    errors: {}
                })
                this.closePopup()
            })
            .catch(error => {
                console.log(error.response)
                this.setState({
                    errors: error.response.data
                })
            })
    }

    moveOutstock(data: DataType): void {
        
    }


    /**
     * Saves field value onChange and configures data for being sent to server
     * @param {Event}  event     Onchange event triggering function, contains field value
     * @param {String} fieldName Name of the field to store value against, must be same as server attribute
     * @param {String} inputType If inputType is a number convert to float
     */
    changeField = (fieldName: string, inputType: string, value: any=null): void => {
        value = inputType === 'number' && value !== '' ? parseFloat(value) : value
        // Arrow function ensures this refers to Popup when called from Form
        this.setState(({rowData}) => ({
            rowData: {
                ...rowData,
                [fieldName]: value
            }
        }))
    }

    /**
     * Checks if item type provided and returns currently selected item type if found
     * @returns item type string which is OTHER/BAR/SHEET
     */
    getItemType(): string {
        const item = this.props.data?.item
        const itemId = this.state.rowData?.item
        if (item && itemId) 
           return item[itemId].item_type

        return 'OTHER'
    }

    render() {
        return (
        <div>
            <Dialog open={this.state.open} onClose={this.closePopup}>
                <DialogTitle>{title(this.props.active.name)}</DialogTitle>
                <DialogContent>
                <form id="popup-form" className="w-full max-w-lg">
                    <Form 
                        data={this.props.data}
                        fields={this.props.fields}
                        onChange={this.changeField}
                        rowData={this.state.rowData}
                        errors={this.state.errors}
                    />
                    {this.props.canCut ?
                        <>
                            <CutForm
                                itemData={this.props.data.item} 
                                rowData={this.state.rowData}
                                itemType={this.getItemType()}
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
                    {this.props.active.name === "instock" ?
                        <>
                            <Button
                                variant="outlined"
                                className="pc-button" 
                                onClick={() => this.createData(this.props.active.name, 'stocks', {
                                    ...this.state.rowData, 
                                    id: -1, 
                                    is_instock: false
                                })}
                            >
                                Move to Outstock
                            </Button>
                            <div style={{flex: '1 0 0'}} />
                        </>
                        :
                        <></>
                        
                    }
                    <Button 
                        variant="outlined"
                        className="pc-button" 
                        onClick={this.closePopup}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outlined"
                        className="pc-button" 
                        onClick={() => this.createData(this.props.active.name, this.props.active.type, this.state.rowData)}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
          </div>
        )
    }
}
