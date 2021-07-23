import * as vsctm from 'vscode-textmate';
import { LangInfo } from './lang';
import { Theme } from './theme';
export * from './lang';
export * from './theme';
export { all as css } from './lib/css';
export declare class Highlighter {
    readonly theme: Theme;
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
    constructor(langInfoArray: LangInfo[], theme?: Theme);
    highlight(text: string, languageName: string): Promise<HTMLElement | HTMLPreElement>;
    static textToPlainCode(text: string): HTMLElement | HTMLPreElement;
}
