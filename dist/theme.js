var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getMod } from "./import";
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
export function extractThemeFromVSCTURLs(urls, dir) {
    return __awaiter(this, void 0, void 0, function* () {
        const out = [];
        for (const urlStr of urls) {
            const url = new URL(urlStr, dir);
            out.push((() => __awaiter(this, void 0, void 0, function* () {
                try {
                    const res = yield fetch(url.href);
                    if (!res.ok) {
                        return [];
                    }
                    const vsct = (yield getMod('json5')).default.parse(yield res.text());
                    if (typeof vsct.include === 'string') {
                        vsct.include = [vsct.include];
                    }
                    const out = [];
                    if (vsct.include !== undefined) {
                        out.push(...yield extractThemeFromVSCTURLs(vsct.include, url.href));
                    }
                    out.push(...extractThemeFromVSCT(vsct));
                    return out;
                }
                catch (err) {
                    console.log(err);
                    return [];
                }
            }))());
        }
        return (yield Promise.all(out)).flat();
    });
}
