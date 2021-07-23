import * as vsctm from 'vscode-textmate';
import * as oniguruma from 'vscode-oniguruma';
import { CommonEle, Span } from 'stce';
export * from './lang';
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
    constructor(langInfoArray) {
        this.rootScopeNameToInjectedRootScopeNames = {};
        this.languageNameToLanguageId = {};
        this.rootScopeNameToScopeNameToEmbeddedLanguageId = {};
        this.rootScopeNameToSyntaxSrc = {};
        this.languageIdToRootScopeName = {};
        this.registry = new vsctm.Registry({
            onigLib: createOnigLib(),
            loadGrammar: async (rootScopeName) => {
                const src = this.rootScopeNameToSyntaxSrc[rootScopeName];
                if (src === undefined) {
                    return null;
                }
                try {
                    const url = new URL(src);
                    const text = await (await fetch(src)).text();
                    if (url.pathname.endsWith('.json')) {
                        return JSON.parse(text);
                    }
                    return vsctm.parseRawGrammar(text);
                }
                catch (err) {
                    return null;
                }
            },
            getInjections: rootScopeName => {
                return this.rootScopeNameToInjectedRootScopeNames[rootScopeName];
            }
        });
        for (let i = 0; i < langInfoArray.length; i++) {
            const { name, alias, rootScopeName, syntaxSrc } = langInfoArray[i];
            if (rootScopeName !== undefined && syntaxSrc !== undefined) {
                this.rootScopeNameToSyntaxSrc[rootScopeName] = syntaxSrc;
            }
            if (name === undefined) {
                continue;
            }
            let id = this.languageNameToLanguageId[name];
            if (id === undefined) {
                id = i + 2;
                this.languageNameToLanguageId[name] = id;
            }
            for (const name of alias ?? []) {
                this.languageNameToLanguageId[name] = id;
            }
            if (this.languageIdToRootScopeName[id] === undefined) {
                this.languageIdToRootScopeName[id] = rootScopeName;
            }
        }
        for (const { rootScopeName, rootScopeNamesToInject, scopeNameToEmbeddedLanguageName } of langInfoArray) {
            if (rootScopeName == undefined) {
                continue;
            }
            let scopeNameToEmbeddedLanguageId = this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeName];
            if (scopeNameToEmbeddedLanguageId === undefined) {
                this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeName] = scopeNameToEmbeddedLanguageId = {};
            }
            const newScopeNameToEmbeddedLanguageId = {};
            if (scopeNameToEmbeddedLanguageName !== undefined) {
                for (const scopeName of Object.keys(scopeNameToEmbeddedLanguageName)) {
                    const name = scopeNameToEmbeddedLanguageName[scopeName];
                    if (name === undefined) {
                        continue;
                    }
                    const id = this.languageNameToLanguageId[name];
                    if (id === undefined) {
                        continue;
                    }
                    newScopeNameToEmbeddedLanguageId[scopeName] = id;
                }
            }
            Object.assign(scopeNameToEmbeddedLanguageId, newScopeNameToEmbeddedLanguageId);
            for (const rootScopeNameToInject of rootScopeNamesToInject ?? []) {
                let scopeNameToEmbeddedLanguageId = this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeNameToInject];
                if (scopeNameToEmbeddedLanguageId === undefined) {
                    this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeNameToInject] = scopeNameToEmbeddedLanguageId = {};
                }
                Object.assign(scopeNameToEmbeddedLanguageId, newScopeNameToEmbeddedLanguageId);
                let injectedRootScopeNames = this.rootScopeNameToInjectedRootScopeNames[rootScopeNameToInject];
                if (injectedRootScopeNames === undefined) {
                    this.rootScopeNameToInjectedRootScopeNames[rootScopeNameToInject] = injectedRootScopeNames = [];
                }
                injectedRootScopeNames.push(rootScopeName);
            }
        }
    }
    async highlight(text, languageName) {
        const id = this.languageNameToLanguageId[languageName];
        if (id === undefined) {
            return Highlighter.textToPlainCode(text);
        }
        const rootScopeName = this.languageIdToRootScopeName[id];
        if (rootScopeName === undefined) {
            return Highlighter.textToPlainCode(text);
        }
        const grammar = await this.registry.loadGrammarWithConfiguration(rootScopeName, id, { embeddedLanguages: this.rootScopeNameToScopeNameToEmbeddedLanguageId[rootScopeName] });
        if (grammar === null) {
            return Highlighter.textToPlainCode(text);
        }
        const lines = text.split('\n');
        const out = lines.length > 1 ? new CommonEle('pre') : new CommonEle('code');
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
                    const array = scope.split('.')
                        .map(val => val.replace(/\s/g, '-'));
                    const six = 'token-' + array.slice(0, 6).join('-');
                    const five = 'token-' + array.slice(0, 5).join('-');
                    const four = 'token-' + array.slice(0, 4).join('-');
                    const three = 'token-' + array.slice(0, 3).join('-');
                    const two = 'token-' + array.slice(0, 2).join('-');
                    const one = 'token-' + array[0];
                    try {
                        tokenSpan.classList.add(one);
                        tokenSpan.classList.add(two);
                        tokenSpan.classList.add(three);
                        tokenSpan.classList.add(four);
                        tokenSpan.classList.add(five);
                        tokenSpan.classList.add(six);
                    }
                    catch (err) {
                        console.log(err);
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
                .append(contentSpan));
        }
        return out.element;
    }
    static textToPlainCode(text) {
        const lines = text.split('\n');
        const out = lines.length > 1 ? new CommonEle('pre') : new CommonEle('code');
        for (const line of lines) {
            const content = line.trimStart();
            const padding = line.slice(0, line.length - content.length);
            const contentSpan = new Span(['content'])
                .setText(content);
            contentSpan.setHTML(contentSpan.element.innerHTML
                .replace(/([^<]\/+|[(){}\[\]])/g, '$1<wbr>'));
            out.append(new Span(['line'])
                .setText(padding)
                .append(contentSpan));
        }
        return out.element;
    }
}
