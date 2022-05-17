import Scanner from './Scanner';
import Context from './Context';
import Writer from './Writer';
/**
 * 标签的类型
 */
export declare type tags = [string, string];
/**
 * 子模板对象或方法，render 的第三个参数
 */
export declare type renderPartials = {
    [key: string]: any;
} | ((name: string) => string) | undefined;
/**
 * 配置项，render 的第四个参数
 */
export declare type renderConfig = {
    escape?: (value: string) => any;
    tags?: tags;
};
/**
 * token
 */
export declare type token = any[];
/**
 * 转义 html 文本中的符号，该方法会根据上面的 entityMap 替换
 * @param {string} string
 * @returns {string}
 */
declare function escapeHtml(string: string): string;
export declare const mustache: {
    name: string;
    version: string;
    tags: [string, string];
    clearCache(): void;
    escape: typeof escapeHtml;
    parse(template: string, tags?: tags | undefined): token[];
    render(template: any, view: any, partials?: renderPartials, config?: renderConfig | undefined): string;
    Scanner: typeof Scanner;
    Context: typeof Context;
    Writer: typeof Writer;
    templateCache: {
        _cache: {
            [key: string]: token[];
        };
        set: (key: string, value: token[]) => void;
        get: (key: string) => token[] | undefined;
        clear: () => void;
    };
};
export {};
