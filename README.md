# STHL
```js
import {Highlighter,css,extractLangInfoArrayFromVSCEURLs,extractThemeFromVSCTURLs} from 'sthl'
const style=document.createElement('style')
style.textContent=css
document.body.append(style)
const example=[
    '# Test',
    '```ts',
    'class Text{',
    '    constructor(array?:string[]){',
    '        for(const item of array??[]){',
    '            console.log(item)',
    '        }',
    '    }',
    '}',
    '```'
].join('\n')
;(async()=>{
    const langInfoArray=await extractLangInfoArrayFromVSCEURLs([
        'markdown-basics',
    ],'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/')
    langInfoArray.push(...await extractLangInfoArrayFromVSCEURLs([
        'https://cdn.jsdelivr.net/gh/microsoft/vscode-typescript-next'
    ]))
    langInfoArray.push({
        name:'markdown',
        alias:['md']
    },{
        name:'typescript',
        alias:['ts']
    })
    const theme=await extractThemeFromVSCTURLs([
        'dark_plus.json'
    ],'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/theme-defaults/themes/')
    document.body.style.background='#1E1E1E'
    document.body.style.color='#D4D4D4'
    const highlighter=new Highlighter(langInfoArray,theme)
    document.body.append(await highlighter.highlightToElement(example,'md'))
})()

// Of course, to run the above codes in browser, you need a bundler like webpack.
```