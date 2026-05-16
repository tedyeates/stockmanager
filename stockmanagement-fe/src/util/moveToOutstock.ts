import { DataType } from 'util/types/PageTypes'

export const OUTSTOCK_COPY_FIELDS = ['item', 'quantity', 'stock_date', 'notes', 'store_type', 'job']

export function extractOutstockFields(instockData: DataType): DataType {
  const result: DataType = {}
  for (const field of OUTSTOCK_COPY_FIELDS) {
    if (field in instockData) {
      result[field] = instockData[field]
    }
  }
  return result
}
