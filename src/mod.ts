import {parse} from 'json5'
import {loadWASM,OnigScanner,OnigString} from 'vscode-oniguruma'
import {INITIAL,IOnigLib,IRawGrammar,parseRawGrammar,Registry} from 'vscode-textmate'
import {LangInfo} from './lang'
import {Theme} from './theme'
export * from './lang'
export * from './theme'
export * as css from './lib/css'
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
function textToHTML(text:string) {
    const lookup:Record<string,string>={
        '&':"&amp;",
        '"':"&quot;",
        '<':"&lt;",
        '>':"&gt;"
    };
    return text.replace(/[&"<>]/g,c=>lookup[c])
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
    textToPlainDocumentFragment(text:string){
        const lines=text.split('\n')
        const out=new DocumentFragment()
        for(const line of lines){
            const content=line.trimStart()
            const lineSpan=document.createElement('span')
            const contentSpan=document.createElement('span')
            lineSpan.classList.add('line')
            contentSpan.classList.add('content')
            lineSpan.textContent=line.slice(0,line.length-content.length)
            contentSpan.innerHTML=textToHTML(content).replace(/(\/+|[(){}\[\]])/g,'$1<wbr>')
            out.append(lineSpan)
            lineSpan.append(contentSpan)
        }
        return out
    }
    textToPlainElement(text:string,forceBlock=false){
        const element=(forceBlock||text.includes('\n')?document.createElement('pre'):document.createElement('code'))
        element.append(this.textToPlainDocumentFragment(text))
        return element
    }
    async highlightToDocumentFragment(text:string,languageName:string){
        const rootScopeName=this.languageNameToRootScopeName[languageName]
        if(rootScopeName===undefined){
            return this.textToPlainDocumentFragment(text)
        }
        const grammar=await this.registry.loadGrammar(rootScopeName)
        if(grammar===null){
            return this.textToPlainDocumentFragment(text)
        }
        const lines=text.split('\n')
        const out=new DocumentFragment()
        let ruleStack = INITIAL
        for (const line of lines) {
            let contentStart=false
            const lineSpan=document.createElement('span')
            const contentSpan=document.createElement('span')
            lineSpan.classList.add('line')
            contentSpan.classList.add('content')
            const lineTokens = grammar.tokenizeLine(line, ruleStack)
            for (const token of lineTokens.tokens) {
                const text=line.slice(token.startIndex,token.endIndex)
                if(!contentStart&&text.trim().length>0){
                    contentStart=true
                }
                const tokenSpan=document.createElement('span')
                tokenSpan.innerHTML=textToHTML(text).replace(/(\/+|[(){}\[\]])/g,'$1<wbr>')
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
                    lineSpan.append(tokenSpan)
                }
            }
            ruleStack = lineTokens.ruleStack
            out.append(lineSpan)
            lineSpan.append(contentSpan)
        }
        return out
    }
    async highlightToElement(text:string,languageName:string,forceBlock=false){
        const element=(forceBlock||text.includes('\n')?document.createElement('pre'):document.createElement('code'))
        element.append(await this.highlightToDocumentFragment(text,languageName))
        return element
    }
}