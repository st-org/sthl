import { parse } from 'json5';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { INITIAL, parseRawGrammar, Registry } from 'vscode-textmate';
export * from './lang';
export * from './theme';
export { all as css } from './lib/css';
async function createOnigLib() {
    const buffer = await (await (await fetch('https://cdn.jsdelivr.net/npm/vscode-oniguruma@1.6.1/release/onig.wasm')).blob()).arrayBuffer();
    await loadWASM(buffer);
    const onigLib = {
        createOnigScanner(patterns) {
            return new OnigScanner(patterns);
        },
        createOnigString(s) {
            return new OnigString(s);
        }
    };
    return onigLib;
}
export function textToHTML(text, addWordBreak = false) {
    const lookup = {
        '&': "&amp;",
        '"': "&quot;",
        '<': "&lt;",
        '>': "&gt;"
    };
    text = text.replace(/[&"<>]/g, c => lookup[c]);
    if (addWordBreak) {
        return text.replace(/(\/+|[(){}\[\]])/g, '$1<wbr>');
    }
    return text;
}
export function textToPlainDocumentFragment(text) {
    const lines = text.split('\n');
    const out = new DocumentFragment();
    for (const line of lines) {
        const content = line.trimStart();
        const lineSpan = document.createElement('span');
        const indentSpan = document.createElement('span');
        const contentSpan = document.createElement('span');
        lineSpan.classList.add('line');
        contentSpan.classList.add('content');
        out.append(lineSpan);
        lineSpan.append(indentSpan);
        lineSpan.append(contentSpan);
        indentSpan.textContent = line.slice(0, line.length - content.length);
        contentSpan.innerHTML = textToHTML(content, true);
    }
    return out;
}
export function textToPlainElement(text, forceBlock = false) {
    const element = (forceBlock || text.includes('\n') ? document.createElement('pre') : document.createElement('code'));
    element.append(textToPlainDocumentFragment(text));
    return element;
}
export class Highlighter {
    constructor(langInfoArray, theme = []) {
        this.theme = theme;
        this.scopeNameToInjectedScopeNames = {};
        this.scopeNameToSyntaxSrc = {};
        this.languageNameToRootScopeName = {};
        this.scopeNameToGrammar = {};
        this.registry = new Registry({
            onigLib: createOnigLib(),
            loadGrammar: async (scopeName) => {
                let grammar = this.scopeNameToGrammar[scopeName];
                if (grammar !== undefined) {
                    return grammar;
                }
                const src = this.scopeNameToSyntaxSrc[scopeName];
                if (src === undefined) {
                    return this.scopeNameToGrammar[scopeName] = null;
                }
                try {
                    const url = new URL(src);
                    const text = await (await fetch(src)).text();
                    if (url.pathname.endsWith('.json')) {
                        return this.scopeNameToGrammar[scopeName] = parse(text);
                    }
                    return this.scopeNameToGrammar[scopeName] = parseRawGrammar(text);
                }
                catch (err) {
                    return this.scopeNameToGrammar[scopeName] = null;
                }
            },
            getInjections: scopeName => {
                return this.scopeNameToInjectedScopeNames[scopeName];
            }
        });
        this.textToHTML = textToHTML;
        this.textToPlainDocumentFragment = textToPlainDocumentFragment;
        this.textToPlainElement = textToPlainElement;
        for (const { name, alias, scopeName, syntaxSrc } of langInfoArray) {
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
            return this.textToPlainDocumentFragment(text);
        }
        const grammar = await this.registry.loadGrammar(rootScopeName);
        if (grammar === null) {
            return this.textToPlainDocumentFragment(text);
        }
        const lines = text.split('\n');
        const out = new DocumentFragment();
        let ruleStack = INITIAL;
        for (const line of lines) {
            let contentStart = false;
            const lineSpan = document.createElement('span');
            const indentSpan = document.createElement('span');
            const contentSpan = document.createElement('span');
            lineSpan.classList.add('line');
            contentSpan.classList.add('content');
            out.append(lineSpan);
            lineSpan.append(indentSpan);
            lineSpan.append(contentSpan);
            const lineTokens = grammar.tokenizeLine(line, ruleStack);
            for (const token of lineTokens.tokens) {
                const text = line.slice(token.startIndex, token.endIndex);
                if (!contentStart && text.trim().length > 0) {
                    contentStart = true;
                }
                const tokenSpan = document.createElement('span');
                tokenSpan.innerHTML = textToHTML(text, true);
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
                    indentSpan.append(tokenSpan);
                }
            }
            ruleStack = lineTokens.ruleStack;
        }
        return out;
    }
    async highlightToElement(text, languageName, forceBlock = false) {
        const element = (forceBlock || text.includes('\n') ? document.createElement('pre') : document.createElement('code'));
        element.append(await this.highlightToDocumentFragment(text, languageName));
        return element;
    }
}
