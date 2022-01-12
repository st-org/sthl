const addWordBreakChars = [
    '/',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}'
]
export function textToPlainInlineDocumentFragment(text: string) {
    const out = new DocumentFragment()
    for (const char of text) {
        if (addWordBreakChars.includes(char)) {
            out.append(document.createElement('wbr'))
            out.append(char)
            out.append(document.createElement('wbr'))
            continue
        }
        out.append(char)
    }
    return out
}
export function replaceTabs(text: string) {
    return text.replace(/\t/g, '    ')
}
export function textToPlainDocumentFragment(text: string, forceBlock: boolean) {
    text = replaceTabs(text)
    const lines = text.split('\n')
    const out = new DocumentFragment()
    if (!forceBlock && lines.length < 2) {
        const span = document.createElement('span')
        span.append(textToPlainInlineDocumentFragment(text))
        out.append(span)
        return out
    }
    for (const line of lines) {
        const div = document.createElement('div')
        out.append(div)
        if (line.length === 0) {
            div.textContent = '\n'
            continue
        }
        const indent = (<RegExpMatchArray>line.match(/^ */))[0]
        div.style.marginLeft = `${indent.length}ch`
        div.append(textToPlainInlineDocumentFragment(line.slice(indent.length)))
        const span = document.createElement('span')
        span.style.display = 'inline-block'
        span.style.width = '0'
        span.style.lineHeight = '0'
        span.textContent = indent
        div.prepend(span)
    }
    return out
}
export function textToPlainElement(text: string, forceBlock: boolean) {
    const element = forceBlock || text.includes('\n') ? document.createElement('pre') : document.createElement('code')
    element.append(textToPlainDocumentFragment(text, forceBlock))
    return element
}