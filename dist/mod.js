import * as vsctm from 'vscode-textmate';
import * as oniguruma from 'vscode-oniguruma';
import { parse } from 'json5';
import { CommonEle, Span } from 'stce';
export * from './lang';
export * from './theme';
export { all as css } from './lib/css';
async function createOnigLib() {
    const buffer = await (await (await fetch('https://cdn.jsdelivr.net/npm/vscode-oniguruma@1.5.1/release/onig.wasm')).blob()).arrayBuffer();
    await oniguruma.loadWASM(buffer);
    const onigLib = {
        createOnigScanner(patterns) {
            return new oniguruma.OnigScanner(patterns);
        },
        createOnigString(s) {
            return new oniguruma.OnigString(s);
        }
    };
    return onigLib;
}
export class Highlighter {
    constructor(langInfoArray, theme = []) {
        this.theme = theme;
        this.scopeNameToInjectedScopeNames = {};
        this.scopeNameToSyntaxSrc = {};
        this.languageNameToRootScopeName = {};
        this.registry = new vsctm.Registry({
            onigLib: createOnigLib(),
            loadGrammar: async (scopeName) => {
                const src = this.scopeNameToSyntaxSrc[scopeName];
                if (src === undefined) {
                    return null;
                }
                try {
                    const url = new URL(src);
                    const text = await (await fetch(src)).text();
                    if (url.pathname.endsWith('.json')) {
                        return parse(text);
                    }
                    return vsctm.parseRawGrammar(text);
                }
                catch (err) {
                    return null;
                }
            },
            getInjections: scopeName => {
                return this.scopeNameToInjectedScopeNames[scopeName];
            }
        });
        for (let i = 0; i < langInfoArray.length; i++) {
            const { name, alias, scopeName, syntaxSrc } = langInfoArray[i];
            if (scopeName !== undefined && syntaxSrc !== undefined) {
                this.scopeNameToSyntaxSrc[scopeName] = syntaxSrc;
            }
            if (name === undefined) {
                continue;
            }
            let rootScopeName = this.languageNameToRootScopeName[name];
            if (rootScopeName === undefined) {
                this.languageNameToRootScopeName[name] = rootScopeName = scopeName;
            }
            for (const name of alias ?? []) {
                this.languageNameToRootScopeName[name] = rootScopeName;
            }
        }
        for (const { scopeName, scopeNamesToInject } of langInfoArray) {
            if (scopeName == undefined) {
                continue;
            }
            for (const scopeNameToInject of scopeNamesToInject ?? []) {
                let injectedScopeNames = this.scopeNameToInjectedScopeNames[scopeNameToInject];
                if (injectedScopeNames === undefined) {
                    this.scopeNameToInjectedScopeNames[scopeNameToInject] = injectedScopeNames = [];
                }
                injectedScopeNames.push(scopeName);
            }
        }
    }
    async highlightToDocumentFragment(text, languageName) {
        const rootScopeName = this.languageNameToRootScopeName[languageName];
        if (rootScopeName === undefined) {
            return Highlighter.textToPlainDocumentFragment(text);
        }
        const grammar = await this.registry.loadGrammar(rootScopeName);
        if (grammar === null) {
            return Highlighter.textToPlainDocumentFragment(text);
        }
        const lines = text.split('\n');
        const out = new DocumentFragment();
        let ruleStack = vsctm.INITIAL;
        for (const line of lines) {
            let contentStart = false;
            const lineSpan = new Span(['line']);
            const contentSpan = new Span(['content']);
            const lineTokens = grammar.tokenizeLine(line, ruleStack);
            for (const token of lineTokens.tokens) {
                const text = line.slice(token.startIndex, token.endIndex);
                if (!contentStart && text.trim() !== '') {
                    contentStart = true;
                }
                const tokenSpan = new Span()
                    .setText(text);
                tokenSpan.setHTML(tokenSpan.element.innerHTML.replace(/([^<]\/+|[(){}\[\]])/g, '$1<wbr>'));
                for (const scope of token.scopes) {
                    let usedScope = '';
                    for (const { scopeNames, style } of this.theme) {
                        const matchScope = scopeNames.find(val => scope.startsWith(val));
                        if (matchScope === undefined || matchScope.length < usedScope.length) {
                            continue;
                        }
                        usedScope = matchScope;
                        if (style.color !== undefined) {
                            tokenSpan.style.color = style.color;
                        }
                        if (style.fontStyle !== undefined) {
                            tokenSpan.style.fontStyle = style.fontStyle;
                        }
                        if (style.fontWeight !== undefined) {
                            tokenSpan.style.fontWeight = style.fontWeight;
                        }
                        if (style.textDecoration !== undefined) {
                            tokenSpan.style.textDecoration = style.textDecoration;
                        }
                    }
                }
                if (contentStart) {
                    contentSpan.append(tokenSpan);
                }
                else {
                    lineSpan.append(tokenSpan);
                }
            }
            ruleStack = lineTokens.ruleStack;
            out.append(lineSpan
                .append(contentSpan)
                .element);
        }
        return out;
    }
    async highlightToElement(text, languageName, forceBlock = false) {
        return (forceBlock || text.includes('\n') ? new CommonEle('pre') : new CommonEle('code'))
            .append(await this.highlightToDocumentFragment(text, languageName))
            .element;
    }
    static textToPlainDocumentFragment(text) {
        const lines = text.split('\n');
        const out = new DocumentFragment();
        for (const line of lines) {
            const content = line.trimStart();
            const padding = line.slice(0, line.length - content.length);
            const contentSpan = new Span(['content'])
                .setText(content);
            contentSpan.setHTML(contentSpan.element.innerHTML
                .replace(/([^<]\/+|[(){}\[\]])/g, '$1<wbr>'));
            out.append(new Span(['line'])
                .setText(padding)
                .append(contentSpan)
                .element);
        }
        return out;
    }
    static textToPlainElement(text, forceBlock = false) {
        return (forceBlock || text.includes('\n') ? new CommonEle('pre') : new CommonEle('code'))
            .append(Highlighter.textToPlainDocumentFragment(text))
            .element;
    }
}
