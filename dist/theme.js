import { parse } from 'json5';
export function extractThemeFromVSCT(vsct) {
    const { tokenColors } = vsct;
    if (tokenColors === undefined) {
        return [];
    }
    const out = [];
    for (const { scope, settings: { fontStyle, foreground } } of tokenColors) {
        const style = {
            color: foreground
        };
        if (fontStyle !== undefined) {
            if (fontStyle.includes('bold')) {
                style.fontWeight = 'bold';
            }
            else {
                style.fontWeight = '';
            }
            if (fontStyle.includes('underline')) {
                style.textDecoration = 'underline';
            }
            else {
                style.textDecoration = '';
            }
            if (fontStyle.includes('italic')) {
                style.fontStyle = 'italic';
            }
            else {
                style.fontStyle = '';
            }
        }
        out.push({
            scopeNames: typeof scope === 'string' ? [scope] : scope,
            style: style
        });
    }
    return out;
}
export async function extractThemeFromVSCTURLs(urls, dir) {
    const out = [];
    for (const urlStr of urls) {
        const url = new URL(urlStr, dir);
        out.push((async () => {
            try {
                const res = await fetch(url.href);
                if (!res.ok) {
                    return [];
                }
                const vsct = parse(await res.text());
                if (typeof vsct.include === 'string') {
                    vsct.include = [vsct.include];
                }
                const out = [];
                if (vsct.include !== undefined) {
                    out.push(...await extractThemeFromVSCTURLs(vsct.include, url.href));
                }
                out.push(extractThemeFromVSCT(vsct));
                return out;
            }
            catch (err) {
                console.log(err);
                return [];
            }
        })());
    }
    return (await Promise.all(out)).flat();
}
