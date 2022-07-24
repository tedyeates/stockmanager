import { ReactElement } from "react";
import { Decimal } from 'decimal.js'

import { title } from 'util/strings'
import { useRowData } from "pages/context/PopupContextManager";
import { EXCLUDED_MODELS } from "util/constants";

import "styles/loader.css"
import { LoadingSpinner } from "./LoadingSpinner";
import { DataType, DataTypeArray } from "util/types/PageTypes";

type TableProps = {
    pageData: DataTypeArray
    isPageLoading: boolean
    currentPageName: string
    hasHighlightedColumns?: boolean
}

type ColumnProps = {
    name: string
}

function TableColumn({name}: ColumnProps){
    return <th className='table-cell text-left p-2 py-3'>{title(name)}</th>
}



function Table({hasHighlightedColumns, pageData, isPageLoading, currentPageName}:TableProps) {
    const {prefillPopup} = useRowData()

    function renderHeader(): ReactElement {
        return (
            pageData.length ?
            <tr key='trhead' className="table-row">
                {Object.entries(pageData[0]).filter(([key, _]) => {
                    return key !== "stock_type"
                }).map(([key, _], index) => {
                    return <TableColumn key={`column-${index}`} name={key} />
                })}
                
                {currentPageName === "instock" && <TableColumn key={`column-total-price`} name="Total Price" />}
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


    function renderCell(rowIndex:number, colIndex:number, value:any, key:string = ''): ReactElement {
        if(value !== null && typeof value === 'object') {
            value = value.name
        }
        
        let backgroundClass = "background-color"
        let borderClass = "border-b"
        if(colIndex % 2 === 0 && hasHighlightedColumns) {
            console.log("darker backgroundColor")
            backgroundClass = "highlighted-background-color"
        }

        if(!hasHighlightedColumns) {
            borderClass = "border"
        }

        return (
            <td 
                data-name={key}
                className={`table-cell text-left p-2 ${borderClass} dark-outline ${backgroundClass}`}
                key={`${key}-${rowIndex}`}
            >
                {checkArray(value)}
            </td>
        )
    }

    function renderExtraCells(pageData: DataType, colIndex:number): ReactElement {
        switch(currentPageName){
            case "instock": 
                let totalPrice = new Decimal(pageData?.price * pageData?.quantity)
                return renderCell(-1, colIndex, totalPrice.toFixed(2), "extrapageData")
            default:
                return <></>
            
        }
    }


    function renderBody(): ReactElement[]{
        let onClickFunction = (pageData: DataType) => prefillPopup(pageData)
        if(EXCLUDED_MODELS.has(currentPageName))
            onClickFunction = (pageData) => null
        return pageData.map((pageData: DataType, rowIndex:number) => {
            let lastColIndex = 0
            return (
                <tr 
                    key={rowIndex} className="table-row" 
                    onClick={() => onClickFunction(pageData)}
                >
                    {Object.entries(pageData).filter(([key, _]) => {
                        return key !== "stock_type"
                    }).map(([key, value], colIndex) => {
                        lastColIndex = colIndex
                        return renderCell(rowIndex, colIndex, value, key)
                    })}
                    {renderExtraCells(pageData, lastColIndex + 1)}
                </tr>    
            )
        })
    }

    return (
        <div className="flex justify-center">
            {isPageLoading ? 
                <LoadingSpinner
                    className="h-12 w-12"
                />
            :
                <table className='table table-auto border-collapse shadow-lg mr-3 w-full'>
                    <thead key='thead' className='table-header-group border border-gray-800 bg-gray-800 text-gray-100 text-sm whitespace-nowrap'>
                        {renderHeader()}
                    </thead>
                    <tbody key='tbody' className={`table-row-group text-sm border dark-outline text-dark-color`}>
                        {renderBody()}
                    </tbody>
                </table>
            }
        </div>
    )
}


export default Table