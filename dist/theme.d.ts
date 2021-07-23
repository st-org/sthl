interface Style {
    color?: string;
    fontStyle?: string;
    fontWeight?: string;
    textDecoration?: string;
}
export declare type Theme = {
    scopeNames: string[];
    style: Style;
}[];
export interface VST {
    include?: string[] | string;
    tokenColors?: {
        scope: string[] | string;
        settings: {
            fontStyle?: string;
            foreground?: string;
        };
    }[];
}
export declare function extractThemeFromVST(vst: VST): Theme;
export declare function extractThemeFromVSTURLs(urls: string[], dir?: string): Promise<Theme>;
export declare function extractThemeFromThemeURLs(urls: string[], dir?: string): Promise<Theme>;
export {};
