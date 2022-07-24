import { title } from '../util/strings'
import { useAuth } from '../pages/context/Login'
import { useNavigate } from 'react-router-dom'

import "styles/navbar.css"
import { Logo } from './Logo'
import { ChangePageToType, PageName } from '../util/types/PageTypes'

type TabProps = {
    name: string
    active: string
    onClick: () => void
}

function Tab({name, active, onClick}:TabProps) {
    let activeClass = active === name ? "underline-active" : ""
    return (
        <button 
            className={
                `tab-underline underline-blue-200 ${activeClass} 
                block mt-4 lg:inline-block lg:mt-0  
                text-blue-200 hover:text-blue-200 mr-4`
            }
            onClick={onClick}
        >
            <span>{title(name)}</span>
        </button>
    )
}

type NavbarProps = {
    currentPageName: PageName
    changePageTo: ChangePageToType
}

function Navbar({currentPageName, changePageTo}: NavbarProps) {
    const auth = useAuth()

    const navigate = useNavigate()
    const pageNames:PageName[] = ["instock", "outstock", "group","item","log"]
    
    return (
        <nav className="flex items-center justify-between flex-wrap bg-blue-700 p-2">
            <div className="flex items-center flex-shrink-0 text-white mr-6">
                <Logo className="fill-current h-12 w-16 mr-2" />
                <span className="font-semibold text-xl tracking-tight">PCElemac Stockmanagement</span>
            </div>
            <div className="block lg:hidden">
                <button className="flex items-center px-3 py-2 border rounded text-blue-200 border-blue-400 hover:text-white hover:border-white">
                <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
                </button>
            </div>
            <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
                <div className="text-sm lg:flex-grow">
                    {pageNames.map((pageName, index) => {
                        return(
                            <Tab
                                key={index}
                                name={pageName}
                                active={currentPageName}
                                onClick={() => {
                                    changePageTo(pageName)
                                }}
                            />
                        )
                    })}
                </div>
                <div>
                    <Tab
                        key={'logout'}
                        name={'logout'}
                        active={''}
                        onClick={() => auth.signout(() => navigate("/"))}
                    />
                </div>
            </div>
        </nav>
    )
}

export default Navbar
