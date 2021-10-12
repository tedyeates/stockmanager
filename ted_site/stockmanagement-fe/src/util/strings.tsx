export function title(string: string):string {
    let words = string.replaceAll('_', ' ').split(' ')
    // Capitalize all words
    return words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
}
