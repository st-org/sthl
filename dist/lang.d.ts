export interface LangInfo {
    name?: string;
    alias?: string[];
    scopeName?: string;
    syntaxSrc?: string;
    scopeNamesToInject?: string[];
}
export interface VSEC {
    contributes?: {
        grammars?: {
            language?: string;
            scopeName: string;
            path: string;
            injectTo?: string[];
        }[];
    };
}
export declare function extractLangInfoArrayFromVSEC(vsec: VSEC, dir?: string): LangInfo[];
export declare function extractLangInfoArrayFromVSECURLs(urls: string[], dir?: string): Promise<LangInfo[]>;
export declare function extractLangInfoArrayFromLangsURLs(urls: string[], dir?: string): Promise<LangInfo[]>;
