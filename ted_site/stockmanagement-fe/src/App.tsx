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
        {name: 'logs', type: 'logs'}
    ]
    return (
        <ApiProvider>
            <Navbar tabs={tabs} />
            <PopupProvider>
                <FieldProvider>
                    <Popup />
                    <div
                        className="flex pt-2 px-5 flex-col text-center"
                        style={{ minWidth: "100vw" }}
                    >
                        <TableProvider>
                            <TableToolbar />
                            <Table />
                        </TableProvider>
                    </div>
                </FieldProvider>
            </PopupProvider>
        </ApiProvider>
    )
}



export default App;
