import { parse } from 'json5';
export function extractThemeFromVST(vst) {
    const { tokenColors } = vst;
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
export async function extractThemeFromVSTURLs(urls, dir = '') {
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
            const vst = parse(await res.text());
            if (typeof vst.include === 'string') {
                vst.include = [vst.include];
            }
            if (vst.include !== undefined) {
                out.push(...await extractThemeFromVSTURLs(vst.include, url.href));
            }
            out.push(...extractThemeFromVST(vst));
        }
        catch (err) {
            console.log(err);
        }
    }
    return out;
}
export async function extractThemeFromThemeURLs(urls, dir = '') {
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
            out.push(...parse(await res.text()));
        }
        catch (err) {
            console.log(err);
        }
    }
    return out;
}
