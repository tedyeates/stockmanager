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
            <div aria-label={`error message`} className='text-red-500'>
                {errors[fieldName][0]}
            </div>
        )
    return <></>
}