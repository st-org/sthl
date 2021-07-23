import * as vsctm from 'vscode-textmate';
import { LangInfo } from './lang';
import { Theme } from './theme';
export * from './lang';
export * from './theme';
export { all as css } from './lib/css';
export declare class Highlighter {
    readonly theme: Theme;
    readonly scopeNameToInjectedScopeNames: {
        [key: string]: string[] | undefined;
    };
    readonly scopeNameToSyntaxSrc: {
        [key: string]: string | undefined;
    };
    readonly languageNameToRootScopeName: {
        [key: string]: string | undefined;
    };
    readonly registry: vsctm.Registry;
    constructor(langInfoArray: LangInfo[], theme?: Theme);
    highlight(text: string, languageName: string, forceBlock?: boolean): Promise<HTMLElement | HTMLPreElement>;
    static textToPlainCode(text: string, forceBlock?: boolean): HTMLElement | HTMLPreElement;
}
