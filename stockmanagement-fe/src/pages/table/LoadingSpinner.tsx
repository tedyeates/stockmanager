export function LoadingSpinner({className}: {className?: string}){
    return (
        <div 
            className={`loader ease-linear rounded-full border-4 border-t-4 border-gray-200 ${className} mb-4`}
        ></div>
    )
}