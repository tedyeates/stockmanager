import { ReactElement } from "react"

export type DataType = {
    [key: string]: any
}


export type FieldsDataTypeRow = [string, string, string[]]
export type FieldsDataType = FieldsDataTypeRow[]

export type ChangeElement = HTMLInputElement | HTMLSelectElement

export type ActiveType = {
    name: string
    type: string
}

export type FilterOptionType = {
    name: string
    value: string | number | boolean
    display_name: string
    seperator: string
}

export type ProviderProps = {
    children: Array<ReactElement> | ReactElement
}

type UseStateCallback<T> = (oldState: T) => T
export type UseStateType<T> = (newState: T | UseStateCallback<T>) => void 
