export const line = "pre>div.line {\n    white-space: pre;\n}\n\npre>div.line>span {\n    display: inline-block;\n}\n\npre>div.line>.content {\n    white-space: pre-wrap;\n}\n\npre>div.line>.content:empty::before {\n    content: \" \";\n}";
export const all = line;
