import {parse} from 'json5'
export interface LangInfo{
    name?:string
    alias?:string[]
    scopeName?:string
    syntaxSrc?:string
    scopeNamesToInject?:string[]
}
export interface VSEC{
    contributes?:{
        grammars?:{
            language?:string
            scopeName:string
            path:string
            injectTo?:string[]
        }[]
    }
}
export function extractLangInfoArrayFromVSEC(vsec:VSEC,dir=''){
    if(dir===''){
        dir=location.href
    }
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
export async function extractLangInfoArrayFromVSECURLs(urls:string[],dir=''){
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
            out.push(...extractLangInfoArrayFromVSEC(parse(await res.text()),url.href))
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
}