import { createContext, useCallback, useContext, useState } from "react"
import { DataType, ChangePageToType, FieldsDataType, PageName } from "util/types/PageTypes"
import { ProviderProps } from "util/types/types"
import { validateRow, mapServerErrors, ValidationErrors } from "util/validation"
import { extractOutstockFields } from "util/moveToOutstock"
import { Requests, RequestError } from "util/requests"
import { useAuth } from "./Login"
import { usePageTypeChanger } from "./PageChanger"

export type EditMode = 'none' | 'editing' | 'creating'

type InlineEditingContextType = {
    editMode: EditMode
    editingRowId: number | null
    editingData: DataType
    validationErrors: ValidationErrors
    isSaving: boolean
    startEditing: (rowData: DataType) => void
    startCreating: (prefillData?: DataType) => void
    updateField: (fieldName: string, value: any) => void
    clearFieldError: (fieldName: string) => void
    save: (pageName: PageName, modalInputs: FieldsDataType) => Promise<void>
    cancel: () => void
    moveToOutstock: (rowData: DataType, changePageTo: ChangePageToType) => void
}

const InlineEditingContext = createContext<InlineEditingContextType>({
    editMode: 'none',
    editingRowId: null,
    editingData: {},
    validationErrors: {},
    isSaving: false,
    startEditing: () => {},
    startCreating: () => {},
    updateField: () => {},
    clearFieldError: () => {},
    save: async () => {},
    cancel: () => {},
    moveToOutstock: () => {},
})

export const useInlineEditing = () => useContext(InlineEditingContext)

export function InlineEditingProvider({ children }: ProviderProps) {
    const { authHeader } = useAuth()
    const { refreshPage } = usePageTypeChanger()

    const [editMode, setEditMode] = useState<EditMode>('none')
    const [editingRowId, setEditingRowId] = useState<number | null>(null)
    const [editingData, setEditingData] = useState<DataType>({})
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
    const [isSaving, setIsSaving] = useState(false)

    const resetState = useCallback(() => {
        setEditMode('none')
        setEditingRowId(null)
        setEditingData({})
        setValidationErrors({})
        setIsSaving(false)
    }, [])

    const startEditing = useCallback((rowData: DataType) => {
        setEditMode('editing')
        setEditingRowId(rowData.id ?? null)
        setEditingData({ ...rowData })
        setValidationErrors({})
    }, [])

    const startCreating = useCallback((prefillData?: DataType) => {
        setEditMode('creating')
        setEditingRowId(null)
        setEditingData(prefillData ? { ...prefillData } : {})
        setValidationErrors({})
    }, [])

    const updateField = useCallback((fieldName: string, value: any) => {
        setEditingData(prev => ({ ...prev, [fieldName]: value }))
        setValidationErrors(prev => {
            if (!prev[fieldName]) return prev
            const { [fieldName]: _, ...rest } = prev
            return rest
        })
    }, [])

    const clearFieldError = useCallback((fieldName: string) => {
        setValidationErrors(prev => {
            if (!prev[fieldName]) return prev
            const { [fieldName]: _, ...rest } = prev
            return rest
        })
    }, [])

    const save = useCallback(async (pageName: PageName, modalInputs: FieldsDataType) => {
        setValidationErrors({})

        const result = validateRow(editingData, modalInputs)
        if (!result.isValid) {
            setValidationErrors(result.errors)
            return
        }

        setIsSaving(true)
        const baseUrl = `${import.meta.env.VITE_BASE_URL}/api/${pageName}/`
        const { id, ...payload } = editingData
        const body = JSON.stringify(payload)

        try {
            if (editMode === 'creating') {
                await Requests.post(baseUrl, body, authHeader.current ?? null)
            } else {
                await Requests.put(`${baseUrl}${id}/`, body, authHeader.current ?? null)
            }
            resetState()
            refreshPage()
        } catch (error: unknown) {
            setIsSaving(false)
            if (error instanceof RequestError && error.status === 400 && error.responseData) {
                setValidationErrors(mapServerErrors(error.responseData))
            } else {
                setValidationErrors({ __general: "Save failed. Please check your connection and try again." })
            }
        }
    }, [editingData, editMode, authHeader, resetState, refreshPage])

    const cancel = useCallback(() => {
        resetState()
    }, [resetState])

    const moveToOutstock = useCallback((rowData: DataType, changePageTo: ChangePageToType) => {
        const prefill = extractOutstockFields(rowData)
        resetState()
        changePageTo('outstock')
        // Use setTimeout to ensure page change completes before starting create
        setTimeout(() => {
            startCreating(prefill)
        }, 0)
    }, [resetState, startCreating])

    return (
        <InlineEditingContext.Provider value={{
            editMode,
            editingRowId,
            editingData,
            validationErrors,
            isSaving,
            startEditing,
            startCreating,
            updateField,
            clearFieldError,
            save,
            cancel,
            moveToOutstock,
        }}>
            {children}
        </InlineEditingContext.Provider>
    )
}
