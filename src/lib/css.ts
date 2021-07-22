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
export const token=`.token-comment {
    color: var(--color-comment);
}

.token-constant-numeric {
    color: var(--color-number);
}

.token-constant-character-escape {
    color: var(--color-function);
}

.token-constant-language {
    color: var(--color-modifier);
}

.token-entity-name-function {
    color: var(--color-function)
}

.token-entity-name-type {
    color: var(--color-class)
}

.token-entity-name-tag {
    color: var(--color-modifier)
}

.token-entity-name-section {
    color: var(--color-modifier)
}

.token-entity-other-inherited-class {
    color: var(--color-class);
}

.token-entity-other-attribute-name {
    color: var(--color-variable);
}

.token-invalid {
    color: var(--color-warn);
}

.token-keyword-control {
    color: var(--color-keyword);
}

.token-markup-underline {
    text-decoration: underline;
}

.token-markup-bold {
    font-weight: bold;
}

.token-markup-heading {
    font-weight: bold;
}

.token-markup-italic {
    font-style: italic;
}

.token-meta-object-literal-key {
    color: var(--color-variable);
}

.token-storage {
    color: var(--color-modifier);
}

.token-string {
    color: var(--color-string);
}

.token-variable {
    color: var(--color-variable);
}`
export const all=line+token