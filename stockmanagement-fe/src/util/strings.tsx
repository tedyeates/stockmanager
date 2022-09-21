export function title(string: string):string {
    let words = string.replaceAll('_', ' ')?.split(' ')
    // Capitalize all words
    return words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
}


export function formatDate(date: Date){
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function formatDateString(date: string){
    const [day, month, year] = date?.split('/')

    if(day && month && year)
        return `${year}-${month}-${day}`
    return date
}