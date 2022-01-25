import { getMod } from "./import";
export function extractLangInfoArrayFromVSCE(vsce, dir) {
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
export async function extractLangInfoArrayFromVSCEURLs(urls, dir) {
    const out = [];
    for (const urlStr of urls) {
        const url = new URL(urlStr, dir);
        out.push((async () => {
            try {
                const res = await fetch(url.href);
                if (!res.ok) {
                    return [];
                }
                return extractLangInfoArrayFromVSCE((await getMod('json5')).default.parse(await res.text()), url.href);
            }
            catch (err) {
                console.log(err);
                return [];
            }
        })());
    }
    return (await Promise.all(out)).flat();
}
