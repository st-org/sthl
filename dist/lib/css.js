export const line = "pre>.line {\n    display: block;\n    white-space: pre;\n}\n\npre>.line>.content {\n    display: inline-block;\n    white-space: pre-wrap;\n}\n\npre>.line>.content>*::after {\n    content: \" \";\n    display: inline-block;\n    width: 0;\n    height: 0;\n}";
export const all = line;
