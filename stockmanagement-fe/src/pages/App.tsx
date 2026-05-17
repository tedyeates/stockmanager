import Table from "./table/Table"
import Navbar from "./Navbar"
import { InlineEditingProvider } from "./context/InlineEditingContext";
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
            <InlineEditingProvider>
                <div
                    className="flex pt-2 px-5 flex-col text-center background-color"
                    style={{ minWidth: "100vw" }}
                >
                    <TableToolbar />
                    <Table 
                        pageData={pageTypeChanger.pageData} 
                        isPageLoading={pageTypeChanger.isPageLoading} 
                        currentPageName={pageTypeChanger.currentPageName}
                        modalInputs={pageTypeChanger.modalInputs}
                    />
                </div>
            </InlineEditingProvider>
        </div>
    )
}



export default App;
