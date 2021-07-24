import { parse } from 'json5';
export function extractLangInfoArrayFromVSCE(vsce, dir = '') {
    if (dir === '') {
        dir = location.href;
    }
    const { contributes } = vsce;
    if (contributes === undefined) {
        return [];
    }
    const { grammars } = contributes;
    if (grammars === undefined) {
        return [];
    }
    grammars.reverse();
    const out = [];
    for (const { language, scopeName, path, injectTo } of grammars) {
        let syntaxSrc = path;
        try {
            syntaxSrc = new URL(path, dir).href;
        }
        catch (err) {
            console.log(err);
        }
        out.push({
            name: language,
            scopeName: scopeName,
            syntaxSrc,
            scopeNamesToInject: injectTo
        });
    }
    return out;
}
export async function extractLangInfoArrayFromVSCEURLs(urls, dir = '') {
    if (dir === '') {
        dir = location.href;
    }
    const out = [];
    for (const urlStr of urls) {
        try {
            const url = new URL(urlStr, dir);
            if (!url.pathname.endsWith('/package.json')) {
                if (url.pathname.endsWith('/')) {
                    url.pathname += 'package.json';
                }
                else {
                    url.pathname += '/package.json';
                }
            }
            const res = await fetch(url.href);
            if (!res.ok) {
                continue;
            }
            out.push(...extractLangInfoArrayFromVSCE(parse(await res.text()), url.href));
        }
        catch (err) {
            console.log(err);
        }
    }
    return out;
}
export async function extractLangInfoArrayFromLangsURLs(urls, dir = '') {
    if (dir === '') {
        dir = location.href;
    }
    const out = [];
    for (const urlStr of urls) {
        try {
            const url = new URL(urlStr, dir);
            const res = await fetch(url.href);
            if (!res.ok) {
                continue;
            }
            const array = parse(await res.text());
            for (const info of array) {
                if (info.syntaxSrc !== undefined) {
                    info.syntaxSrc = new URL(info.syntaxSrc, url).href;
                }
            }
            out.push(...array);
        }
        catch (err) {
            console.log(err);
        }
    }
    return out;
}
