import {ReactElement} from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";


import { title } from '../../util/strings'
import { Error, ErrorState } from './Errors'
import ModelAutocomplete from '../table/ModelAutocomplete';
import { useRowData } from '../context/PopupContextManager';

import "styles/forms.css"
import { DataType, FieldsDataType } from '../../util/types/PageTypes';


export type FormProps = {
    onChange: (fieldName: string, inputType: string, value: any) => void
    modalInputs:FieldsDataType
    errors: ErrorState
}



export function Form(props: FormProps) {
    const { rowData } = useRowData()
    
    /**
     * Creates input field
     * @param {String} inputType Type of input field, text and number conversion supported
     * @param {String} fieldName Used for field name attribute
     * @param {Object} extras    Add additional attributes to input e.g. step for decimals
     * @returns 
     */
    function generateInputField(inputType: string, fieldName: string, extras?:DataType): ReactElement {
        return <input 
            type={inputType} 
            name={fieldName} 
            className='form-input' 
            id={fieldName}
            onChange={(event) => props.onChange(fieldName, inputType, event.target.value)}
            value={rowData[fieldName] ?? ''}
            {...extras}
        />
    }

    /**
     * Create date picker field
     * @param {String} fieldName Used for field name attribute
     * @returns JSX DatePicker component
     */
    function generateDateField(fieldName: string): ReactElement{
        let selected = rowData[fieldName]

        
        if(selected){
            let [year, month, day] = selected.split('-')
            selected = new Date(year, month-1, day)
        }

        return (
            <DatePicker 
                dateFormat='dd/MM/yyyy'
                name={fieldName}
                selected={selected}
                onChange={(date: Date) => props.onChange(fieldName, 'date', date)} 
                customInput={
                    <input type='text' aria-label={fieldName} className='form-input react-datepicker-ignore-onclickoutside' value='' />
                }
            />
        )
    }

    function generateModelSelectField(fieldName:string): ReactElement {
        return (
            <ModelAutocomplete 
                modelType={fieldName}
                value={rowData[fieldName] ?? {}}
                onChange={props.onChange}
            />
        )

    }


    /**
     * Generates a field input based on fieldType
     * @param {String} fieldName Used for field name attribute
     * @param {String} fieldType Used for deciding which type of field to display
     * @param {String} choices List of choices for the field if ChoiceField
     * @returns HTML input field
     */
    function checkFieldType(fieldName: string, fieldType: string, choices: string[]): ReactElement {
        switch(fieldType){
            case 'DecimalField':
                return generateInputField('number', fieldName, {step: '.01'})
            case 'IntegerField':
                return generateInputField('number', fieldName)
            case 'ForeignKey':
                return generateModelSelectField(fieldName)
            case 'DateField':
                return generateDateField(fieldName)
            default:
                return generateInputField('text', fieldName)
        }
    }

    
    /**
     * Creates a label for the field and field
     * @param {String} fieldName Name of field to be used as label and field name attribute
     * @param {String} fieldType Type of field to be displayed
     * @param {String} choices List of choices for the field if ChoiceField
     * @returns HTML elements field label and field
     */
    function generateField(fieldName: string, fieldType: string, choices: string[]): ReactElement {
        return (
            <>
                <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-first-name">
                    {title(fieldName)}
                </label>
                {checkFieldType(fieldName, fieldType, choices)}
                <Error 
                    fieldName={fieldName}
                    errors={props.errors}
                />
            </>
        )

    }

    /**
     * Covert list into a list of chunks which are lists of length size
     * @param {List}    array contains list data to be chuncked
     * @param {Integer} size  size of chunks to divide array into 
     * @returns a list of lists containg the same data has array but in chunks
     */
    function chunkArray(array: FieldsDataType, size: number): FieldsDataType[] {
        let chunkedArray = []
        for(let i = 0; i < array.length; i += size){
            // Autofield on own line
            if (array[i].fieldType === 'AutoField'){
                chunkedArray.push([array[i]])
                i++
            } 
            // Group other rows
            chunkedArray.push(array.slice(i, i + size))
        }

        return chunkedArray
    }

    /**
     * If input is Id create hidden field so user cannot enter, otherwise display the field
     * @param {List}    chunk List of fields to display on one row
     * @param {Integer} index Unique value to use as row key if using loop
     * @param {Integer} size  length of chunk to size columns correctly
     * @returns size number of fields grouped in a row
     */
    function hideAutoField(chunk: FieldsDataType, index: number, size: number): ReactElement {
        let {fieldName, fieldType} = chunk[0]

        // Hide ID fields
        if(fieldType === 'AutoField' && typeof fieldName === 'string')
            return (
                <div key={index}>
                    {generateInputField('hidden', fieldName)}
                </div>
            )
        
        // Display fields in groups
        return (
            <div key={index} className="flex -mx-3 mb-6">
                {chunk.map((field, index) => {
                    if(typeof field === 'object'){
                        let {fieldName, fieldType, fieldChoices} = field
                        return (
                            <div key={index} className={`input-container w-full md:w-1/${size} px-3 mb-6 md:mb-0`}>
                                {generateField(fieldName, fieldType, fieldChoices)}
                            </div>
                        )
                    }
                    else {
                        return <></>
                    }
                })}
            </div>
        )
    }


    const size = 2
    return (
        <div>
            {chunkArray(props.modalInputs, size).map((chunk, index) => {
                return hideAutoField(chunk, index, size)
            })}
        </div>
    )
}

