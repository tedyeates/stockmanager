// @ts-ignore
import { TailwindNavbar } from 'tailwind-navbar-react'

import { title } from './util/strings'
import { useAuth } from './context/Login'
import { useNavigate } from 'react-router-dom'
import { useLoad } from './context/ApiContextManager'

type TabProps = {
    name: string
    active: string
    onClick: () => void
}

function Tab({name, active, onClick}:TabProps) {
    return (
        <li className={`hover:bg-blue-800 ${
            active === name ? 
                'bg-blue-900' : 
                'bg-blue-700'
        }`}>
            <button
                className='tab'
                onClick={onClick}
            >
                {title(name)}
            </button>
        </li>
    )
}


export type TabData = {
    name: string
    type: string
}

type NavbarProps = {
    tabs: TabData[]
}

function Navbar(props: NavbarProps) {
    const auth = useAuth()

    const {active, setActive} = useLoad()

    const navigate = useNavigate()

    
    return (
        <TailwindNavbar
            brand="PCElemac"
            className="bg-blue-700 py-3 lg:py-0 sm:px-0 navbar"
        >
            <nav>
                <ul className="items-center justify-between pt-4 text-base lg:flex lg:pt-0">
                    {props.tabs.map((tab: TabData, index: number) => {
                        return(
                            <Tab
                                key={index}
                                name={tab.name}
                                active={active.name}
                                onClick={() => {
                                    setActive(tab)
                                }}
                            />
                        )
                    })}
                    <Tab
                        key={'logout'}
                        name={'logout'}
                        active={''}
                        onClick={() => auth.signout(() => navigate("/"))}
                    />
                </ul>
            </nav>
        </TailwindNavbar>
    )
}

export default Navbar
