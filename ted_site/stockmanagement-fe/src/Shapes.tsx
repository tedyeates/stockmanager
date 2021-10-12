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
        <div className={`${oppositeSide}-${props.size} ${side}-${hypotenuse} inline-block overflow-hidden ${props.rotate} transform origin-${props.position} align-top`}>
            <div className={`h-${props.size} w-${props.size} bg-${props.color} ${rotateBack} inline-block transform origin-${props.position} float-right`}></div>
        </div>
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


type ExtendedTagProps = StandardTagProps & ShapeProps

type StartProps = ExtendedTagProps & {
    onClick: () => void
}

export function StartTag(props: StartProps): ReactElement{
    return (
        <div className={`${props.className} inline-block`} onClick={() => props.onClick()}>
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
        </div>
    )
}
