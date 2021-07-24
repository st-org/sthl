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
export interface VSCT {
    include?: string[] | string;
    tokenColors?: {
        scope: string[] | string;
        settings: {
            fontStyle?: string;
            foreground?: string;
        };
    }[];
}
export declare function extractThemeFromVSCT(vsct: VSCT): Theme;
export declare function extractThemeFromVSCTURLs(urls: string[], dir?: string): Promise<Theme>;
export declare function extractThemeFromThemeURLs(urls: string[], dir?: string): Promise<Theme>;
export {};
