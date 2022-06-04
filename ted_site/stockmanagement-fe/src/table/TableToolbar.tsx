import { useLoad } from "../context/ApiContextManager";
import { CreateButton } from "./CreateButton";
import { Pagination } from "./Pagination";
import { Search } from "./Search";

export function TableToolbar(){
    const {active} = useLoad()
    return (
        <div className="bg-white h-22 px-4 py-3 flex justify-between sm:px-6">
            <Search />
            <div className="h-1/2 flex">
                <div className="mx-2">
                    <CreateButton active={active.name} />
                </div>
                <Pagination/>
            </div>
        </div>
)
}