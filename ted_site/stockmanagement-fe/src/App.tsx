import { Component } from "react";
import axios from "axios";

import { DataType, FieldsDataType, FormDataType } from "./util/types";

import Table from './Table'
import { Popup } from './Popups'
import Navbar from './Navbar'
import { AuthContext } from './Login'


type AppState = {
    data: FormDataType
    fields: FieldsDataType
    active: string
    rowData: DataType
    hasLoaded: boolean
    isAuthenticated: boolean
}

class App extends Component<{},AppState> {
    static contextType = AuthContext
    
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
            isAuthenticated: false
        }
    }

    componentDidMount(): void {
        this.getData(this.state.active)
    }

    // TODO: Relook at pagnation and caching/indexing
    // getDataPagination = (name: string, nextPage: string, header: DataType): void => {
    //     if(!nextPage) return
    //     axios
    //         .get(nextPage, {
    //             headers: header
    //         })
    //         .then(res => {
    //             this.setState(({data}) => ({
    //                 data: {
    //                     ...data,
    //                     data: [
    //                         ...data.data,
    //                         ...res.data.data
    //                     ],
    //                 },
    //                 active: name,
    //             }))

    //             this.getDataPagination(name, res.data.next, header)
    //         })
    // }

    
    getData = (name: string): void => {
        // const LIMIT = 25
        const AUTH_HEADER = this.context.getAuthHeader()
        this.setState({ hasLoaded: false })
        
        axios
            .get(`${process.env.REACT_APP_BASE_URL}/api/${name}/`, {
                headers: AUTH_HEADER
            })
            .then(res => {
                this.setState(() => ({
                    data: res.data,
                    active: name,
                }))

            })

            

        let fieldsName = name
        if(fieldsName === 'instock' || fieldsName === 'outstock')
            fieldsName = 'stocks'

        axios
            .get(`${process.env.REACT_APP_BASE_URL}/fields/${fieldsName}`, {
                headers: AUTH_HEADER
            })
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
                    canCut={this.state.active === 'instock' || this.state.active === 'outstock'}
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
