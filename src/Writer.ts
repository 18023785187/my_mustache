import { mustache, token, renderConfig, renderPartials, tags } from './mustache'
import parseTemplate from './parseTemplate'
import Context from './Context'
import { isArray, isFunction } from './utils'

/**
 * Writer 整合了各类工具，集成了 mustache 的各类方法，可以针对 token 的类型处理模板，为核心类。
 * Writer 还具有缓存功能，能够将相同条件下生成的 tokens 进行缓存，在下次遇到相同条件时取出缓存值即可。
 */
export default class Writer {
  public templateCache: {
    _cache: { [key: string]: token[] },
    set: (key: string, value: token[]) => void,
    get: (key: string) => token[] | undefined,
    clear: () => void,
  }
  constructor() {
    // 创建缓存器，用于缓存转义后的模板 tokens
    this.templateCache = {
      _cache: {},
      set: function set(key, value) {
        this._cache[key] = value
      },
      get: function get(key) {
        return this._cache[key]
      },
      clear: function clear() {
        this._cache = {}
      }
    }
  }

  /**
   * 清除缓存对象中的缓存值
   */
  public clearCache(): void {
    if (typeof this.templateCache !== 'undefined') {
      this.templateCache.clear()
    }
  }

  /**
   * 查找缓存或调用 parseTemplate 方法将 template 转为 tokens
   * @see parseTemplate
   * @param {string} template 
   * @param {tags} tags 
   * @returns {token[]}
   */
  public parse(template: string, tags?: tags): token[] {
    const cache = this.templateCache // 获取缓存对象
    const cacheKey = template + ':' + (tags || mustache.tags).join(':') // 创建缓存标识
    const isCacheEnabled = typeof cache !== 'undefined' // 获取是否需要缓存标识
    let tokens = isCacheEnabled ? cache.get(cacheKey) : undefined

    if (tokens == undefined) { // 如果没有缓存或未开启获取，则调用 parseTemplate 得到 tokens
      tokens = parseTemplate(template, tags)
      isCacheEnabled && cache.set(cacheKey, tokens)
    }
    return tokens
  }

  /**
   * 把 tokens 转换为结果视图
   * @param {string} template 模板
   * @param {any} view 渲染视图
   * @param {renderPartials} partials 子模板对象或方法
   * @param {renderConfig} config 配置项
   * @returns {string}
   */
  public render(template: string, view: any, partials: renderPartials, config: renderConfig | undefined): string {
    const tags = this.getConfigTags(config)
    const tokens = this.parse(template, tags)
    const context = (view instanceof Context) ? view : new Context(view, undefined)
    return this.renderTokens(tokens, context, partials, template, config)
  }

  /**
   * 根据 token 的标识用不同的方法处理 token
   * @param {token[]} tokens 
   * @param {Context} context 
   * @param {renderPartials} partials 
   * @param {string} originalTemplate template
   * @param {renderConfig | undefined} config 
   * @returns {string}
   */
  private renderTokens(tokens: token[], context: Context, partials: renderPartials, originalTemplate: string, config?: renderConfig): string {
    let buffer = '' // 结果，由 token 和 context 根据规则生成的文本内容

    let token: token
    let symbol: string
    let value: string | undefined
    for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined // 重置 value
      token = tokens[i] // 获取当前 token
      symbol = token[0] // 获取 token 标识

      switch (symbol) { // 根据标识决定使用何种方式处理 token
        case '#': // {{#name}}
          value = this.renderSection(token, context, partials, originalTemplate, config)
          break
        case '^': // {{^name}}
          value = this.renderInverted(token, context, partials, originalTemplate, config)
          break
        case '>': // {{>name}}
          value = this.renderPartial(token, context, partials, config)
          break
        case '&': // {{&name}} 或 {{{name}}}
          value = this.unescapedValue(token, context)
          break
        case 'name': // {{name}}
          value = this.escapedValue(token, context, config)
          break
        case 'text': // text
          value = this.rawValue(token)
          break
      }

      if (value !== undefined) {
        buffer += value
      }
    }

    return buffer
  }

  /**
   * 针对 {{#name}} 的处理
   * @param {token} token 
   * @param {Context} context 
   * @param {renderPartials} partials 
   * @param {string} originalTemplate template
   * @param {renderConfig | undefined} config 
   * @returns {string | undefined}
   */
  private renderSection(token: token, context: Context, partials: renderPartials, originalTemplate: string, config?: renderConfig): string | undefined {
    const self = this
    let buffer = ''
    let value = context.lookup(token[1]) // 获取当前的作用域值

    /**
     * 当 value 为函数时，该方法充当 value 的渲染器
     * @param {string} template 
     * @returns {string}
     */
    function subRender(template: string): string {
      return self.render(template, context, partials, config)
    }

    if (!value) return // 当值为 falsy 类型时，将不会渲染任何内容

    if (isArray(value)) { // 当 value 是一个数组时，那么会遍历渲染子模板
      for (let j = 0, valueLength = value.length; j < valueLength; ++j) {
        // 把子 token 和当前项作用域交给 renderTokens 进行渲染
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config)
      }
    } else if (['object', 'string', 'number'].includes(typeof value)) { // 当 value 是对象、字符串、数字类型时，把 value 当作作用域渲染子 token
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config)
    } else if (isFunction(value)) { // 当 value 是方法时，会根据该方法渲染模板
      if (typeof originalTemplate !== 'string') {
        throw new Error('Cannot use higher-order sections without the original template')
      }

      // 调用 value 获取渲染结果，第一个参数为模板中此段渲染部分的字符串，第二个参数是渲染器
      value = value.call(
        context.view, originalTemplate.slice(token[3], token[5]), subRender
      ) as (t: typeof originalTemplate, r: typeof subRender) => any

      if (value != null) {
        buffer += value
      }
    } else { // 当 value 为 true，那么渲染子 token
      buffer += this.renderTokens(token[4], context, partials, originalTemplate, config)
    }
    return buffer
  }

  /**
   * 针对 {{^name}} 的处理
   * @param {token} token 
   * @param {Context} context 
   * @param {renderPartials} partials 
   * @param {string} originalTemplate template 
   * @param {renderConfig | undefined} config 
   * @returns {string | undefined}
   */
  renderInverted(token: token, context: Context, partials: renderPartials, originalTemplate: string, config?: renderConfig): string | undefined {
    const value = context.lookup(token[1]) // 获取当前的作用域值

    if (!value || (isArray(value) && value.length === 0)) { // 如果 value 是 falsy 或空数组时才会渲染子 token
      return this.renderTokens(token[4], context, partials, originalTemplate, config)
    }
  }

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
  indentPartial(partial: string, indentation: string, lineHasNonSpace: boolean): string {
    const filteredIndentation = indentation.replace(/[^ \t]/g, '') // 把换行符去掉，只保留缩进和空格
    const partialByNl = partial.split('\n') // 子模板以行分组处理

    for (let i = 0; i < partialByNl.length; i++) {
      // 如果当前行有非空格，那么第一行不用处理，否则统一在每行都加上 indentation
      if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
        partialByNl[i] = filteredIndentation + partialByNl[i]
      }
    }

    return partialByNl.join('\n')
  }

  /**
   * 针对 {{>name}} 的处理
   * @param {token} token 
   * @param {Context} context 
   * @param {renderPartials} partials 
   * @param {renderConfig | undefined} config 
   * @returns {string | undefined}
   */
  renderPartial(token: token, context: Context, partials: renderPartials, config?: renderConfig): string | undefined {
    if (!partials) return // 如果子模板对象或方法为空，则不渲染任何内容
    const tags = this.getConfigTags(config) // 获取标签类型

    // 获取子模板，当 partials 为方法时，则调用方法，否则从对象中获取
    const value = isFunction(partials) ?
      (partials as (name: string) => string)(token[1]) :
      (partials as { [key: string]: any })[token[1]]
    if (value != null) {
      const lineHasNonSpace: boolean = token[6] // 原模板当前行是否有非空格
      const tagIndex: number = token[5] // 原模板当前行的标签数
      const indentation: string = token[4] // 当前 token 在原模板当前行中收集到的缩进
      let indentedValue = value as string // 处理缩进后得到的子模板
      if (tagIndex === 0 && indentation) { // 只有在原模板当前行没有标签，才会去处理缩进
        indentedValue = this.indentPartial(value, indentation, lineHasNonSpace)
      }
      const tokens = this.parse(indentedValue, tags)
      return this.renderTokens(tokens, context, partials, indentedValue, config)
    }
  }

  /**
   * 针对 {{&name}} 或 {{{name}}} 的处理
   * @param {token} token 
   * @param {Context} context 
   * @returns {any | undefined}
   */
  private unescapedValue(token: token, context: Context): any | undefined {
    const value = context.lookup(token[1]) // 获取当前的作用域值
    if (value != null) {
      return value
    }
  }

  /**
   * 针对 {{name}} 的处理
   * @param {token} token 
   * @param {Context} context 
   * @param {renderConfig | undefined} config 
   * @returns {any | string | undefined}
   */
  private escapedValue(token: token, context: Context, config?: renderConfig): any | string | undefined {
    const escape = this.getConfigEscape(config) || mustache.escape // 获取文本转义方法
    const value = context.lookup(token[1]) // 获取当前的作用域值
    if (value != null) {
      // 如果 value 是数字类型并且转义方法是默认的转义方法，则把 value 转为字符串返回，否则调用自定义的转义方法返回
      return (typeof value === 'number' && escape === mustache.escape) ? String(value) : escape!(value)
    }
  }

  /**
   * 针对 text 的处理
   * @param {token} token 
   * @returns {string}
   */
  private rawValue(token: token): string {
    return token[1]
  }

  /**
   * 获取自定义标签
   * @param {renderConfig | tags | undefined} config 
   * @returns {tags | undefined}
   */
  private getConfigTags(config: renderConfig | tags | undefined): tags | undefined {
    if (isArray(config)) { // 当 config 是数组时，将当作标签直接返回
      return config
    }
    else if (config && typeof config === 'object') { // 当 config 时对象时，返回 config.tags
      return config.tags
    }
    else {
      return undefined
    }
  }

  /**
   * 获取自定义转义器
   * @param {renderConfig | undefined} config 
   * @returns {renderConfig.escape | undefined}
   */
  private getConfigEscape(config?: renderConfig): renderConfig['escape'] | undefined {
    // 只有 config 是一个对象时，才会去获取 config.escape
    if (config && typeof config === 'object' && !isArray(config)) {
      return config.escape
    }
    else {
      return undefined
    }
  }
}
