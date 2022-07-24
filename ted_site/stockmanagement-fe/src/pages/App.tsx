import Table from "./table/Table"
import { Popup } from "./popup/Popups"
import Navbar from "./Navbar"
import { PopupProvider } from "./context/PopupContextManager";
import { TableToolbar } from "./table/TableToolbar";

import { usePageTypeChanger } from "./context/PageChanger"

import "../styles/index.css";
import { useEffect } from "react";

function App(){
    const pageTypeChanger = usePageTypeChanger()

    useEffect(()=>{
        pageTypeChanger.tableLoader.changePageTo("instock")
    }, [])

    return (
        <div>
            <Navbar 
                currentPageName = {pageTypeChanger.currentPageName}
                changePageTo = {pageTypeChanger.tableLoader.changePageTo}
            />
            <PopupProvider>
                <Popup 
                    isPageLoading={pageTypeChanger.isPageLoading}
                    currentPageName = {pageTypeChanger.currentPageName}
                    changePageTo = {pageTypeChanger.tableLoader.changePageTo}
                    modalInputs = {pageTypeChanger.modalInputs}
                />
                <div
                    className="flex pt-2 px-5 flex-col text-center background-color"
                    style={{ minWidth: "100vw" }}
                >
                    <TableToolbar />
                    <Table 
                        pageData={pageTypeChanger.pageData} 
                        isPageLoading={pageTypeChanger.isPageLoading} 
                        currentPageName={pageTypeChanger.currentPageName}  
                    />
                </div>
            </PopupProvider>
        </div>
    )
}



export default App;
