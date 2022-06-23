import { MouseEventHandler, ReactElement } from "react"
import { useLoad } from "./context/ApiContextManager"
import { ProviderProps } from "./util/types"

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

function Button({children, className, onClick, isDownload}:ButtonProps){
    const {active} = useLoad()
    return (
        isDownload ?
            <a className={className} href={`${process.env.REACT_APP_BASE_URL}/api/${active.name}/export/`} download={`${active.name}.csv`}>
                {children}
            </a>
        :
            <button className={className} onClick={onClick}>
                {children}
            </button>
        
    )
}

export function ExpandButton({text, icon, onClick, isDownload}: ExpandButtonProps) {
    console.log(isDownload)
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