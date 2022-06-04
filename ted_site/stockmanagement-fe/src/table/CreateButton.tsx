import { usePopupToggle } from "../context/PopupContextManager";
import { title } from "../util/strings";

export function CreateButton({active}: {active: string}) {
    const {openPopup} = usePopupToggle()
    
    return (
        <button className="rounded-md p-2 text-sm font-medium inline-flex text-white hover:bg-blue-800 bg-blue-700"
            onClick={openPopup}
        >
            Create {title(active)}
        </button>
    )
}