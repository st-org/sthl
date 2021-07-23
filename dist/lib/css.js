export const line = `code>.line:empty::before,
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
}`;
export const token = `/* comment */
.token-comment {
    color: var(--color-comment);
}

/* number */
.token-constant-numeric,
.token-keyword-operator-minus-exponent,
.token-keyword-operator-plus-exponent,
.token-variable-other-enummember {
    color: var(--color-number);
}

/* light */
.token-entity-name-label {
    color: var(--color-light);
}

/* markup */
.token-markup-underline {
    text-decoration: underline;
}

.token-strong,
.token-markup-bold {
    font-weight: bold;
}

.token-markup-heading {
    font-weight: bold;
}

.token-emphasis,
.token-markup-italic {
    font-style: italic;
}

/* variable & key */
.token-constant-character,
.token-constant-other-placeholder,
.token-entity-name-variable,
.token-entity-other-attribute-name,
.token-meta-definition-variable-name,
.token-meta-object-literal-key,
.token-meta-structure-dictionary-key-python,
.token-support-variable,
.token-variable {
    color: var(--color-variable);
}

/* function */
.token-constant-character-escape,
.token-entity-name-function,
.token-entity-name-operator-custom-literal,
.token-source-powershell-variable-other-member,
.token-support-constant-handlebars,
.token-support-function {
    color: var(--color-function);
}

/* keyword */
.token-entity-name-operator,
.token-keyword-control,
.token-keyword-operator-delete,
.token-keyword-other-operator,
.token-keyword-other-using,
.token-source-cpp-keyword-operator-new {
    color: var(--color-keyword);
}

/* modifier */
.token-constant-language,
.token-entity-name-section,
.token-entity-name-tag,
.token-keyword-operator-alignas
.token-keyword-operator-alignof,
.token-keyword-operator-cast,
.token-keyword-operator-expression,
.token-keyword-operator-instanceof,
.token-keyword-operator-logical-python,
.token-keyword-operator-new,
.token-keyword-operator-sizeof,
.token-keyword-operator-typeid,
.token-keyword-operator-wordlike,
.token-storage,
.token-variable-language {
    color: var(--color-modifier);
}

/* class & type */
.token-entity-name-class,
.token-entity-name-namespace,
.token-entity-name-scope-resolution,
.token-entity-name-type,
.token-entity-other-inherited-class,
.token-meta-return-type,
.token-meta-type-cast-expr,
.token-meta-type-new-expr,
.token-support-class,
.token-support-type {
    color: var(--color-class);
}

/* string */
.token-constant-other-color-rgb-value,
.token-constant-other-rgb-value,
.token-string,
.token-support-constant-color,
.token-support-constant-font-name,
.token-support-constant-media,
.token-support-constant-media-type,
.token-support-constant-property-value {
    color: var(--color-string);
}

/* regexp */
.token-constant-regexp,
.token-constant-character-character-class-regexp,
.token-constant-character-set-regexp,
.token-constant-other-character-class-regexp,
.token-constant-other-character-class-set-regexp,
.token-string-regexp {
    color: var(--color-string);
}

.token-keyword-control-anchor-regexp,
.token-keyword-operator-negation-regexp,
.token-keyword-operator-or-regexp,
.token-keyword-operator-quantifier-regexp,
.token-punctuation-definition-group-regexp,
.token-punctuation-definition-group-assertion-regexp,
.token-punctuation-definition-character-class-regexp,
.token-punctuation-character-set-begin-regexp,
.token-punctuation-character-set-end-regexp,
.token-support-other-parenthesis-regexp {
    color: var(--color-function);
}

/* invalid */
.token-invalid {
    color: var(--color-warn);
}`;
export const all = line + token;
