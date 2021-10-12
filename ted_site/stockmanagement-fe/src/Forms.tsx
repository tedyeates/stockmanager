import { ChangeEvent, Component, ReactElement} from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { title } from './util/strings'
import { DataType, FormDataType, OnChangeType, FieldsDataType } from './util/types'


type ErrorProps = {
    fieldName: string
    errors: {
        [key: string]: string[]
    }
}
export function Error({fieldName, errors}:ErrorProps):ReactElement {
    if (fieldName in errors)
        return (
            <div className='text-red-500'>
                {errors['size']}
            </div>
        )
    return <></>
}


export type FormProps = {
    data: FormDataType
    onChange: OnChangeType
    rowData: DataType
    errors: DataType
}

type FormState = {
    startDate: Date
    inputValue: string
}

type Chunk = FieldsDataType

export class Form extends Component<FormProps, FormState> {
    constructor(props: FormProps){
        super(props)
        this.state = {
            startDate: new Date(),
            inputValue: '',
        }

    }

    /**
     * Creates input field
     * @param {String} inputType Type of input field, text and number conversion supported
     * @param {String} fieldName Used for field name attribute
     * @param {Object} extras    Add additional attributes to input e.g. step for decimals
     * @returns 
     */
    generateInputField(inputType: string, fieldName: string, extras?:DataType): ReactElement {
        return <input 
            type={inputType} 
            name={fieldName} 
            className='form-input' 
            id={fieldName}
            onChange={(event) => this.props.onChange(fieldName, inputType, event.target.value)}
            defaultValue={this.props.rowData[fieldName] ?? ''}
            {...extras}
        />
    }

    /**
     * Create date picker field
     * @param {String} fieldName Used for field name attribute
     * @returns JSX DatePicker component
     */
    generateDateField(fieldName: string): ReactElement{
        return (
            <DatePicker 
                dateFormat='dd/MM/yyyy'
                selected={this.state.startDate} 
                onChange={(date: Date) => this.setState({startDate: date})} 
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
    generateSelectField(options:any[], attributes:DataType): ReactElement {
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
                inputValue={this.state.inputValue}
                onInputChange={
                    (_, newInputValue) => this.setState({inputValue: newInputValue})
                }
                {...attributes}
            />
        )
    }


    generateChoiceSelectField(fieldName:string, choices:string[]): ReactElement {
        return this.generateSelectField(
            choices,
            {
                value: this.props.rowData[fieldName],
                onChange: (_:ChangeEvent<{}>, newValue:any) => this.props.onChange(fieldName, 'text', newValue),
            }
        )
    }


    generateModelSelectField(fieldName:string): ReactElement {
        const dataId = this.props.rowData[fieldName]
        const options=Object.values(this.props.data[fieldName])
        return this.generateSelectField(
            options,
            {
                value: this.props.data[fieldName][dataId],
                onChange: (_:ChangeEvent<{}>, newValue:any) => this.props.onChange(fieldName, 'number', newValue?.id),
                getOptionLabel: (option:any) => option ? (option.name ?? option.code ?? '') : '',
            }
        )
    }


    /**
     * Generates a field input based on fieldType
     * @param {String} fieldName Used for field name attribute
     * @param {String} fieldType Used for deciding which type of field to display
     * @param {String} choices List of choices for the field if ChoiceField
     * @returns HTML input field
     */
    checkFieldType(fieldName: string, fieldType: string, choices: string[]): ReactElement {
        switch(fieldType){
            case 'ChoiceField':
                return this.generateChoiceSelectField(fieldName, choices)
            case 'DecimalField':
                return this.generateInputField('number', fieldName, {step: '.01'})
            case 'IntegerField':
                return this.generateInputField('number', fieldName)
            case 'ForeignKey':
                return this.generateModelSelectField(fieldName)
            case 'DateField':
                return this.generateDateField(fieldName)
            default:
                return this.generateInputField('text', fieldName)
        }
    }

    /**
     * Creates a label for the field and field
     * @param {String} fieldName Name of field to be used as label and field name attribute
     * @param {String} fieldType Type of field to be displayed
     * @param {String} choices List of choices for the field if ChoiceField
     * @returns HTML elements field label and field
     */
    generateField(fieldName: string, fieldType: string, choices: string[]): ReactElement {
        return (
            <>
                <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-first-name">
                    {title(fieldName)}
                </label>
                {this.checkFieldType(fieldName, fieldType, choices)}
                <Error 
                    fieldName={fieldName}
                    errors={this.props.errors}
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
    chunkArray(array: FieldsDataType, size: number): Chunk[] {
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
        console.log(chunkedArray)
        return chunkedArray
    }

    /**
     * If input is Id create hidden field so user cannot enter, otherwise display the field
     * @param {List}    chunk List of fields to display on one row
     * @param {Integer} index Unique value to use as row key if using loop
     * @param {Integer} size  length of chunk to size columns correctly
     * @returns size number of fields grouped in a row
     */
    hideAutoField(chunk: Chunk, index: number, size: number): ReactElement {
        let [fieldName, fieldType] = chunk[0]

        // Hide ID fields
        if(fieldType === 'AutoField' && typeof fieldName === 'string')
            return (
                <div key={index}>
                    {this.generateInputField('hidden', fieldName)}
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
                                {this.generateField(fieldName, fieldType, choices)}
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


    render(): ReactElement {
        const size = 2
        return (
            <div>
                {this.chunkArray(this.props.data.fields, size).map((chunk, index) => {
                    return this.hideAutoField(chunk, index, size)
                })}
            </div>
        )
    }
}
