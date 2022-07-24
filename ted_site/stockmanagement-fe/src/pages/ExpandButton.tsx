import { MouseEventHandler, ReactElement } from "react"
import { ProviderProps } from "../util/types/types"

type ExpandButtonProps = {
    text: string
    icon: ReactElement
    onClick?: MouseEventHandler<HTMLButtonElement>
    isDownload?: boolean
}

type ButtonProps = ProviderProps & {
    className: string
    onClick?: MouseEventHandler<HTMLButtonElement>
    isDownload?: boolean
}


export function ExpandButton({text, icon, onClick, isDownload}: ExpandButtonProps) {
    return (
        <button 
            className="t-button t-expand flex whitespace-nowrap h-full"
            onClick={onClick}
        >
            {icon}
            <span className="t-button-text mx-2">{text}</span>
        </button>
    )
}