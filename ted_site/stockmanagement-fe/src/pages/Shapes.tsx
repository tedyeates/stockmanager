import { ReactElement } from 'react'


type ShapeProps = {
    size: number
}

type TriangleProps = ShapeProps & {
    color: string
    rotate: "rotate-45" | "-rotate-45"
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}


function reverseRotate(rotate: string): string {
    if(rotate[0] === "-")
        return rotate.substring(1)
    return `-${rotate}`
}

function widthOrHeight(rotate: string): [string, string] {
    if (rotate === '-rotate-45')
        return ['w', 'h']
    return ['h', 'w']
}

function Triangle(props: TriangleProps): ReactElement {
    let rotateBack: string = reverseRotate(props.rotate)

    let hypotenuse: number = Math.ceil(Math.hypot(props.size, props.size))

    let [side, oppositeSide] = widthOrHeight(props.rotate)

    return (
        <div className={`
            ${oppositeSide}-${props.size} 
            ${side}-${hypotenuse} 
            inline-block 
            overflow-hidden 
            ${props.rotate} 
            transform 
            origin-${props.position} 
            align-top
        `}>
            <div className={`h-${props.size} w-${props.size} bg-${props.color} ${rotateBack} inline-block transform origin-${props.position} float-right`}></div>
        </div>
    )
}

type CircleProps = {
    size: number
    className?: string
    onClick?: () => void
}

function Close(props: CircleProps): ReactElement {
    return (
        <button className={`
                rounded-full 
                bottom-4
                -right-1
                absolute
                h-${Math.floor(props.size/2)} 
                w-${Math.floor(props.size/2)}
                justify-center
                flex 
                items-center
                text-center
                ${props.className}
        `}
        onClick={props.onClick}
        >
            <svg 
                className="h-2 w-2 text-white"  
                viewBox="0 0 24 24"  
                fill="none"  
                stroke="currentColor"  
                strokeWidth="2"  
                strokeLinecap="round"  
                strokeLinejoin="round"
            >  
                <line x1="18" y1="6" x2="6" y2="18" />  
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg> 
        </button>
    )
}


type TagProps = {
    size: number
    text: string
    color: string
}


function Tag ({text, size, color}: TagProps): ReactElement {
    return (
        <div
            className={`bg-${color} h-${size} text-sm text-gray-100 inline-block align-top px-2 p-0.5`}
        >
            {text}
        </div>
    )
}

function Pill({text, size, color}: TagProps): ReactElement {
    return (
        <div
            className={`bg-${color} h-${size} text-sm text-gray-100 inline-block align-top px-2 p-0.5 rounded-full`}
        >
            {text}
        </div>
    )
}


type StandardTagProps = TagProps & {
    className?: string
}

export function StandardTag(props: StandardTagProps): ReactElement {
    return (
        <div className={`${props.className} inline-block`}>
            <Tag
                text={props.text}
                size={props.size}
                color={props.color}
            />
        </div>
    )
}


type ExtendedTagProps = StandardTagProps & ShapeProps & {
    closeClass?: string
    onClick?: () => void
}

export function StartTag(props: ExtendedTagProps): ReactElement{
    return (
        <div className={`${props.className} inline-block`}>
            <Tag
                text={props.text}
                color={props.color}
                size={props.size}
            />
            <Triangle
                size={props.size}
                color={props.color}
                rotate="rotate-45"
                position="top-right"
            />
        </div>
    )
}


export function MiddleTag(props: ExtendedTagProps): ReactElement {
    return (
        <div className={`${props.className} inline-block`}>
            <Triangle
                size={props.size}
                color={props.color}
                rotate="-rotate-45"
                position="top-right"
            />
            <Tag
                text={props.text}
                size={props.size}
                color={props.color}
            />
            <Triangle
                size={props.size}
                color={props.color}
                rotate="rotate-45"
                position="top-right"
            />
        </div>
    )
}


export function EndTag(props: ExtendedTagProps): ReactElement {
    return (
        <div className={`${props.className} inline-block relative`}>
            <Triangle
                size={props.size}
                color={props.color}
                rotate="-rotate-45"
                position="top-right"
            />
            <Tag
                text={props.text}
                size={props.size}
                color={props.color}
            />
            <Close
                size={props.size}
                onClick={props.onClick}
            />
        </div>
    )
}

export function PillTag(props: ExtendedTagProps): ReactElement {
    return (
        <div className={`${props.className} inline-block relative`}>
            <Pill
                text={props.text}
                size={props.size}
                color={props.color}
            />
           <Close
                className={props.closeClass}
                size={props.size}
                onClick={props.onClick}
            />
        </div>
    )
}
