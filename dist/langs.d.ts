export interface LangInfo {
    name?: string;
    alias?: string[];
    rootScopeName: string;
    syntaxSrc: string;
    rootScopeNamesToInject?: string[];
    scopeNameToEmbeddedLanguageName?: {
        [key: string]: string | undefined;
    };
}
export interface VSEC {
    contributes?: {
        grammars?: {
            language?: string;
            scopeName: string;
            path: string;
            injectTo?: string[];
            embeddedLanguages?: {
                [key: string]: string;
            };
        }[];
    };
}
export declare function extractLangInfoArrayFromVSEC(vsec: VSEC, dir: string): LangInfo[];
export declare function extractLangInfoArrayFromVSECURLs(urls: string[]): Promise<LangInfo[]>;
