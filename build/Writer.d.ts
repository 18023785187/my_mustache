import { token, renderConfig, renderPartials, tags } from './mustache';
import Context from './Context';
/**
 * Writer 整合了各类工具，集成了 mustache 的各类方法，可以针对 token 的类型处理模板，为核心类。
 * Writer 还具有缓存功能，能够将相同条件下生成的 tokens 进行缓存，在下次遇到相同条件时取出缓存值即可。
 */
export default class Writer {
    templateCache: {
        _cache: {
            [key: string]: token[];
        };
        set: (key: string, value: token[]) => void;
        get: (key: string) => token[] | undefined;
        clear: () => void;
    };
    constructor();
    /**
     * 清除缓存对象中的缓存值
     */
    clearCache(): void;
    /**
     * 查找缓存或调用 parseTemplate 方法将 template 转为 tokens
     * @see parseTemplate
     * @param {string} template
     * @param {tags} tags
     * @returns {token[]}
     */
    parse(template: string, tags?: tags): token[];
    /**
     * 把 tokens 转换为结果视图
     * @param {string} template 模板
     * @param {any} view 渲染视图
     * @param {renderPartials} partials 子模板对象或方法
     * @param {renderConfig} config 配置项
     * @returns {string}
     */
    render(template: string, view: any, partials: renderPartials, config: renderConfig | undefined): string;
    /**
     * 根据 token 的标识用不同的方法处理 token
     * @param {token[]} tokens
     * @param {Context} context
     * @param {renderPartials} partials
     * @param {string} originalTemplate template
     * @param {renderConfig | undefined} config
     * @returns {string}
     */
    private renderTokens;
    /**
     * 针对 {{#name}} 的处理
     * @param {token} token
     * @param {Context} context
     * @param {renderPartials} partials
     * @param {string} originalTemplate template
     * @param {renderConfig | undefined} config
     * @returns {string | undefined}
     */
    private renderSection;
    /**
     * 针对 {{^name}} 的处理
     * @param {token} token
     * @param {Context} context
     * @param {renderPartials} partials
     * @param {string} originalTemplate template
     * @param {renderConfig | undefined} config
     * @returns {string | undefined}
     */
    renderInverted(token: token, context: Context, partials: renderPartials, originalTemplate: string, config?: renderConfig): string | undefined;
    /**
     * 处理原模板中子模板前的空白字符。
     *
     *  比如原模板 template = ' {{>childTemplate}}'，子模板 childTemplate = 'I\nLove\nU'，
     * 那么处理后得到的结果如下：
     *
     * ' I\n Love\n U'
     *
     *  还有一种情况是原模板前面有非空白字符，比如 template = ' Hi,{{>childTemplate}}'，
     * 那么处理后得到的结果如下：
     *
     * ' Hi,I\n    Love\n    U'
     *
     * @param {string} partial 子模板
     * @param {string} indentation 空白字符，包含 、\t、\n
     * @param {boolean} lineHasNonSpace 原模板当前行是否有非空格
     * @returns {string}
     */
    indentPartial(partial: string, indentation: string, lineHasNonSpace: boolean): string;
    /**
     * 针对 {{>name}} 的处理
     * @param {token} token
     * @param {Context} context
     * @param {renderPartials} partials
     * @param {renderConfig | undefined} config
     * @returns {string | undefined}
     */
    renderPartial(token: token, context: Context, partials: renderPartials, config?: renderConfig): string | undefined;
    /**
     * 针对 {{&name}} 或 {{{name}}} 的处理
     * @param {token} token
     * @param {Context} context
     * @returns {any | undefined}
     */
    private unescapedValue;
    /**
     * 针对 {{name}} 的处理
     * @param {token} token
     * @param {Context} context
     * @param {renderConfig | undefined} config
     * @returns {any | string | undefined}
     */
    private escapedValue;
    /**
     * 针对 text 的处理
     * @param {token} token
     * @returns {string}
     */
    private rawValue;
    /**
     * 获取自定义标签
     * @param {renderConfig | tags | undefined} config
     * @returns {tags | undefined}
     */
    private getConfigTags;
    /**
     * 获取自定义转义器
     * @param {renderConfig | undefined} config
     * @returns {renderConfig.escape | undefined}
     */
    private getConfigEscape;
}
