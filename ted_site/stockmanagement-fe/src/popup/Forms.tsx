import { ChangeEvent, ReactElement} from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { title } from '../util/strings'
import { DataType, OnChangeType, FieldsDataType } from '../util/types'
import { Error, ErrorState } from './Errors'
import ModelAutocomplete from '../table/ModelAutocomplete';
import { useRowData } from '../context/PopupContextManager';
import { useFields } from '../context/FieldContextProvider';


export type FormProps = {
    onChange: OnChangeType
    errors: ErrorState
}


type Chunk = FieldsDataType


export function Form(props: FormProps) {
    const fields = useFields()
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
            defaultValue={rowData[fieldName] ?? ''}
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

        
        if(selected === undefined){
            selected = new Date()
        }
        else {
            let [year, month, day] = selected.split('-')
            selected = new Date(year, month-1, day)
        }

        return (
            <DatePicker 
                dateFormat='dd/MM/yyyy'
                selected={selected}
                onChange={(date: Date) => props.onChange(fieldName, 'date', date)} 
                customInput={
                    <input type='text' className='form-input react-datepicker-ignore-onclickoutside' value='' />
                }
            />
        )
    }

    /**
     * Returns a select field, used for object relationships
     * @param {String} options List of fields to populate select box
     * @param {String} attrbuttes additional attributes used by Autocomplete tag
     * @returns HTML select with options for each object that can be related
     */
    function generateSelectField(options:any[], attributes:DataType, fieldName:string): ReactElement {
        // Prevent Material UI undefined error
        if ('value' in attributes && !attributes.value) 
            attributes.value = null
        
        return (
            <Autocomplete 
                className='form-dropdown' 
                options={options}
                renderInput={(params) => 
                    <TextField 
                        {...params} 
                        variant="outlined" 
                        size="small" 
                    />
                }
                {...attributes}
            />
        )
    }


    function generateChoiceSelectField(fieldName:string, choices:string[]): ReactElement {
        return generateSelectField(
            choices,
            {
                value: rowData[fieldName],
                onChange: (_:ChangeEvent<{}>, newValue:any) => props.onChange(fieldName, 'text', newValue),
            },
            fieldName
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
            case 'ChoiceField':
                return generateChoiceSelectField(fieldName, choices)
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
    function chunkArray(array: FieldsDataType, size: number): Chunk[] {
        let chunkedArray = []
        for(let i = 0; i < array.length; i += size){
            // Autofield on own line
            if (array[i][1] === 'AutoField'){
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
    function hideAutoField(chunk: Chunk, index: number, size: number): ReactElement {
        let [fieldName, fieldType] = chunk[0]

        // Hide ID fields
        if(fieldType === 'AutoField' && typeof fieldName === 'string')
            return (
                <div key={index}>
                    {generateInputField('hidden', fieldName)}
                </div>
            )
        
        // Display fields in groups
        return (
            <div key={index} className="flex flex-wrap -mx-3 mb-6">
                {chunk.map((field, index) => {
                    if(typeof field === 'object'){
                        let [fieldName, fieldType, choices] = field
                        return (
                            <div key={index} className={`w-full md:w-1/${size} px-3 mb-6 md:mb-0`}>
                                {generateField(fieldName, fieldType, choices)}
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
            {chunkArray(fields, size).map((chunk, index) => {
                return hideAutoField(chunk, index, size)
            })}
        </div>
    )
}

