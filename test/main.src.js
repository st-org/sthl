import {Highlighter,css,extractLangInfoArrayFromVSCEURLs,extractThemeFromVSCTURLs} from '../dist/mod'
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
const js=`const fs=require('fs')
const path=require('path')
const names=[]
let out=''
for(const fileName of fs.readdirSync(path.join(__dirname,'../css'))){
    const array=fileName.split('.')
    const name=array[1].replace(/-/g,'_')
    names.push(name)
    out+=\`export const \${name}=\\\`\${fs.readFileSync(path.join(__dirname,'../css/'+fileName),{encoding:'utf8'})}\\\`\\n\`
}
out+=\`export const all=\${names.join('+')}\`
fs.writeFileSync(path.join(__dirname,'../src/lib/css.ts'),out)
function sayHello(name) {
    const out = {
        value:'Hello, ' + name,
        type:'string',
    }
    return out
}

class Test{
    constructor(){}
}`
const ts=`import {parse} from 'json5'
export interface LangInfo{
    name?:string
    alias?:string[]
    scopeName?:string
    syntaxSrc?:string
    scopeNamesToInject?:string[]
}
export interface VSCE{
    contributes?:{
        grammars?:{
            language?:string
            scopeName:string
            path:string
            injectTo?:string[]
        }[]
    }
}
export function extractLangInfoArrayFromVSCE(vsce:VSCE,dir=''){
    if(dir===''){
        dir=location.href
    }
    const {contributes}=vsce
    if(contributes===undefined){
        return []
    }
    const {grammars}=contributes
    if(grammars===undefined){
        return []
    }
    grammars.reverse()
    const out:LangInfo[]=[]
    for(const {language,scopeName,path,injectTo} of grammars){
        let syntaxSrc=path
        try{
            syntaxSrc=new URL(path,dir).href
        }catch(err){
            console.log(err)
        }
        out.push({
            name:language,
            scopeName:scopeName,
            syntaxSrc,
            scopeNamesToInject:injectTo
        })
    }
    return out
}
export async function extractLangInfoArrayFromVSCEURLs(urls:string[],dir=''){
    if(dir===''){
        dir=location.href
    }
    const out:LangInfo[]=[]
    for(const urlStr of urls){
        try{
            const url=new URL(urlStr,dir)
            if(!url.pathname.endsWith('/package.json')){
                if(url.pathname.endsWith('/')){
                    url.pathname+='package.json'
                }else{
                    url.pathname+='/package.json'
                }
            }
            const res=await fetch(url.href)
            if(!res.ok){
                continue
            }
            out.push(...extractLangInfoArrayFromVSCE(parse(await res.text()),url.href))
        }catch(err){
            console.log(err)
        }
    }
    return out
}
export async function extractLangInfoArrayFromLangsURLs(urls:string[],dir=''){
    if(dir===''){
        dir=location.href
    }
    const out:LangInfo[]=[]
    for(const urlStr of urls){
        try{
            const url=new URL(urlStr,dir)
            const res=await fetch(url.href)
            if(!res.ok){
                continue
            }
            const array:LangInfo[]=parse(await res.text())
            for(const info of array){
                if(info.syntaxSrc!==undefined){
                    info.syntaxSrc=new URL(info.syntaxSrc,url).href
                }
            }
            out.push(...array)
        }catch(err){
            console.log(err)
        }
    }
    return out
}`
const cssExample=`.warn::before {
    content: "Error";
    color: green;
}

.token-entity-name-label {
    color: var(--color-light);
}

code>.line:empty::before,
pre>.line:empty::before {
    content: " ";
}

pre>.line {
    display: block;
    white-space: pre;
    font-size: var(--length-font-span);
}

pre>.line>.content {
    display: inline-block;
    white-space: pre-wrap;
}

pre>.line>.content>*::after {
    content: " ";
    display: inline-block;
    width: 0;
    height: 0;
}`
const html=`<!DOCTYPE html>
<html data-color-scheme="dark">
    <body>
        <style>
            a{
                color:red
            }
        </style>
        <script src="./main.js"></script>
        <script>
            console.log(0)
        </script>
    </body>
</html>`
const md='# Test\n```stdn\n    {level 1,label test,heading[test]}\n    {level 1,label test2,heading[test]}\n```\n'
const stdn='{label test,ref[]}'
;(async()=>{
    const langInfoArray=await extractLangInfoArrayFromVSCEURLs([
        'css',
        'html',
        'markdown-basics',
    ],'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/')
    langInfoArray.push(...await extractLangInfoArrayFromVSCEURLs([
        'https://cdn.jsdelivr.net/gh/st-org/st-lang',
        'https://cdn.jsdelivr.net/gh/microsoft/vscode-typescript-next',
    ]))
    langInfoArray.push({
        name:'javascript',
        alias:['js']
    },{
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
    document.body.append(await highlighter.highlight(example,'md'))
    document.body.append(await highlighter.highlight(js,'js'))
    document.body.append(await highlighter.highlight(js,'non'))
    document.body.append(await highlighter.highlight(ts,'ts'))
    document.body.append(await highlighter.highlight(cssExample,'css'))
    document.body.append(await highlighter.highlight(html,'html'))
    document.body.append(await highlighter.highlight(md,'md'))
    document.body.append(await highlighter.highlight(stdn,'stdn'))
    document.body.append(await highlighter.highlight(stdn,'non'))
})()