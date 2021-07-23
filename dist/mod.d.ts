import * as vsctm from 'vscode-textmate';
import { LangInfo } from './lang';
export * from './lang';
export { all as css } from './lib/css';
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
