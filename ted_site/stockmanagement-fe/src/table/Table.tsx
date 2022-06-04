import { ReactElement, useState } from "react";
import { Decimal } from 'decimal.js'

import { title } from '../util/strings'
import { DataType } from '../util/types'
import { useLoad } from "../context/ApiContextManager";
import { useRowData } from "../context/PopupContextManager";
import { useData } from "../context/TableContextManager";

type ColumnProps = {
    name: string
}

function TableColumn({name}: ColumnProps){
    return <th className='px-2 py-4'>{title(name)}</th>
}



type TableState = Array<{column: string, data: string}>

function Table() {

    const {data} = useData()
    const { active } = useLoad()
    const { rowSelect } = useRowData()


    function renderHeader(): ReactElement {
        return (
            data.length ?
            <tr key='trhead' className="py-4">
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
                className='px-8 py-4'
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
        return data.map((data: DataType, index:number) => {
            return (
                <tr key={index} onClick={(): void => rowSelect(data)}>
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
        <table className='table-auto border-collapse shadow-lg mr-3'>
            <thead key='thead' className='bg-gray-800 text-gray-100'>
                {renderHeader()}
            </thead>
            <tbody key='tbody'>
                {renderBody()}
            </tbody>
        </table>
    )
}


export default Table