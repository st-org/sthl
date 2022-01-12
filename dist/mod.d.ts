import { IRawGrammar, Registry } from 'vscode-textmate';
import { textToPlainInlineDocumentFragment, textToPlainDocumentFragment, textToPlainElement } from './base';
import { LangInfo } from './lang';
import { Theme } from './theme';
export * from './base';
export * from './lang';
export * from './theme';
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
