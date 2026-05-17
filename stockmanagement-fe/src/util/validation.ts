import { DataType, FieldsDataType } from 'util/types/PageTypes'

export type ValidationErrors = { [fieldName: string]: string }

export type ValidationResult = {
  isValid: boolean
  errors: ValidationErrors
}

export function validateRow(rowData: DataType, modalInputs: FieldsDataType): ValidationResult {
  const errors: ValidationErrors = {}

  for (const field of modalInputs) {
    if (field.fieldType === 'AutoField') continue

    // M2M fields are optional — empty array is valid
    if (field.fieldType === 'ManyToManyField' || field.fieldType === 'ManyToManyRel') continue

    // Skip validation for fields explicitly marked as not required
    if (field.required === false) continue

    const value = rowData[field.fieldName]
    const isEmpty = value === undefined || value === null || value === ''

    if (isEmpty) {
      errors[field.fieldName] = formatValidationError(field.fieldName, 'required')
      continue
    }

    if (field.fieldType === 'IntegerField' || field.fieldType === 'DecimalField') {
      if (isNaN(Number(value))) {
        errors[field.fieldName] = formatValidationError(field.fieldName, 'number')
      }
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

export function formatValidationError(fieldName: string, reason: string): string {
  const label = fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  if (reason === 'required') return `${label} is required`
  if (reason === 'number') return `${label} must be a valid number`
  return `${label}: ${reason}`
}

export function mapServerErrors(serverResponse: Record<string, string[]>): ValidationErrors {
  const errors: ValidationErrors = {}
  for (const [field, messages] of Object.entries(serverResponse)) {
    if (Array.isArray(messages) && messages.length > 0) {
      errors[field] = messages[0]
    }
  }
  return errors
}
