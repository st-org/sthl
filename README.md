# STHL
```js
import {Highlighter,css,extractLangInfoArrayFromVSECURLs,extractThemeFromVSTURLs} from 'sthl'
const style=document.createElement('style')
style.textContent=css
document.body.append(style)
const case='# Test\n```stdn\n    {level 1,label test,heading[test]}\n```'
;(async()=>{
    const langInfoArray=await extractLangInfoArrayFromVSECURLs([
        'markdown-basics',
    ],'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/')
    langInfoArray.push(...await extractLangInfoArrayFromVSECURLs([
        'https://cdn.jsdelivr.net/gh/st-org/st-lang'
    ]))
    langInfoArray.push({
        name:'markdown',
        alias:['md']
    })
    const theme=await extractThemeFromVSTURLs([
        'dark_plus.json'
    ],'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/theme-defaults/themes/')
    document.body.style.background='#1E1E1E'
    document.body.style.color='#D4D4D4'
    const highlighter=new Highlighter(langInfoArray,theme)
    document.body.append(await highlighter.highlight(case,'md'))
})()

// Of course, to run the above codes in browser, you need a bundler like webpack.
```