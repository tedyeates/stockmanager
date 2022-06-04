import { ReactElement } from "react"

export type DataType = {
    [key: string]: any
}

export type DataTypeArray = Array<DataType>

export type FieldsDataTypeRow = [string, string, string[]]
export type FieldsDataType = FieldsDataTypeRow[]

export type FormDataType = {
    data: DataType[]
    [key: string]: {[key:number]: DataType}
}

export type ChangeElement = HTMLInputElement | HTMLSelectElement
export type OnChangeType = (fieldName: string, inputType: string, value: any) => void

export type PagesType = {
    next: string | null
    previous: string | null
    count: number
}

export type PageContextType = {
    pages: PagesType,
    setPages: (page: PagesType) => void
}

export type DataContextType = {
    data: Array<DataType>
    getData: (currentPage:number) => void
}

export type ActiveType = {
    name: string
    type: string
}
export type LoadContextType = {
    hasLoadedField: boolean
    hasLoadedData: boolean
    updateHasLoaded: (name: string, newHasLoaded: boolean) => void
    active: ActiveType
    setActive: (newActive: ActiveType) => void
}

export type TogglePopupContextType = {
    isOpen: boolean
    closePopup: () => void
    openPopup: () => void
}

export type RowDataContextType = {
    rowData: DataType
    updateRowData: (fieldName: string, value:any) => void
    rowSelect: (data: DataType) => void
}

export type ProviderProps = {
    children: Array<ReactElement> | ReactElement
}

export type AuthHeaderType = {
    Authorization: string
}
