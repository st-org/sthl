import {parse} from 'json5'
interface Style{
    color?:string
    fontStyle?:string
    fontWeight?:string
    textDecoration?:string
}
export type Theme={
    scopeNames:string[]
    style:Style
}[]
export interface VST{
    include?:string[]|string
    tokenColors?:{
        scope:string[]|string
        settings:{
            fontStyle?:string
            foreground?:string
        }
    }[]
}
export function extractThemeFromVST(vst:VST){
    const {tokenColors}=vst
    if(tokenColors===undefined){
        return []
    }
    const out:Theme=[]
    for(const {scope,settings:{fontStyle,foreground}} of tokenColors){
        const style:Style={
            color:foreground
        }
        if(fontStyle!==undefined){
            if(fontStyle.includes('bold')){
                style.fontWeight='bold'
            }else{
                style.fontWeight=''
            }
            if(fontStyle.includes('underline')){
                style.textDecoration='underline'
            }else{
                style.textDecoration=''
            }
            if(fontStyle.includes('italic')){
                style.fontStyle='italic'
            }else{
                style.fontStyle=''
            }
        }
        out.push({
            scopeNames:typeof scope==='string'?[scope]:scope,
            style:style
        })
    }
    return out
}
export async function extractThemeFromVSTURLs(urls:string[],dir=''){
    if(dir===''){
        dir=location.href
    }
    const out:Theme=[]
    for(const urlStr of urls){
        try{
            const url=new URL(urlStr,dir)
            const res=await fetch(url.href)
            if(!res.ok){
                continue
            }
            const vst:VST=parse(await res.text())
            if(typeof vst.include==='string'){
                vst.include=[vst.include]
            }
            if(vst.include!==undefined){
                out.push(...await extractThemeFromVSTURLs(vst.include,url.href))
            }
            out.push(...extractThemeFromVST(vst))
        }catch(err){
            console.log(err)
        }
    }
    return out
}
export async function extractThemeFromThemeURLs(urls:string[],dir=''){
    if(dir===''){
        dir=location.href
    }
    const out:Theme=[]
    for(const urlStr of urls){
        try{
            const url=new URL(urlStr,dir)
            const res=await fetch(url.href)
            if(!res.ok){
                continue
            }
            out.push(...parse(await res.text()))
        }catch(err){
            console.log(err)
        }
    }
    return out
}