import { parse } from 'json5';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { INITIAL, parseRawGrammar, Registry } from 'vscode-textmate';
export * from './lang';
export * from './theme';
export { all as css } from './lib/css';
const addWordBreakChars = [
    '/',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}'
];
export function textToPlainInlineDocumentFragment(text, addWordBreak = false) {
    const out = new DocumentFragment();
    for (const char of text) {
        if (addWordBreak && addWordBreakChars.includes(char)) {
            out.append(document.createElement('wbr'));
            out.append(new Text(char));
            out.append(document.createElement('wbr'));
            continue;
        }
        out.append(new Text(char));
    }
    return out;
}
function replaceTabs(text) {
    return text.replace(/\t/g, '    ');
}
export function textToPlainDocumentFragment(text, forceBlock = false) {
    text = replaceTabs(text);
    const lines = text.split('\n');
    const out = new DocumentFragment();
    if (!(forceBlock || lines.length > 1)) {
        const span = document.createElement('span');
        span.append(textToPlainInlineDocumentFragment(text, true));
        out.append(span);
        return out;
    }
    for (const line of lines) {
        const div = document.createElement('div');
        div.classList.add('line');
        out.append(div);
        if (line.length === 0) {
            continue;
        }
        const indent = line.match(/^ */)[0];
        div.style.marginLeft = `${indent.length}ch`;
        div.append(textToPlainInlineDocumentFragment(line.slice(indent.length), true));
        const span = document.createElement('span');
        span.style.display = 'inline-block';
        span.style.width = '0';
        span.style.lineHeight = '0';
        span.textContent = indent;
        div.prepend(span);
    }
    return out;
}
export function textToPlainElement(text, forceBlock = false) {
    const element = forceBlock || text.includes('\n') ? document.createElement('pre') : document.createElement('code');
    element.append(textToPlainDocumentFragment(text, forceBlock));
    return element;
}
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
        this.textToPlainInlineDocumentFragment = textToPlainInlineDocumentFragment;
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
    createTokenSpan(text, scopes) {
        const tokenSpan = document.createElement('span');
        tokenSpan.append(textToPlainInlineDocumentFragment(text, true));
        for (const scope of scopes) {
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
        return tokenSpan;
    }
    async highlightToDocumentFragment(text, languageName, forceBlock = false) {
        text = replaceTabs(text);
        const rootScopeName = this.languageNameToRootScopeName[languageName];
        if (rootScopeName === undefined) {
            return textToPlainDocumentFragment(text, forceBlock);
        }
        const grammar = await this.registry.loadGrammar(rootScopeName);
        if (grammar === null) {
            return textToPlainDocumentFragment(text, forceBlock);
        }
        const lines = text.split('\n');
        const out = new DocumentFragment();
        let ruleStack = INITIAL;
        if (!(forceBlock || lines.length > 1)) {
            for (const token of grammar.tokenizeLine(text, ruleStack).tokens) {
                out.append(this.createTokenSpan(text.slice(token.startIndex, token.endIndex), token.scopes));
            }
            return out;
        }
        for (const line of lines) {
            const div = document.createElement('div');
            div.classList.add('line');
            out.append(div);
            const lineTokens = grammar.tokenizeLine(line, ruleStack);
            let indent = '';
            let contentStart = false;
            for (const token of lineTokens.tokens) {
                const text = line.slice(token.startIndex, token.endIndex);
                if (!contentStart) {
                    if (text.match(/[^ ]/) === null) {
                        indent += text;
                        continue;
                    }
                    contentStart = true;
                }
                div.append(this.createTokenSpan(text, token.scopes));
            }
            ruleStack = lineTokens.ruleStack;
            if (line.length === 0) {
                continue;
            }
            div.style.marginLeft = `${indent.length}ch`;
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.width = '0';
            span.style.lineHeight = '0';
            span.textContent = indent;
            div.prepend(span);
        }
        return out;
    }
    async highlightToElement(text, languageName, forceBlock = false) {
        const element = forceBlock || text.includes('\n') ? document.createElement('pre') : document.createElement('code');
        element.append(await this.highlightToDocumentFragment(text, languageName, forceBlock));
        return element;
    }
}
