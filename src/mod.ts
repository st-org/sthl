import {parse} from 'json5'
import {loadWASM, OnigScanner, OnigString} from 'vscode-oniguruma'
import {INITIAL, IOnigLib, IRawGrammar, parseRawGrammar, Registry} from 'vscode-textmate'
import {replaceTabs, textToPlainInlineDocumentFragment, textToPlainDocumentFragment, textToPlainElement} from './base'
import {LangInfo} from './lang'
import {Theme} from './theme'
export * from './base'
export * from './lang'
export * from './theme'
async function createOnigLib() {
    const buffer = await (await (await fetch('https://cdn.jsdelivr.net/npm/vscode-oniguruma@1.6.1/release/onig.wasm')).blob()).arrayBuffer()
    await loadWASM(buffer)
    const onigLib: IOnigLib = {
        createOnigScanner(patterns) {
            return new OnigScanner(patterns)
        },
        createOnigString(s) {
            return new OnigString(s)
        }
    }
    return onigLib
}
export class Highlighter {
    readonly scopeNameToInjectedScopeNames: {
        [key: string]: string[] | undefined
    } = {}
    readonly scopeNameToSyntaxSrc: {
        [key: string]: string | undefined
    } = {}
    readonly languageNameToRootScopeName: {
        [key: string]: string | undefined
    } = {}
    readonly scopeNameToGrammar: {
        [key: string]: IRawGrammar | null | undefined
    } = {}
    readonly registry = new Registry({
        onigLib: createOnigLib(),
        loadGrammar: async scopeName => {
            let grammar = this.scopeNameToGrammar[scopeName]
            if (grammar !== undefined) {
                return grammar
            }
            const src = this.scopeNameToSyntaxSrc[scopeName]
            if (src === undefined) {
                return this.scopeNameToGrammar[scopeName] = null
            }
            try {
                const url = new URL(src)
                const text = await (await fetch(src)).text()
                if (url.pathname.endsWith('.json')) {
                    return this.scopeNameToGrammar[scopeName] = parse(text)
                }
                return this.scopeNameToGrammar[scopeName] = parseRawGrammar(text)
            } catch (err) {
                return this.scopeNameToGrammar[scopeName] = null
            }
        },
        getInjections: scopeName => {
            return this.scopeNameToInjectedScopeNames[scopeName]
        }
    })
    constructor(langInfoArray: LangInfo[], readonly theme: Theme) {
        for (const {name, alias, scopeName, syntaxSrc} of langInfoArray) {
            if (scopeName !== undefined && syntaxSrc !== undefined) {
                this.scopeNameToSyntaxSrc[scopeName] = syntaxSrc
            }
            if (name === undefined) {
                continue
            }
            let rootScopeName = this.languageNameToRootScopeName[name]
            if (rootScopeName === undefined) {
                this.languageNameToRootScopeName[name] = rootScopeName = scopeName
            }
            for (const name of alias ?? []) {
                this.languageNameToRootScopeName[name] = rootScopeName
            }
        }
        for (const {scopeName, scopeNamesToInject} of langInfoArray) {
            if (scopeName == undefined) {
                continue
            }
            for (const scopeNameToInject of scopeNamesToInject ?? []) {
                let injectedScopeNames = this.scopeNameToInjectedScopeNames[scopeNameToInject]
                if (injectedScopeNames === undefined) {
                    this.scopeNameToInjectedScopeNames[scopeNameToInject] = injectedScopeNames = []
                }
                injectedScopeNames.push(scopeName)
            }
        }
    }
    textToPlainInlineDocumentFragment = textToPlainInlineDocumentFragment
    textToPlainDocumentFragment = textToPlainDocumentFragment
    textToPlainElement = textToPlainElement
    createTokenSpan(text: string, scopes: string[]) {
        const tokenSpan = document.createElement('span')
        tokenSpan.append(textToPlainInlineDocumentFragment(text))
        for (const scope of scopes) {
            let usedScope = ''
            for (const {scopeNames, style} of this.theme) {
                const matchScope = scopeNames.find(val => scope.startsWith(val))
                if (matchScope === undefined || matchScope.length < usedScope.length) {
                    continue
                }
                usedScope = matchScope
                if (style.color !== undefined) {
                    tokenSpan.style.color = style.color
                }
                if (style.fontStyle !== undefined) {
                    tokenSpan.style.fontStyle = style.fontStyle
                }
                if (style.fontWeight !== undefined) {
                    tokenSpan.style.fontWeight = style.fontWeight
                }
                if (style.textDecoration !== undefined) {
                    tokenSpan.style.textDecoration = style.textDecoration
                }
            }
        }
        return tokenSpan
    }
    async highlightToDocumentFragment(text: string, languageName: string, forceBlock: boolean) {
        text = replaceTabs(text)
        const rootScopeName = this.languageNameToRootScopeName[languageName]
        if (rootScopeName === undefined) {
            return textToPlainDocumentFragment(text, forceBlock)
        }
        const grammar = await this.registry.loadGrammar(rootScopeName)
        if (grammar === null) {
            return textToPlainDocumentFragment(text, forceBlock)
        }
        const lines = text.split('\n')
        const out = new DocumentFragment()
        let ruleStack = INITIAL
        if (!forceBlock && lines.length < 2) {
            for (const token of grammar.tokenizeLine(text, ruleStack).tokens) {
                out.append(this.createTokenSpan(text.slice(token.startIndex, token.endIndex), token.scopes))
            }
            return out
        }
        for (const line of lines) {
            const div = document.createElement('div')
            out.append(div)
            const lineTokens = grammar.tokenizeLine(line, ruleStack)
            let indent = ''
            let contentStart = false
            for (const token of lineTokens.tokens) {
                const text = line.slice(token.startIndex, token.endIndex)
                if (!contentStart) {
                    if (text.match(/[^ ]/) === null) {
                        indent += text
                        continue
                    }
                    contentStart = true
                }
                div.append(this.createTokenSpan(text, token.scopes))
            }
            ruleStack = lineTokens.ruleStack
            if (line.length === 0) {
                div.textContent = '\n'
                continue
            }
            div.style.marginLeft = `${indent.length}ch`
            const span = document.createElement('span')
            span.style.display = 'inline-block'
            span.style.width = '0'
            span.style.lineHeight = '0'
            span.textContent = indent
            div.prepend(span)
        }
        return out
    }
    async highlightToElement(text: string, languageName: string, forceBlock: boolean) {
        const element = forceBlock || text.includes('\n') ? document.createElement('pre') : document.createElement('code')
        element.append(await this.highlightToDocumentFragment(text, languageName, forceBlock))
        return element
    }
}