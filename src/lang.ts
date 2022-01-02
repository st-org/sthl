import {parse} from 'json5'
export interface LangInfo {
    name?: string
    alias?: string[]
    scopeName?: string
    syntaxSrc?: string
    scopeNamesToInject?: string[]
}
export interface VSCE {
    contributes?: {
        grammars?: {
            language?: string
            scopeName: string
            path: string
            injectTo?: string[]
        }[]
    }
}
export function extractLangInfoArrayFromVSCE(vsce: VSCE, dir: string) {
    const {contributes} = vsce
    if (contributes === undefined) {
        return []
    }
    const {grammars} = contributes
    if (grammars === undefined) {
        return []
    }
    grammars.reverse()
    const out: LangInfo[] = []
    for (const {language, scopeName, path, injectTo} of grammars) {
        let syntaxSrc = path
        try {
            syntaxSrc = new URL(path, dir).href
        } catch (err) {
            console.log(err)
        }
        out.push({
            name: language,
            scopeName: scopeName,
            syntaxSrc,
            scopeNamesToInject: injectTo
        })
    }
    return out
}
export async function extractLangInfoArrayFromVSCEURLs(urls: string[], dir: string) {
    const out: Promise<LangInfo[]>[] = []
    for (const urlStr of urls) {
        const url = new URL(urlStr, dir)
        out.push((async () => {
            try {
                const res = await fetch(url.href)
                if (!res.ok) {
                    return []
                }
                return extractLangInfoArrayFromVSCE(parse(await res.text()), url.href)
            } catch (err) {
                console.log(err)
                return []
            }
        })())
    }
    return (await Promise.all(out)).flat()
}