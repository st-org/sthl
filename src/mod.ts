import {parse} from 'json5'
import {loadWASM,OnigScanner,OnigString} from 'vscode-oniguruma'
import {INITIAL,IOnigLib,IRawGrammar,parseRawGrammar,Registry} from 'vscode-textmate'
import {LangInfo} from './lang'
import {Theme} from './theme'
export * from './lang'
export * from './theme'
export {all as css} from './lib/css'
async function createOnigLib(){
    const buffer=await (await (await fetch('https://cdn.jsdelivr.net/npm/vscode-oniguruma@1.6.1/release/onig.wasm')).blob()).arrayBuffer()
    await loadWASM(buffer)
    const onigLib:IOnigLib={
        createOnigScanner(patterns){
            return new OnigScanner(patterns)
        },
        createOnigString(s){
            return new OnigString(s)
        }
    }
    return onigLib
}
export function textToHTML(text:string,addWordBreak=false) {
    const lookup={
        '&':"&amp;",
        '"':"&quot;",
        '<':"&lt;",
        '>':"&gt;"
    }
    text=text.replace(/[&"<>]/g,c=>lookup[<'&'|'"'|'<'|'>'>c])
    if(addWordBreak){
        return text.replace(/(\/+|[\[\](){}])/g,'$1<wbr>')
    }
    return text
}
export function textToPlainDocumentFragment(text:string,forceBlock=false){
    const lines=text.split('\n')
    const block=forceBlock||lines.length>1
    const out=new DocumentFragment()
    for(const line of lines){
        const lineSpan=block?document.createElement('div'):document.createElement('span')
        const indentSpan=document.createElement('span')
        const contentSpan=document.createElement('span')
        lineSpan.classList.add('line')
        contentSpan.classList.add('content')
        out.append(lineSpan)
        lineSpan.append(indentSpan)
        lineSpan.append(contentSpan)
        const content=line.trimStart()
        indentSpan.textContent=line.slice(0,line.length-content.length)
        contentSpan.innerHTML=textToHTML(content,true)
    }
    return out
}
export function textToPlainElement(text:string,forceBlock=false){
    const element=forceBlock||text.includes('\n')?document.createElement('pre'):document.createElement('code')
    element.append(textToPlainDocumentFragment(text,forceBlock))
    return element
}
export class Highlighter{
    readonly scopeNameToInjectedScopeNames:{
        [key:string]:string[]|undefined
    }={}
    readonly scopeNameToSyntaxSrc:{
        [key:string]:string|undefined
    }={}
    readonly languageNameToRootScopeName:{
        [key:string]:string|undefined
    }={}
    readonly scopeNameToGrammar:{
        [key:string]:IRawGrammar|null|undefined
    }={}
    readonly registry=new Registry({
        onigLib:createOnigLib(),
        loadGrammar:async scopeName=>{
            let grammar=this.scopeNameToGrammar[scopeName]
            if(grammar!==undefined){
                return grammar
            }
            const src=this.scopeNameToSyntaxSrc[scopeName]
            if(src===undefined){
                return this.scopeNameToGrammar[scopeName]=null
            }
            try{
                const url=new URL(src)
                const text=await (await fetch(src)).text()
                if(url.pathname.endsWith('.json')){
                    return this.scopeNameToGrammar[scopeName]=parse(text)
                }
                return this.scopeNameToGrammar[scopeName]=parseRawGrammar(text)
            }catch(err){
                return this.scopeNameToGrammar[scopeName]=null
            }
        },
        getInjections:scopeName=>{
            return this.scopeNameToInjectedScopeNames[scopeName]
        }
    })
    constructor(langInfoArray:LangInfo[],readonly theme:Theme=[]){
        for(const {name,alias,scopeName,syntaxSrc} of langInfoArray){
            if(scopeName!==undefined&&syntaxSrc!==undefined){
                this.scopeNameToSyntaxSrc[scopeName]=syntaxSrc
            }
            if(name===undefined){
                continue
            }
            let rootScopeName=this.languageNameToRootScopeName[name]
            if(rootScopeName===undefined){
                this.languageNameToRootScopeName[name]=rootScopeName=scopeName
            }
            for(const name of alias??[]){
                this.languageNameToRootScopeName[name]=rootScopeName
            }
        }
        for(const {scopeName,scopeNamesToInject} of langInfoArray){
            if(scopeName==undefined){
                continue
            }
            for(const scopeNameToInject of scopeNamesToInject??[]){
                let injectedScopeNames=this.scopeNameToInjectedScopeNames[scopeNameToInject]
                if(injectedScopeNames===undefined){
                    this.scopeNameToInjectedScopeNames[scopeNameToInject]=injectedScopeNames=[]
                }
                injectedScopeNames.push(scopeName)
            }
        }
    }
    textToHTML=textToHTML
    textToPlainDocumentFragment=textToPlainDocumentFragment
    textToPlainElement=textToPlainElement
    async highlightToDocumentFragment(text:string,languageName:string,forceBlock=false){
        const rootScopeName=this.languageNameToRootScopeName[languageName]
        if(rootScopeName===undefined){
            return textToPlainDocumentFragment(text,forceBlock)
        }
        const grammar=await this.registry.loadGrammar(rootScopeName)
        if(grammar===null){
            return textToPlainDocumentFragment(text,forceBlock)
        }
        const lines=text.split('\n')
        const block=forceBlock||lines.length>1
        const out=new DocumentFragment()
        let ruleStack = INITIAL
        for (const line of lines) {
            const lineSpan=block?document.createElement('div'):document.createElement('span')
            const indentSpan=document.createElement('span')
            const contentSpan=document.createElement('span')
            lineSpan.classList.add('line')
            contentSpan.classList.add('content')
            out.append(lineSpan)
            lineSpan.append(indentSpan)
            lineSpan.append(contentSpan)
            const lineTokens = grammar.tokenizeLine(line, ruleStack)
            let contentStart=false
            for (const token of lineTokens.tokens) {
                const text=line.slice(token.startIndex,token.endIndex)
                if(!contentStart&&text.trim().length>0){
                    contentStart=true
                }
                const tokenSpan=document.createElement('span')
                tokenSpan.innerHTML=textToHTML(text,true)
                for(const scope of token.scopes){
                    let usedScope=''
                    for(const {scopeNames,style} of this.theme){
                        const matchScope=scopeNames.find(val=>scope.startsWith(val))
                        if(matchScope===undefined||matchScope.length<usedScope.length){
                            continue
                        }
                        usedScope=matchScope
                        if(style.color!==undefined){
                            tokenSpan.style.color=style.color
                        }
                        if(style.fontStyle!==undefined){
                            tokenSpan.style.fontStyle=style.fontStyle
                        }
                        if(style.fontWeight!==undefined){
                            tokenSpan.style.fontWeight=style.fontWeight
                        }
                        if(style.textDecoration!==undefined){
                            tokenSpan.style.textDecoration=style.textDecoration
                        }
                    }
                }
                if(contentStart){
                    contentSpan.append(tokenSpan)
                }else{
                    indentSpan.append(tokenSpan)
                }
            }
            ruleStack = lineTokens.ruleStack
        }
        return out
    }
    async highlightToElement(text:string,languageName:string,forceBlock=false){
        const element=forceBlock||text.includes('\n')?document.createElement('pre'):document.createElement('code')
        element.append(await this.highlightToDocumentFragment(text,languageName,forceBlock))
        return element
    }
}