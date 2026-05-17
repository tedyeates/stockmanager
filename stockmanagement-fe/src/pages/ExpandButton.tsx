import { MouseEventHandler, ReactElement } from "react"
import { title } from "util/strings"
import { ProviderProps } from "../util/types/types"
import "styles/buttons.css"

type ExpandButtonProps = {
    text: string
    icon: ReactElement
    onClick?: MouseEventHandler<HTMLButtonElement>
    isDownload?: boolean
    disabled?: boolean
}

type ButtonProps = ProviderProps & {
    className: string
    onClick?: MouseEventHandler<HTMLButtonElement>
    isDownload?: boolean
}


export function ExpandButton({text, icon, onClick, disabled}: ExpandButtonProps) {
    return (
        <button 
            aria-label={text}
            className="t-button t-expand flex items-center justify-center whitespace-nowrap h-full disabled:opacity-50"
            onClick={onClick}
            disabled={disabled}
        >
            {icon}
            <span className="t-button-text">{title(text)}</span>
        </button>
    )
}