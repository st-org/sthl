export declare const line = "code>.line:empty::before,\npre>.line:empty::before {\n    content: \" \";\n}\n\npre>.line {\n    display: block;\n    white-space: pre;\n    font-size: var(--length-font-span);\n}\n\npre>.line>.content {\n    display: inline-block;\n    white-space: pre-wrap;\n}\n\npre>.line>.content>*::after {\n    content: \" \";\n    display: inline-block;\n    width: 0;\n    height: 0;\n}";
export declare const token = "";
export declare const all: string;
