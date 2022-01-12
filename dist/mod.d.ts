import { IRawGrammar, Registry } from 'vscode-textmate';
import { LangInfo } from './lang';
import { Theme } from './theme';
export * from './lang';
export * from './theme';
export declare function textToPlainInlineDocumentFragment(text: string): DocumentFragment;
export declare function textToPlainDocumentFragment(text: string, forceBlock: boolean): DocumentFragment;
export declare function textToPlainElement(text: string, forceBlock: boolean): HTMLElement;
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
    readonly scopeNameToGrammar: {
        [key: string]: IRawGrammar | null | undefined;
    };
    readonly registry: Registry;
    constructor(langInfoArray: LangInfo[], theme: Theme);
    textToPlainInlineDocumentFragment: typeof textToPlainInlineDocumentFragment;
    textToPlainDocumentFragment: typeof textToPlainDocumentFragment;
    textToPlainElement: typeof textToPlainElement;
    createTokenSpan(text: string, scopes: string[]): HTMLSpanElement;
    highlightToDocumentFragment(text: string, languageName: string, forceBlock: boolean): Promise<DocumentFragment>;
    highlightToElement(text: string, languageName: string, forceBlock: boolean): Promise<HTMLElement>;
}
