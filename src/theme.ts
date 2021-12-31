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
export interface VSCT{
    include?:string[]|string
    tokenColors?:{
        scope:string[]|string
        settings:{
            fontStyle?:string
            foreground?:string
        }
    }[]
}
export function extractThemeFromVSCT(vsct:VSCT){
    const {tokenColors}=vsct
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
export async function extractThemeFromVSCTURLs(urls:string[],dir:string){
    const out:Promise<Theme>[]=[]
    for(const urlStr of urls){
        const url=new URL(urlStr,dir)
        out.push((async ()=>{
            try{
                const res=await fetch(url.href)
                if(!res.ok){
                    return []
                }
                const vsct:VSCT=parse(await res.text())
                if(typeof vsct.include==='string'){
                    vsct.include=[vsct.include]
                }
                const out:Theme=[]
                if(vsct.include!==undefined){
                    out.push(...await extractThemeFromVSCTURLs(vsct.include,url.href))
                }
                out.push(...extractThemeFromVSCT(vsct))
                return out
            }catch(err){
                console.log(err)
                return []
            }
        })())
    }
    return (await Promise.all(out)).flat()
}