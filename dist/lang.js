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
export function extractLangInfoArrayFromVSCEURLs(urls, dir) {
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
                    return extractLangInfoArrayFromVSCE((yield getMod('json5')).default.parse(yield res.text()), url.href);
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
