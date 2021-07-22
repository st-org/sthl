const fs=require('fs')
const path=require('path')
const names=[]
let out=''
for(const fileName of fs.readdirSync(path.join(__dirname,'../css'))){
    const array=fileName.split('.')
    const name=array[1].replace(/-/g,'_')
    names.push(name)
    out+=`export const ${name}=\`${fs.readFileSync(path.join(__dirname,'../css/'+fileName),{encoding:'utf8'}).replace(/\\/g,'\\\\').replace(/`/g,'\\`')}\`\n`
}
out+=`export const all=${names.join('+')}`
fs.writeFileSync(path.join(__dirname,'../src/lib/css.ts'),out)