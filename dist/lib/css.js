export const line = "pre>.line {\n    display: flex;\n    white-space: pre;\n}\n\npre>.line>span {\n    display: block;\n}\n\npre>.line>.content {\n    white-space: pre-wrap;\n}\n\npre>.line>.content:empty::before {\n    content: \" \";\n}";
export const all = line;
