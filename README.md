# STHL
```js
import {Shell} from '@ddu6/stui'
import {Highlighter,css} from 'sthl'
const shell=new Shell('Test','',css)
;(async()=>{
    const highlighter=new Highlighter([
        {
            name:'stdn',
            rootScopeName:'source.stdn',
            syntaxSrc:'https://cdn.jsdelivr.net/gh/st-org/st-lang/syntaxes/stdn.tmLanguage.json'
        },
        {
            name:'markdown',
            alias:['md'],
            rootScopeName:'text.html.markdown',
            syntaxSrc:'https://cdn.jsdelivr.net/gh/microsoft/vscode/extensions/markdown-basics/syntaxes/markdown.tmLanguage.json'
        },
        {
            name:'markdown-injection',
            rootScopeName:'text.html.markdown.injection.stdn',
            syntaxSrc:'https://cdn.jsdelivr.net/gh/st-org/st-lang/syntaxes/markdown.injection.json',
            rootScopeNamesToInject:[
                'text.html.markdown'
            ],
            scopeNameToEmbeddedLanguageName:{
                'meta.embedded.block.stdn':'stdn'
            }
        }
    ])
    const element=await highlighter.highlight('# Test\n```stdn\n    {level 1,label test,heading[test]}\n```','md')
    shell.append(element)
})()

// Of course, to run the above codes in browser, you need a bundler like webpack.
```