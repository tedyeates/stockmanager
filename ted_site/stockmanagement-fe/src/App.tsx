import Table from './table/Table'
import { Popup } from './popup/Popups'
import Navbar from './Navbar'
import { ApiProvider } from "./context/ApiContextManager";
import { PopupProvider } from "./context/PopupContextManager";
import { TableToolbar } from './table/TableToolbar';
import { TableProvider } from './context/TableContextManager';
import { FieldProvider } from './context/FieldContextProvider';


function App(){
    
    const tabs = [
        {name: 'instock', type: 'stocks'},
        {name: 'outstock', type: 'stocks'},
        {name: 'groups', type: 'groups'},
        {name: 'items', type: 'items'},
    ]
    return (
        <ApiProvider>
            <Navbar tabs={tabs} />
            <PopupProvider>
                <FieldProvider>
                    <Popup />
                </FieldProvider>
                <div
                    className="flex p-5 pt-16 flex-col text-center"
                    style={{ minWidth: "100vw", minHeight: "100vh" }}
                >
                    <TableProvider>
                        <TableToolbar />
                        <Table />
                    </TableProvider>
                </div>
            </PopupProvider>
        </ApiProvider>
    )
}



export default App;
