export const line=`code>.line:empty::before,
pre>.line:empty::before {
    content: " ";
}

pre>.line {
    display: block;
    white-space: pre;
    font-size: var(--length-font-span);
}

pre>.line>.content {
    display: inline-block;
    white-space: pre-wrap;
}

pre>.line>.content>*::after {
    content: " ";
    display: inline-block;
    width: 0;
    height: 0;
}`
export const token=``
export const all=line+token