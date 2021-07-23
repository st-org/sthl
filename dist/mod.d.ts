export { all as css } from './lib/css';
import * as vsctm from 'vscode-textmate';
export interface LangInfo {
    name: string;
    alias?: string[];
    rootScopeName: string;
    syntaxSrc: string;
    rootScopeNamesToInject?: string[];
    scopeNameToEmbeddedLanguageName?: {
        [key: string]: string | undefined;
    };
}
export declare class Highlighter {
    readonly rootScopeNameToInjectedRootScopeNames: {
        [key: string]: string[] | undefined;
    };
    readonly languageNameToLanguageId: {
        [key: string]: number | undefined;
    };
    readonly rootScopeNameToScopeNameToEmbeddedLanguageId: {
        [key: string]: {
            [key: string]: number;
        } | undefined;
    };
    readonly rootScopeNameToSyntaxSrc: {
        [key: string]: string | undefined;
    };
    readonly languageIdToRootScopeName: {
        [key: number]: string | undefined;
    };
    readonly registry: vsctm.Registry;
    constructor(langInfoArray: LangInfo[]);
    highlight(text: string, languageName: string): Promise<HTMLElement | HTMLPreElement>;
    static textToPlainCode(text: string): HTMLElement | HTMLPreElement;
}
