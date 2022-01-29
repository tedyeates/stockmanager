import { ChangeEvent } from 'react'

export type DataType = {
    [key: string]: any
}

export type FieldsDataTypeRow = [string, string, string[]]
export type FieldsDataType = FieldsDataTypeRow[]

export type FormDataType = {
    data: DataType[]
    [key: string]: {[key:number]: DataType}
}

export type ChangeElement = HTMLInputElement | HTMLSelectElement
export type OnChangeType = (fieldName: string, inputType: string, value: any) => void