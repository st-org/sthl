import { IRawGrammar, Registry } from 'vscode-textmate';
import { LangInfo } from './lang';
import { Theme } from './theme';
export * from './lang';
export * from './theme';
export { all as css } from './lib/css';
export declare function textToPlainInlineDocumentFragment(text: string, { document }?: {
    document?: Document | undefined;
}): DocumentFragment;
export declare function textToPlainDocumentFragment(text: string, { forceBlock, document }?: {
    forceBlock?: boolean | undefined;
    document?: Document | undefined;
}): DocumentFragment;
export declare function textToPlainElement(text: string, { forceBlock, document }?: {
    forceBlock?: boolean | undefined;
    document?: Document | undefined;
}): HTMLElement;
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
    createTokenSpan(text: string, scopes: string[], { document }?: {
        document?: Document | undefined;
    }): HTMLSpanElement;
    highlightToDocumentFragment(text: string, languageName: string, { forceBlock, document }?: {
        forceBlock?: boolean | undefined;
        document?: Document | undefined;
    }): Promise<DocumentFragment>;
    highlightToElement(text: string, languageName: string, { forceBlock, document }?: {
        forceBlock?: boolean | undefined;
        document?: Document | undefined;
    }): Promise<HTMLElement>;
}
