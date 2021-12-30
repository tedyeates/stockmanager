import { Component } from "react";
import axios from "axios";

import { API_URL, FIELDS_URL } from './constants/dev';

import Table from './Table'
import { Popup } from './Popups'
import Navbar from './Navbar'
import { DataType, FieldsDataType, FormDataType } from "./util/types";


type AppState = {
    data: FormDataType
    fields: FieldsDataType
    active: string
    rowData: DataType
    hasLoaded: boolean
}

class App extends Component<{},AppState> {
    constructor(props: {}) {
        super(props)

        this.state = {
            data: {
                data: [], 
            },
            fields: [],
            active: 'instock',
            rowData: {},
            hasLoaded: false,
        }
    }

    componentDidMount(): void {
        this.getData(this.state.active)
    }

    getDataPagination = (name: string, nextPage: string): void => {
        if(!nextPage) return
        axios
            .get(nextPage)
            .then(res => {
                this.setState(({data}) => ({
                    data: {
                        ...data,
                        data: [
                            ...data.data,
                            ...res.data.data
                        ],
                    },
                    active: name,
                }))

                this.getDataPagination(name, res.data.next)
            })
    }

    
    getData = (name: string): void => {
        const LIMIT = 25
        this.setState({ hasLoaded: false })

        axios
            .get(`${API_URL}${name}/?limit=${LIMIT}`)
            .then(res => {
                console.log(res.data)
                this.setState(() => ({
                    data: res.data,
                    active: name,
                }))

                this.getDataPagination(name, `${API_URL}${name}/?offset=${LIMIT}`)
            })

            

        let fieldsName = name
        if(fieldsName === 'instock' || fieldsName === 'outstock')
            fieldsName = 'stocks'

        axios
            .get(`${FIELDS_URL}${fieldsName}`)
            .then(res => {
                this.setState(() => ({
                    hasLoaded: true,
                    fields: res.data
                }))
            })
    }

    isObjectEmpty(obj:DataType): boolean {
        console.log(obj)
        for(let _ in obj) return false
        return true
    }

    render(){
        const tabs = [
            'instock',
            'outstock',
            'groups',
            'items',
        ]
        let popup:any = null
        return (
            <>
                <Popup
                    ref={instance => {popup = instance}}
                    data={this.state.data}
                    fields={this.state.fields}
                    rowData={this.state.rowData}
                    title={this.state.active}
                    canCut={this.state.active === 'instock'}
                    getData={this.getData}
                />
                <Navbar
                    tabs={tabs}
                    active={this.state.active}
                    showCreateTab={this.state.hasLoaded}
                    onClick={(name: string) => {this.getData(name)}}
                    openPopup={() => popup.openPopup()}
                />
                <div
                    className="flex p-5 pt-16 flex-col text-center"
                    style={{ minWidth: "100vw", minHeight: "100vh" }}
                >
                    <Table
                        data={this.state.data}
                        rowClick={(data) => popup.rowSelect(data)}
                    />
                </div>
            </>
        )
    }
}



export default App;
