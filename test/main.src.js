import {Highlighter,css,extractLangInfoArrayFromVSECURLs,extractThemeFromVSTURLs} from '../dist/mod'
const style=document.createElement('style')
style.textContent=css
document.body.append(style)
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
const ts=`export {all as css} from './lib/css'
import * as vsctm from 'vscode-textmate'
import * as oniguruma from 'vscode-oniguruma'
import {CommonEle, Span} from 'stce'
export interface LangInfo{
    name:string
    alias?:string[]
    rootScopeName:string
    syntaxSrc:string
    rootScopeNamesToInject?:string[]
    scopeNameToEmbeddedLanguageName?:{
        [key:string]:string|undefined
    }
}
async function createOnigLib(){
    const buffer=await (await (await fetch('https://cdn.jsdelivr.net/npm/vscode-oniguruma@1.5.1/release/onig.wasm')).blob()).arrayBuffer()
    await oniguruma.loadWASM(buffer)
    const onigLib:vsctm.IOnigLib={
        createOnigScanner(patterns){
            return new oniguruma.OnigScanner(patterns)
        },
        createOnigString(s){
            return new oniguruma.OnigString(s)
        }
    }
    return onigLib
}
export class Highlighter{
    readonly rootScopeNameToInjectedRootScopeNames:{
        [key:string]:string[]|undefined
    }={}
    readonly languageNameToLanguageId:{
        [key:string]:number|undefined
    }={}
    readonly rootScopeNameToScopeNameToEmbeddedLanguageId:{
        [key:string]:{
            [key:string]:number
        }|undefined
    }={}
    readonly rootScopeNameToSyntaxSrc:{
        [key:string]:string|undefined
    }={}
    readonly languageIdToRootScopeName:{
        [key:number]:string|undefined
    }={}
    readonly registry=new vsctm.Registry({
        onigLib:createOnigLib(),
        loadGrammar:async rootScopeName=>{
            const src=this.rootScopeNameToSyntaxSrc[rootScopeName]
            if(src===undefined){
                return null
            }
            try{
                const url=new URL(src)
                const text=await (await fetch(src)).text()
                if(url.pathname.endsWith('.json')){
                    return JSON.parse(text)
                }
                return vsctm.parseRawGrammar(text)
            }catch(err){
                return null
            }
        },
        getInjections:rootScopeName=>{
            return this.rootScopeNameToInjectedRootScopeNames[rootScopeName]
        }
    })
    constructor(langInfoArray:LangInfo[]){
        for(let i=0;i<langInfoArray.length;i++){
            const {name,alias,rootScopeName,syntaxSrc}=langInfoArray[i]
            this.languageNameToLanguageId[name]=i+2
            for(const name of alias){
                this.languageNameToLanguageId[name]=i+2
            }
            this.languageIdToRootScopeName[i+2]=rootScopeName
            this.rootScopeNameToSyntaxSrc[rootScopeName]=syntaxSrc
        }
        for(const {
            rootScopeName,
            rootScopeNamesToInject,
            scopeNameToEmbeddedLanguageName
        } of langInfoArray){
            let scopeNameToEmbeddedLanguageId=this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeName]
            if(scopeNameToEmbeddedLanguageId===undefined){
                this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeName]=scopeNameToEmbeddedLanguageId={}
            }
            const newScopeNameToEmbeddedLanguageId:{
                [key: string]: number
            }={}
            if(scopeNameToEmbeddedLanguageName!==undefined){
                for(const scopeName of Object.keys(scopeNameToEmbeddedLanguageName)){
                    const name=scopeNameToEmbeddedLanguageName[scopeName]
                    if(name===undefined){
                        continue
                    }
                    const id=this.languageNameToLanguageId[name]
                    if(id===undefined){
                        continue
                    }
                    newScopeNameToEmbeddedLanguageId[scopeName]=id
                }
            }
            Object.assign(scopeNameToEmbeddedLanguageId,newScopeNameToEmbeddedLanguageId)
            for(const rootScopeNameToInject of rootScopeNamesToInject){
                let scopeNameToEmbeddedLanguageId=this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeNameToInject]
                if(scopeNameToEmbeddedLanguageId===undefined){
                    this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeNameToInject]=scopeNameToEmbeddedLanguageId={}
                }
                Object.assign(scopeNameToEmbeddedLanguageId,newScopeNameToEmbeddedLanguageId)
                let injectedRootScopeNames=this.rootScopeNameToInjectedRootScopeNames[rootScopeNameToInject]
                if(injectedRootScopeNames===undefined){
                    this.rootScopeNameToInjectedRootScopeNames[rootScopeNameToInject]=injectedRootScopeNames=[]
                }
                injectedRootScopeNames.push(rootScopeName)
            }
        }
    }
    async highlight(text:string,languageName:string){
        const id=this.languageNameToLanguageId[languageName]
        if(id===undefined){
            return Highlighter.textToPlainCode(text)
        }
        const rootScopeName=this.languageIdToRootScopeName[id]
        if(rootScopeName===undefined){
            return Highlighter.textToPlainCode(text)
        }
        const grammar=await this.registry.loadGrammarWithConfiguration(rootScopeName,id,{embeddedLanguages:this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeName]})
        if(grammar===null){
            return Highlighter.textToPlainCode(text)
        }
        const lines=text.split('\\n')
        const out=lines.length>0?new CommonEle('pre'):new CommonEle('code')
        let ruleStack = vsctm.INITIAL
        for (const line of lines) {
            let contentStart=false
            const lineSpan=new Span(['line'])
            const contentSpan=new Span(['content'])
            const lineTokens = grammar.tokenizeLine(line, ruleStack)
            for (const token of lineTokens.tokens) {
                const text=line.slice(token.startIndex,token.endIndex)
                if(!contentStart&&text.trim()!==''){
                    contentStart=true
                }
                const tokenSpan=new Span()
                .setText(text)
                tokenSpan.setHTML(tokenSpan.element.innerHTML.replace(/([^<]\\/+|[(){}\\[\\]])/g,'$1<wbr>'))
                for(const scope of token.scopes){
                    const array=scope.split('.')
                    .map(val=>val.replace(/\\s/g,'-'))
                    const five='token-'+array.slice(0,5).join('-')
                    const four='token-'+array.slice(0,4).join('-')
                    const three='token-'+array.slice(0,3).join('-')
                    const two='token-'+array.slice(0,2).join('-')
                    const one='token-'+array[0]
                    try{
                        tokenSpan.classList.add(one)
                        tokenSpan.classList.add(two)
                        tokenSpan.classList.add(three)
                        tokenSpan.classList.add(four)
                        tokenSpan.classList.add(five)
                    }catch(err){
                        console.log(err)
                    }
                }
                if(contentStart){
                    contentSpan.append(tokenSpan)
                }else{
                    lineSpan.append(tokenSpan)
                }
            }
            ruleStack = lineTokens.ruleStack
            out.append(
                lineSpan
                .append(contentSpan)
            )
        }
        return out.element
    }
    static textToPlainCode(text:string){
        const lines=text.split('\\n')
        const out=lines.length>0?new CommonEle('pre'):new CommonEle('code')
        for(const line of lines){
            const content=line.trimStart()
            const padding=line.slice(0,line.length-content.length)
            const contentSpan=new Span(['content'])
            .setText(content)
            contentSpan.setHTML(
                contentSpan.element.innerHTML
                .replace(/([^<]\\/+|[(){}\\[\\]])/g,'$1<wbr>')
            )
            out.append(
                new Span(['line'])
                .setText(padding)
                .append(contentSpan)
            )
        }
        return out.element
    }
}`
const cssCase=`.warn::before {
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
        <script src="./main.js"></script>
    </body>
</html>`
const md='# Test\n```stdn\n    {level 1,label test,heading[test]}\n    {level 1,label test2,heading[test]}\n```\n'
const stdn='{label test,ref[]}'
;(async()=>{
    const langInfoArray=await extractLangInfoArrayFromVSECURLs([
        'css',
        'html',
        'javascript',
        'markdown-basics',
        'typescript-basics',
    ],'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/')
    langInfoArray.push(...await extractLangInfoArrayFromVSECURLs([
        'https://cdn.jsdelivr.net/gh/st-org/st-lang'
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
    const theme=await extractThemeFromVSTURLs([
        'dark_plus.json'
    ],'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/theme-defaults/themes/')
    document.body.style.background='#1E1E1E'
    document.body.style.color='#D4D4D4'
    const highlighter=new Highlighter(langInfoArray,theme)
    document.body.append(await highlighter.highlight(js,'js'))
    document.body.append(await highlighter.highlight(js,'non'))
    document.body.append(await highlighter.highlight(ts,'ts'))
    document.body.append(await highlighter.highlight(cssCase,'css'))
    document.body.append(await highlighter.highlight(html,'html'))
    document.body.append(await highlighter.highlight(md,'md'))
    document.body.append(await highlighter.highlight(stdn,'stdn'))
    document.body.append(await highlighter.highlight(stdn,'non'))
})()