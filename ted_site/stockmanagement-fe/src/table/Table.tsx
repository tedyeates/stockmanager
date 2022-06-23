import { ReactElement } from "react";
import { Decimal } from 'decimal.js'

import { title } from '../util/strings'
import { DataType } from '../util/types'
import { useLoad } from "../context/ApiContextManager";
import { useRowData } from "../context/PopupContextManager";
import { useData } from "../context/TableContextManager";
import { EXCLUDED_MODELS } from "../util/constants";

import "../styles/loader.css"
import { LoadingSpinner } from "./LoadingSpinner";

type ColumnProps = {
    name: string
}

function TableColumn({name}: ColumnProps){
    return <th className='table-cell text-left p-2 py-3'>{title(name)}</th>
}


function Table() {

    const {data, hasLoadedData} = useData()
    const {active} = useLoad()
    const {prefillPopup} = useRowData()


    function renderHeader(): ReactElement {
        return (
            data.length ?
            <tr key='trhead' className="table-row">
                {Object.entries(data[0]).filter(([key, _]) => {
                    return key !== "stock_type"
                }).map(([key, _], index) => {
                    return <TableColumn key={`column-${index}`} name={key} />
                })}
                
                {active.name === "instock" && <TableColumn key={`column-total-price`} name="Total Price" />}
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
    function checkArray(value:any){
        if(Array.isArray(value))
            return value.reduce((acc, val) => `${acc} x ${val}`)
        return value
    }


    function renderCell(index:number, value:any, key:string = ''): ReactElement {
        if(value !== null && typeof value === 'object') {
            value = value.name
        }

        return (
            <td 
                data-name={key}
                className='table-cell text-left p-2 border-b border-slate-300'
                key={`${key}-${index}`}
            >
                {checkArray(value)}
            </td>
        )
    }

    function renderExtraCells(data: DataType): ReactElement {
        switch(active.name){
            case "instock": 
                let totalPrice = new Decimal(data?.price * data?.quantity)
                return renderCell(-1, totalPrice.toFixed(2), "extraData")
            default:
                return <></>
            
        }
    }


    function renderBody(): ReactElement[]{
        let onClickFunction = (data: DataType) => prefillPopup(data)
        if(EXCLUDED_MODELS.has(active.name))
            onClickFunction = (data) => null

        return data.map((data: DataType, index:number) => {
            return (
                <tr 
                    key={index} className="table-row" 
                    onClick={() => onClickFunction(data)}
                >
                    {Object.entries(data).filter(([key, _]) => {
                        return key !== "stock_type"
                    }).map(([key, value]) => {
                        return renderCell(index, value, key)
                    })}
                    {renderExtraCells(data)}
                </tr>    
            )
        })
    }

    return (
        <div className="flex justify-center">
            {hasLoadedData ? 
                <table className='table table-auto border-collapse shadow-lg mr-3 w-full'>
                    <thead key='thead' className='table-header-group bg-gray-800 text-gray-100 text-sm whitespace-nowrap'>
                        {renderHeader()}
                    </thead>
                    <tbody key='tbody' className="table-row-group text-sm">
                        {renderBody()}
                    </tbody>
                </table>
            :
                <LoadingSpinner
                    className="h-12 w-12"
                />
            }
        </div>
    )
}


export default Table