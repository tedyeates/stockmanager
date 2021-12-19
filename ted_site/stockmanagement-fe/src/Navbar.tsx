import { Component } from "react";
// @ts-ignore
import { TailwindNavbar } from 'tailwind-navbar-react';

import { title } from './util/strings'
import { LOGOUT_URL } from './constants/dev';
import { TiPlus } from 'react-icons/ti';

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


function CreateTab ({onClick}: {onClick: () => void}) {
    return (
        <li className={`hover:bg-blue-600 active:bg-blue-700 bg-blue-500`}>
            <button
                className='tab'
                onClick={onClick}
            >
                <TiPlus/>
            </button>
        </li>
    )
}


type NavbarProps = {
    tabs: string[]
    active: string
    showCreateTab: boolean
    onClick: (name: string) => void
    openPopup: () => void
}

function Navbar(props: NavbarProps) {
    console.log(props.showCreateTab)
    return (
        <TailwindNavbar
            brand="PCElemac"
            className="bg-blue-700 py-3 lg:py-0 sm:px-0 navbar"
        >
            <nav>
                <ul className="items-center justify-between pt-4 text-base lg:flex lg:pt-0">
                    {props.showCreateTab ? <CreateTab onClick={props.openPopup} /> : <></>}
                    {props.tabs.map((tab: string, index: number) => {
                        return(
                            <Tab
                                key={index}
                                name={tab}
                                active={props.active}
                                onClick={() => props.onClick(tab)}
                            />
                        )
                    })}
                    <li className="hover:bg-blue-800">
                        <a href={LOGOUT_URL} className="tab">Logout</a>
                    </li>
                </ul>
            </nav>
        </TailwindNavbar>
    )
}

export default Navbar
