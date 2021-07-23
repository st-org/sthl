export const line = `pre>.line {
    display: block;
    white-space: pre;
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
}`;
export const all = line;
