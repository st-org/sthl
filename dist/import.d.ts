import type * as json5 from 'json5';
export declare const getMod: <T extends "json5">(name: T) => Promise<{
    json5: {
        default: typeof json5;
    };
}[T]>;
