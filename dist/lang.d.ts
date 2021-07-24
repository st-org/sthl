export interface LangInfo {
    name?: string;
    alias?: string[];
    scopeName?: string;
    syntaxSrc?: string;
    scopeNamesToInject?: string[];
}
export interface VSCE {
    contributes?: {
        grammars?: {
            language?: string;
            scopeName: string;
            path: string;
            injectTo?: string[];
        }[];
    };
}
export declare function extractLangInfoArrayFromVSCE(vsce: VSCE, dir?: string): LangInfo[];
export declare function extractLangInfoArrayFromVSCEURLs(urls: string[], dir?: string): Promise<LangInfo[]>;
export declare function extractLangInfoArrayFromLangsURLs(urls: string[], dir?: string): Promise<LangInfo[]>;
