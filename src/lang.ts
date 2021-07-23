export interface LangInfo{
    name?:string
    alias?:string[]
    rootScopeName?:string
    syntaxSrc?:string
    rootScopeNamesToInject?:string[]
    scopeNameToEmbeddedLanguageName?:{
        [key:string]:string|undefined
    }
}
export interface VSEC{
    contributes?:{
        grammars?:{
            language?:string
            scopeName:string
            path:string
            injectTo?:string[]
            embeddedLanguages?:{
                [key:string]:string
            }
        }[]
    }
}
export function extractLangInfoArrayFromVSEC(vsec:VSEC,dir:string){
    const {contributes}=vsec
    if(contributes===undefined){
        return []
    }
    const {grammars}=contributes
    if(grammars===undefined){
        return []
    }
    grammars.reverse()
    const out:LangInfo[]=[]
    for(const {language,scopeName,path,injectTo,embeddedLanguages} of grammars){
        let syntaxSrc=path
        try{
            syntaxSrc=new URL(path,dir).href
        }catch(err){
            console.log(err)
        }
        out.push({
            name:language,
            rootScopeName:scopeName,
            syntaxSrc,
            rootScopeNamesToInject:injectTo,
            scopeNameToEmbeddedLanguageName:embeddedLanguages
        })
    }
    return out
}
export async function extractLangInfoArrayFromVSECURLs(urls:string[],dir=''){
    const out:LangInfo[]=[]
    if(dir===''){
        dir=location.href
    }
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
            out.push(...extractLangInfoArrayFromVSEC(JSON.parse(await res.text()),url.href))
        }catch(err){
            console.log(err)
        }
    }
    return out
}