import * as Types from "../util/types"

import { createContext, useContext,useEffect,useState } from "react"

const PageContext = createContext<Types.PageContextType>({
    pages: {
        next: null,
        previous: null,
        count: 0
    },
    setPages: () => {}
})
const LoadContext = createContext<Types.LoadContextType>({
    hasLoadedField: false,
    hasLoadedData: false,
    updateHasLoaded: () => {},
    active: {name: 'instock', type: 'stocks'},
    setActive: () => {}
})

export const usePaging = () => useContext(PageContext)
export const useLoad = () => useContext(LoadContext)


export function ApiProvider({ children }: Types.ProviderProps ) {
    
    const [pages, setPages] = useState<Types.PagesType>({
        next: null,
        previous: null,
        count: 0, 
    })
    const [hasLoadedField, setHasLoadedField] = useState<boolean>(false)
    const [hasLoadedData, setHasLoadedData] = useState<boolean>(false)
    const [active, setActive] = useState<Types.ActiveType>({name: 'instock', type: 'stocks'})

    function updateHasLoaded(name: string, newHasLoaded: boolean){
        if(name === 'fields')
            setHasLoadedField(newHasLoaded)
        if(name === 'data')
            setHasLoadedData(newHasLoaded)
    }

    useEffect(() => {
        if(hasLoadedData && hasLoadedField)
            setHasLoaded(true)
        else
            setHasLoaded(false)
    }, [hasLoadedData, hasLoadedField])
    

    return (
        <PageContext.Provider value={{pages, setPages}}>
            <LoadContext.Provider value = {{hasLoaded, updateHasLoaded, active, setActive}}>
                { children }
            </LoadContext.Provider>
        </PageContext.Provider>
    )

}