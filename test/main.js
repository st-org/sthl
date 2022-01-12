import {extractLangInfoArrayFromVSCEURLs, extractThemeFromVSCTURLs, Highlighter} from '../mod.js'
const example = `# Test

\`\`\`ts
class Text{
    constructor(array?:string[]){
        for(const item of array??[]){
            console.log(item)
\t    }
    }
}
\`\`\`
`
const langInfoArray = await extractLangInfoArrayFromVSCEURLs([
    'markdown-basics/package.json',
], 'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/')
langInfoArray.push(...await extractLangInfoArrayFromVSCEURLs([
    'microsoft/vscode-typescript-next/package.json',
], 'https://cdn.jsdelivr.net/gh/'))
langInfoArray.push({
    name: 'markdown',
    alias: ['md']
}, {
    name: 'typescript',
    alias: ['ts']
})
const theme = await extractThemeFromVSCTURLs([
    'dark_plus.json'
], 'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/theme-defaults/themes/')
document.body.style.background = '#1E1E1E'
document.body.style.color = '#D4D4D4'
const highlighter = new Highlighter(langInfoArray, theme)
document.body.append(await highlighter.highlightToElement(example, 'md', false, document))
document.body.append(highlighter.textToPlainElement(example, false, document))