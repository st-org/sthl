export function extractLangInfoArrayFromVSEC(vsec, dir) {
    const { contributes } = vsec;
    if (contributes === undefined) {
        return [];
    }
    const { grammars } = contributes;
    if (grammars === undefined) {
        return [];
    }
    grammars.reverse();
    const out = [];
    for (const { language, scopeName, path, injectTo, embeddedLanguages } of grammars) {
        let syntaxSrc = path;
        try {
            syntaxSrc = new URL(path, dir).href;
        }
        catch (err) {
            console.log(err);
        }
        out.push({
            name: language,
            rootScopeName: scopeName,
            syntaxSrc,
            rootScopeNamesToInject: injectTo,
            scopeNameToEmbeddedLanguageName: embeddedLanguages
        });
    }
    return out;
}
export async function extractLangInfoArrayFromVSECURLs(urls) {
    const out = [];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                continue;
            }
            out.push(...extractLangInfoArrayFromVSEC(JSON.parse(await res.text()), url));
        }
        catch (err) {
            console.log(err);
        }
    }
    return out;
}
