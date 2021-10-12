import { Component } from "react";
import axios from "axios";

import { API_URL } from './constants/dev';

import Table from './Table'
import { Popup } from './Popups'
import Navbar from './Navbar'
import { DataType, FormDataType } from "./util/types";


type AppState = {
    data: FormDataType
    active: string
    rowData: DataType
}

class App extends Component<{},AppState> {
    constructor(props: {}) {
        super(props)

        this.state = {
            data: {
                data: [], 
                fields: [],
            },
            active: 'instock',
            rowData: {},
        }
    }

    componentDidMount(): void {
        this.getData(this.state.active)
    }

    getData = (name: string): void => {
        axios
            .get(`${API_URL}${name}/`)
            .then(res => {
                console.log(res.data)
                this.setState(() => ({
                    data: res.data,
                    active: name,
                }))
            })
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
                    rowData={this.state.rowData}
                    title={this.state.active}
                    canCut={this.state.active === 'instock'}
                    getData={this.getData}
                />
                <Navbar
                    tabs={tabs}
                    active={this.state.active}
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
