import { Component } from "react";
import axios from "axios";

import { DataType, FieldsDataType, FormDataType } from "./util/types";

import Table from './Table'
import { Popup } from './Popups'
import Navbar, {TabData} from './Navbar'
import { AuthContext } from './Login'


type AppState = {
    data: FormDataType
    fields: FieldsDataType
    active: TabData
    rowData: DataType
    hasLoadedData: boolean
    hasLoadedFields: boolean
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
            active: {name: 'instock', type: 'stocks'},
            rowData: {},
            hasLoadedData: false,
            hasLoadedFields: false,
            isAuthenticated: false
        }
    }

    componentDidMount(): void {
        this.getData(this.state.active.name, 'stocks')
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

    
    getData = (name: string, type:string): void => {
        // const LIMIT = 25
        const AUTH_HEADER = this.context.getAuthHeader()
        this.setState({ hasLoadedData: false, hasLoadedFields: false })
        
        axios
            .get(`${process.env.REACT_APP_BASE_URL}/api/${name}/`, {
                headers: AUTH_HEADER
            })
            .then(res => {
                this.setState(() => ({
                    hasLoadedData: true,
                    data: res.data,
                    active: {name: name, type: type},
                }))

            }).catch(error => {
                console.log(error.message)
                console.log(error.response)
            })
        
        axios
            .get(`${process.env.REACT_APP_BASE_URL}/fields/${name}`, {
                headers: AUTH_HEADER
            })
            .then(res => {
                this.setState(() => ({
                    hasLoadedFields: true,
                    fields: res.data
                }))
            }).catch(error => {
                console.log(error.message)
                console.log(error.response)
            })
    }

    isObjectEmpty(obj:DataType): boolean {
        console.log(obj)
        for(let _ in obj) return false
        return true
    }

    render(){
        const tabs = [
            {name: 'instock', type: 'stocks'},
            {name: 'outstock', type: 'stocks'},
            {name: 'groups', type: 'groups'},
            {name: 'items', type: 'items'},
        ]
        let popup:any = null
        return (
            <>
                <Popup
                    ref={instance => {popup = instance}}
                    data={this.state.data}
                    fields={this.state.fields}
                    rowData={this.state.rowData}
                    active={this.state.active}
                    canCut={this.state.active.type === 'stocks'}
                    getData={this.getData}
                />
                <Navbar
                    tabs={tabs}
                    active={this.state.active}
                    showCreateTab={this.state.hasLoadedData && this.state.hasLoadedFields}
                    onClick={(name: string, type: string) => {this.getData(name, type)}}
                    openPopup={(type: string) => popup.openPopup(type)}
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
