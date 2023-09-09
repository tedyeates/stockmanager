import { ReactElement } from "react"


export type ChangeElement = HTMLInputElement | HTMLSelectElement

export type ActiveType = {
    name: string
    type: string
}

export type ProviderProps = {
    children: Array<ReactElement> | ReactElement
}

type UseStateCallback<T> = (oldState: T) => T
export type UseStateType<T> = (newState: T | UseStateCallback<T>) => void 
