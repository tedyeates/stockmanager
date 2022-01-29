import { Component, ReactElement } from "react";
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import { title } from './util/strings'

import { StartTag, EndTag } from './Shapes'
import { DataType, FormDataType } from './util/types'

type SearchProps = {
    getSearchOptions: (column: string, columnSelected: boolean) => Set<string>
    addSearchItem: (columnSelected: string, value: string) => void
    removeSearchItem: (columnName: string) => void
    searchedItems: {column: string, data: string}[]
}

type SearchState = {
    columnSelected: boolean
    currentColumn: string
    autocompleteValue: string
}

class Search extends Component<SearchProps, SearchState> {
    constructor(props: SearchProps){
        super(props)

        this.state = {
            columnSelected: false,
            currentColumn: "",
            autocompleteValue: ""
        }
    }

    onChangeSwitch(value: string): void {
        if (!value) return
        if (this.state.columnSelected) {
            this.setState(() => ({
                columnSelected: false,
                autocompleteValue: ""
            }))
            this.props.addSearchItem(this.state.currentColumn, value)
            return
        }

        this.setState({
            currentColumn: value,
            columnSelected: true,
            autocompleteValue: ""
        })
    }

    onInputChange(value: string, reason: string): void {
        if(reason === "input")
            this.setState({autocompleteValue: value})
    }

    render() {
        const columnsLabel = this.state.columnSelected ? this.state.currentColumn : "Columns"
        return (
            <div className='w-1/2 m-3'>
                <Autocomplete
                    id="table-search"
                    inputValue={this.state.autocompleteValue}
                    freeSolo={this.state.columnSelected}
                    options={
                        [...this.props.getSearchOptions(this.state.currentColumn, this.state.columnSelected)].sort()
                    }
                    getOptionSelected={option => option !== ''}
                    getOptionLabel={option => option ? title(option.toString()) : ''}
                    onInputChange={(_, value, reason) => this.onInputChange(value, reason)}
                    onChange={(_, value) => {if (value !== null) this.onChangeSwitch(value)}}
                    renderInput={(params) => <TextField {...params} label={columnsLabel} variant="outlined" />}
                />            
                <div className="h-5 text-left">
                    {this.props.searchedItems.map(({column, data}, index) => (
                        <>
                            <StartTag
                                key={`start-${index}`}
                                size={6}
                                color='blue-700'
                                text={title(column)}
                                className="ml-1"
                                onClick={() => this.props.removeSearchItem(column)}
                            />
                            <EndTag
                                key={`end-${index}`}
                                size={6}
                                color='blue-500'
                                text={data}
                                className="-ml-8"
                            />
                        </>
                    ))}
                </div>
            </div>
        )
    }
}


type TableProps = {
    data: FormDataType
    rowClick: (data: DataType) => void
}

type TableState = {
    search: {column: string, data: string}[]
}

class Table extends Component<TableProps, TableState> {
    constructor(props: TableProps) {
        super(props)
        this.state = {
            search: []
        }
    }

    removeSearchItem(columnName: string){
        this.setState({
            search: this.state.search.filter(({column}) => columnName !== column)
        })
    }

    addSearchItem(currentColumn: string, value: string): void{
        this.setState(({search}) => ({
            search: [
                ...search, 
                {
                    column: currentColumn, 
                    data: value
                }
            ],
        }))
    }

    filterRows(): {[key: string]: any}[] {
        return this.props.data.data.filter(row => 
            // If no search return everything else filter out rows that dont contain all search items
            !this.state.search || (this.state.search && this.state.search.every(({column, data}) => 
                String(row[column]) === data
            ))
        )
    }

    getSearchOptions(column: string, columnSelected: boolean): Set<string>{
        if (this.props.data.data.length < 1)
            return new Set<string>([])
        
        if (columnSelected) {
            return new Set<string>(this.filterRows().map(data => {
                return String(data[column])
            }))
        }
        
        return new Set<string>(Object.keys(this.props.data.data[0]))
    }

    
    renderHeader(): ReactElement {
        return (
            this.props.data.data.length ?
            <tr className="py-4">
                {Object.entries(this.props.data.data[0]).map(([key, _], index) => {
                    return <th className='px-2 py-4' key={index}>{title(key)}</th>
                })}
            </tr>
            :
            <></>
        )
    }


    /**
     * Check if field is a list and if so reduces it to a diplayable string
     * @param value Field value or array value
     * @returns Display value
     */
    checkArray(value:any){
        if(Array.isArray(value))
            return value.reduce((acc, val) => `${acc} x ${val}`)
        return value
    }


    /**
     * If foreign key field, lookup id and display name of object instead of id
     * @param fieldName For checking if data is normal field data or related field data
     * @param value Field value or foreign key id
     * @returns Display value
     */
    idToName(fieldName: string, value: any): any {
        if(fieldName in this.props.data) {
            const relatedData = this.props.data[fieldName][value]
            return relatedData?.name
        }
        return value
    }


    renderCell(key: string, index:number, value:any): ReactElement {
        return (
            <td 
                data-name={key}
                className='px-8 py-4'
                key={`${key}-${index}`}
            >
                {this.checkArray(this.idToName(key, value))}
            </td>
        )
    }

    renderBody(): ReactElement[]{
        return this.filterRows().map((data, index) => {
            return (
                <tr key={index} onClick={(): void => this.props.rowClick(data)}>
                    {Object.entries(data).map(([key, value]) => {
                        return this.renderCell(key, index, value)
                    })}
                </tr>    
            )
        })
    }

    render(): ReactElement {
        return (
            <>
                <Search 
                    getSearchOptions={(column, columnSelected) => this.getSearchOptions(column, columnSelected)}
                    searchedItems={this.state.search}
                    addSearchItem={(columnSelected, value) => this.addSearchItem(columnSelected, value)}
                    removeSearchItem={(columnName) => this.removeSearchItem(columnName)}
                />
                <table className='table-auto border-collapse shadow-lg mr-3'>
                    <thead className='bg-gray-800 text-gray-100'>
                        {this.renderHeader()}
                    </thead>
                    <tbody>
                        {this.renderBody()}
                    </tbody>
                </table>
            </>
        )
    }

}

export default Table