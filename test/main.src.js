import {Shell} from '@ddu6/stui'
import {Highlighter,css} from '../dist/mod'
const shell=new Shell('Test','',css)
;(async()=>{
    const highlighter=new Highlighter([
        {
            name:'stdn',
            rootScopeName:'source.stdn',
            syntaxSrc:'https://cdn.jsdelivr.net/gh/st-org/st-lang@0.0.29/syntaxes/stdn.tmLanguage.json'
        },
        {
            name:'markdown',
            alias:['md'],
            rootScopeName:'text.html.markdown',
            syntaxSrc:'https://cdn.jsdelivr.net/gh/textmate/markdown.tmbundle/Syntaxes/Markdown.tmLanguage'
        },
        {
            name:'markdown-injection',
            rootScopeName:'text.html.markdown.injection.stdn',
            syntaxSrc:'https://cdn.jsdelivr.net/gh/st-org/st-lang@0.0.29/syntaxes/markdown.injection.json',
            rootScopeNamesToInject:[
                'text.html.markdown'
            ],
            scopeNameToEmbeddedLanguageName:{
                'meta.embedded.block.stdn':'stdn'
            }
        }
    ])
    const ele=await highlighter.highlight(`# Test
\`\`\`stdn
    {level 1,label test,heading[test]}
\`\`\`
`,'md')
    if(ele!==undefined){
        shell.append(ele)
    }
})()