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

class Tab extends Component<TabProps> {
    render() {
        return (
            <li className={`hover:bg-blue-800 ${
                this.props.active === this.props.name ? 
                    'bg-blue-900' : 
                    'bg-blue-700'
            }`}>
                <button
                    className='tab'
                    onClick={this.props.onClick}
                >
                    {title(this.props.name)}
                </button>
            </li>
        )
    }
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
    onClick: (name: string) => void
    openPopup: () => void
}

class Navbar extends Component<NavbarProps> {
    render() {
        return (
            <TailwindNavbar
                brand="PCElemac"
                className="bg-blue-700 py-3 lg:py-0 sm:px-0 navbar"
            >
                <nav>
                    <ul className="items-center justify-between pt-4 text-base lg:flex lg:pt-0">
                        <CreateTab onClick={this.props.openPopup} />
                        {this.props.tabs.map((tab: string, index: number) => {
                            return(
                                <Tab
                                    key={index}
                                    name={tab}
                                    active={this.props.active}
                                    onClick={() => this.props.onClick(tab)}
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
}

export default Navbar
