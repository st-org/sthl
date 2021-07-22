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
        },
        {
            name:'js',
            alias:['javascript'],
            rootScopeName:'source.js',
            syntaxSrc:'https://cdn.jsdelivr.net/gh/textmate/javascript.tmbundle/Syntaxes/JavaScript.plist'
        }
    ])
    const pre=await highlighter.highlight(`# Test
\`\`\`stdn
    {level 1,label test,heading[test]}
    {level 1,label test2,heading[test]}
\`\`\`
`,'md')
    if(pre!==undefined){
        shell.append(pre)
    }
    const pre2=await highlighter.highlight(`function sayHello(name) {
    const out={
        value:'Hello, '+name,
        type:'string',
    }
    return out
}

class Test{
    constructor(){}
}`,'js')
    if(pre2!==undefined){
        shell.append(pre2)
    }
    const code=await highlighter.highlight(`{label test,ref[]}`,'stdn')
    if(code!==undefined){
        shell.append(code)
    }
})()