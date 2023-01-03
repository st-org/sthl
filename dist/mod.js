var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { INITIAL, parseRawGrammar, Registry } from 'vscode-textmate';
import { replaceTabs, textToPlainInlineDocumentFragment, textToPlainDocumentFragment, textToPlainElement } from './base';
import { getMod } from './import';
export * from './base';
export * from './lang';
export * from './theme';
function createOnigLib() {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = yield (yield (yield fetch('https://cdn.jsdelivr.net/npm/vscode-oniguruma@1.7.0/release/onig.wasm')).blob()).arrayBuffer();
        yield loadWASM(buffer);
        const onigLib = {
            createOnigScanner(patterns) {
                return new OnigScanner(patterns);
            },
            createOnigString(s) {
                return new OnigString(s);
            }
        };
        return onigLib;
    });
}
export class Highlighter {
    constructor(langInfoArray, theme) {
        this.theme = theme;
        this.scopeNameToInjectedScopeNames = {};
        this.scopeNameToSyntaxSrc = {};
        this.languageNameToRootScopeName = {};
        this.scopeNameToGrammar = {};
        this.registry = new Registry({
            onigLib: createOnigLib(),
            loadGrammar: (scopeName) => __awaiter(this, void 0, void 0, function* () {
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
                    const text = yield (yield fetch(src)).text();
                    if (url.pathname.endsWith('.json')) {
                        return this.scopeNameToGrammar[scopeName] = (yield getMod('json5')).default.parse(text);
                    }
                    return this.scopeNameToGrammar[scopeName] = parseRawGrammar(text);
                }
                catch (err) {
                    return this.scopeNameToGrammar[scopeName] = null;
                }
            }),
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
            for (const name of alias !== null && alias !== void 0 ? alias : []) {
                this.languageNameToRootScopeName[name] = rootScopeName;
            }
        }
        for (const { scopeName, scopeNamesToInject } of langInfoArray) {
            if (scopeName == undefined) {
                continue;
            }
            for (const scopeNameToInject of scopeNamesToInject !== null && scopeNamesToInject !== void 0 ? scopeNamesToInject : []) {
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
        tokenSpan.append(textToPlainInlineDocumentFragment(text));
        for (const scope of scopes) {
            let usedScope = '';
            for (const { scopeNames, style } of this.theme) {
                const matchScope = scopeNames.find(value => scope.startsWith(value));
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
    highlightToDocumentFragment(text, languageName, forceBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            text = replaceTabs(text);
            const rootScopeName = this.languageNameToRootScopeName[languageName];
            if (rootScopeName === undefined) {
                return textToPlainDocumentFragment(text, forceBlock);
            }
            const grammar = yield this.registry.loadGrammar(rootScopeName);
            if (grammar === null) {
                return textToPlainDocumentFragment(text, forceBlock);
            }
            const lines = text.split('\n');
            const out = new DocumentFragment();
            let ruleStack = INITIAL;
            if (!forceBlock && lines.length < 2) {
                for (const token of grammar.tokenizeLine(text, ruleStack).tokens) {
                    out.append(this.createTokenSpan(text.slice(token.startIndex, token.endIndex), token.scopes));
                }
                return out;
            }
            for (const line of lines) {
                const div = document.createElement('div');
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
                    div.textContent = '\n';
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
        });
    }
    highlightToElement(text, languageName, forceBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            const element = forceBlock || text.includes('\n') ? document.createElement('pre') : document.createElement('code');
            element.append(yield this.highlightToDocumentFragment(text, languageName, forceBlock));
            return element;
        });
    }
}
