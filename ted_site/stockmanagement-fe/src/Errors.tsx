import { ReactElement } from "react"

export type ErrorState = {
    [key:string]: string[]
}

export function hasError(errors: ErrorState|undefined, field: string){
    return errors?.hasOwnProperty(field)
}

type ErrorProps = {
    fieldName: string
    errors: ErrorState
}

export function Error({fieldName, errors}:ErrorProps):ReactElement {
    if (fieldName in errors)
        return (
            <div className='text-red-500'>
                {errors[fieldName]}
            </div>
        )
    return <></>
}