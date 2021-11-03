import {IOnigLib,IRawGrammar,Registry,parseRawGrammar,INITIAL} from 'vscode-textmate'
import {loadWASM,OnigScanner,OnigString} from 'vscode-oniguruma'
import {parse} from 'json5'
import {CommonEle, Span} from 'stce'
import {LangInfo} from './lang'
import {Theme} from './theme'
export * from './lang'
export * from './theme'
export {all as css} from './lib/css'
async function createOnigLib(){
    const buffer=await (await (await fetch('https://cdn.jsdelivr.net/npm/vscode-oniguruma@1.5.1/release/onig.wasm')).blob()).arrayBuffer()
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
    async highlightToDocumentFragment(text:string,languageName:string){
        const rootScopeName=this.languageNameToRootScopeName[languageName]
        if(rootScopeName===undefined){
            return Highlighter.textToPlainDocumentFragment(text)
        }
        const grammar=await this.registry.loadGrammar(rootScopeName)
        if(grammar===null){
            return Highlighter.textToPlainDocumentFragment(text)
        }
        const lines=text.split('\n')
        const out=new DocumentFragment()
        let ruleStack = INITIAL
        for (const line of lines) {
            let contentStart=false
            const lineSpan=new Span(['line'])
            const contentSpan=new Span(['content'])
            const lineTokens = grammar.tokenizeLine(line, ruleStack)
            for (const token of lineTokens.tokens) {
                const text=line.slice(token.startIndex,token.endIndex)
                if(!contentStart&&text.trim().length>0){
                    contentStart=true
                }
                const tokenSpan=new Span()
                .setHTML(
                    textToHTML(text)
                    .replace(/(\/+|[(){}\[\]])/g,'$1<wbr>')
                )
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
            out.append(
                lineSpan
                .append(contentSpan)
                .element
            )
        }
        return out
    }
    async highlightToElement(text:string,languageName:string,forceBlock=false){
        return (forceBlock||text.includes('\n')?new CommonEle('pre'):new CommonEle('code'))
        .append(await this.highlightToDocumentFragment(text,languageName))
        .element
    }
    static textToPlainDocumentFragment(text:string){
        const lines=text.split('\n')
        const out=new DocumentFragment()
        for(const line of lines){
            const content=line.trimStart()
            out.append(
                new Span(['line'])
                .setText(line.slice(0,line.length-content.length))
                .append(
                    new Span(['content'])
                    .setHTML(
                        textToHTML(content)
                        .replace(/(\/+|[(){}\[\]])/g,'$1<wbr>')
                    )
                )
                .element
            )
        }
        return out
    }
    static textToPlainElement(text:string,forceBlock=false){
        return (forceBlock||text.includes('\n')?new CommonEle('pre'):new CommonEle('code'))
        .append(Highlighter.textToPlainDocumentFragment(text))
        .element
    }
}