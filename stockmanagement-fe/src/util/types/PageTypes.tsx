export type PageName = "instock" | "outstock" | "item" | "group" | "log"
export type ChangePageToType = (newPageName:PageName) => void
export type SearchPageForType = (newFilters:FilterOptionType) => void
export type RemoveSearchFilterType = (filterToRemove: FilterOptionType) => void

export type FieldsDataTypeRow = {
    fieldName: string 
    fieldType: string
    fieldChoices: string[]
}
export type FieldsDataType = FieldsDataTypeRow[]

export type FilterOptionType = {
    name: string
    value: string | number | boolean
    display_name: string
    seperator: string
}

export type DataType = {
    [key: string]: any
}

export type DataTypeArray = Array<DataType>

export type PageDisplayType = {
    pageNumbersToDisplay: Array<number>
    numberOfResults: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

export type PageNumberUpdateFunctionType = {
    changePageNumberToNextPage: VoidFunction
    changePageNumberToPreviousPage: VoidFunction
    changePageNumberToFirstPage: VoidFunction
    changePageNumberTo: (newPageNumber: number) => void
}

export type PaginationType = {
    currentPageNumber: number
    changePageNumberTo: (newPageNumber: number) => void
    changePageNumberToNextPage: VoidFunction
    changePageNumberToPreviousPage: VoidFunction
}

export type TableLoaderType = {
    changePageTo: ChangePageToType
    searchPageFor: SearchPageForType
    removeSearchFilter: RemoveSearchFilterType
}
