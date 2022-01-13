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
    readonly textToPlainInlineDocumentFragment: typeof textToPlainInlineDocumentFragment;
    readonly textToPlainDocumentFragment: typeof textToPlainDocumentFragment;
    readonly textToPlainElement: typeof textToPlainElement;
    constructor(langInfoArray: LangInfo[], theme: Theme);
    createTokenSpan(text: string, scopes: string[]): HTMLSpanElement;
    highlightToDocumentFragment(text: string, languageName: string, forceBlock: boolean): Promise<DocumentFragment>;
    highlightToElement(text: string, languageName: string, forceBlock: boolean): Promise<HTMLElement>;
}
