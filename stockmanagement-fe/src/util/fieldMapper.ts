import { FieldsDataType } from 'util/types/PageTypes'

export type InputControlType = 'text' | 'number' | 'decimal' | 'date' | 'select' | 'autocomplete' | 'multiAutocomplete' | 'hidden'

const FIELD_TYPE_MAP: Record<string, InputControlType> = {
  AutoField: 'hidden',
  IntegerField: 'number',
  DecimalField: 'decimal',
  DateField: 'date',
  ChoiceField: 'select',
  ForeignKey: 'autocomplete',
  ManyToManyField: 'multiAutocomplete',
  ManyToManyRel: 'multiAutocomplete',
  ManyToOneRel: 'hidden',
}

export function mapFieldTypeToControl(fieldType: string): InputControlType {
  return FIELD_TYPE_MAP[fieldType] ?? 'text'
}

export function getEditableFields(modalInputs: FieldsDataType): FieldsDataType {
  return modalInputs.filter(field => field.fieldType !== 'AutoField' && field.fieldName !== 'modified')
}
