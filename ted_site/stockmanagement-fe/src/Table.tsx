import { Component, ReactElement } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { title } from './util/strings'

import { StartTag, EndTag } from './Shapes'
import { DataType, FormDataType } from './util/types'

type SearchProps = {
    getSearchOptions: () => Array<DataType>
    addSearchItem: (columnSelected: string, value: string) => void
    removeSearchItem: (columnName: string) => void
    searchedItems: {column: string, data: string}[]
}

type SearchState = {
    autocompleteValue: string
}

class Search extends Component<SearchProps, SearchState> {
    constructor(props: SearchProps){
        super(props)

        this.state = {
            autocompleteValue: ""
        }
    }

    onChangeSwitch(value: DataType): void {
        if (!value) return
        this.setState(() => ({
            columnSelected: false,
            autocompleteValue: ""
        }))
        this.props.addSearchItem(value.column, value.cell)
    }

    onInputChange(value: string, reason: string): void {
        if(reason === "input")
            this.setState({autocompleteValue: value})
    }

    render() {
        return (
            <div className='w-1/2 m-3'>
                <Autocomplete
                    id="table-search"
                    inputValue={this.state.autocompleteValue}
                    freeSolo
                    options={
                        this.props.getSearchOptions()
                        .sort((a,b) => {
                            if(a.column > b.column) return -1
                            if(a.column < b.column) return 1
                            return 0
                        })
                    }
                    groupBy={(option) => title(option.column)}
                    getOptionLabel={option => option ? title(option.cell.toString()) : ''}
                    onInputChange={(_, value, reason) => this.onInputChange(value, reason)}
                    onChange={(_, value) => {if (value !== null && typeof value !== 'string') this.onChangeSwitch(value)}}
                    renderInput={(params) => <TextField {...params} label="Search Table" variant="outlined" />}
                />            
                <div className="h-10 text-left">
                    {this.props.searchedItems.map(({column, data}, index) => (
                        <>
                            <StartTag
                                key={`start-${index}`}
                                size={6}
                                color='blue-700'
                                text={title(column)}
                                className="ml-1"
                            />
                            <EndTag
                                key={`end-${index}`}
                                size={6}
                                color='blue-500'
                                text={data}
                                className="-ml-8"
                                onClick={() => this.props.removeSearchItem(column)}
                            />
                        </>
                    ))}
                </div>
            </div>
        )
    }
}


type ColumnProps = {
    index: number
    name: string
}

function TableColumn({index, name}: ColumnProps){
    return <th className='px-2 py-4' key={index}>{title(name)}</th>
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

    getSearchOptions = (): Array<DataType> => {
        let seenOptions = new Set<string>()
        let searchOptions = new Array<DataType>()
        this.filterRows().forEach(item => {
            Object.entries(item).forEach(([column, cell]) => {
                if (!(cell ?? false)) return
                let searchString = `${column} : ${cell}`

                // Don't allow duplicate search options
                if (!seenOptions.has(searchString)){
                    seenOptions.add(searchString)
                    searchOptions.push({
                        label: searchString,
                        cell: cell,
                        column: column
                    })
                }

            })
        })

        return searchOptions
    }

    renderHeader(): ReactElement {
        console.log(this.props.data)
        return (
            this.props.data.data.length ?
            <tr className="py-4">
                {Object.entries(this.props.data.data[0]).filter(([key, _]) => {
                    return key !== "stock_type"
                }).map(([key, _], index) => {
                    return <TableColumn index={index} name={key} />
                })}
                
                <TableColumn index={-1} name="Total Price" />
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
            return `${relatedData?.code} -- ${relatedData?.description}`
        }
        return value
    }


    renderCell(index:number, value:any, key:string = ''): ReactElement {
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
                    {Object.entries(data).filter(([key, _]) => {
                        return key !== "stock_type"
                    }).map(([key, value]) => {
                        return this.renderCell(index, value, key)
                    })}
                    {this.renderCell(-1, data?.price * data?.quantity)}
                </tr>    
            )
        })
    }

    render(): ReactElement {

        return (
            <>
                <Search 
                    getSearchOptions={this.getSearchOptions}
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