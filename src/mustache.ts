/**
 * mustache 对象
 */
import { isArray } from './utils'
import Scanner from './Scanner'
import Context from './Context'
import Writer from './Writer'

/**
 * 标签的类型
 */
export type tags = [string, string]
/**
 * 子模板对象或方法，render 的第三个参数
 */
export type renderPartials = { [key: string]: any } | ((name: string) => string) | undefined
/**
 * 配置项，render 的第四个参数
 */
export type renderConfig = {
  escape?: (value: string) => any,
  tags?: tags,
}
/**
 * token
 */
export type token = any[]

/**
 * 与 typeof 作用一致，但是修复了 array 为 object 的错误
 * @param {any} obj 
 * @returns {'array' | typeof obj}
 */
function typeStr(obj: any): 'array' | typeof obj {
  return isArray(obj) ? 'array' : typeof obj
}

type entity = '&' | '<' | '>' | '"' | "'" | '/' | '`' | '='
const entityMap = { // 符号转义表
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}
/**
 * 转义 html 文本中的符号，该方法会根据上面的 entityMap 替换
 * @param {string} string 
 * @returns {string}
 */
function escapeHtml(string: string): string {
  return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s: entity) {
    return entityMap[s]
  })
}

const defaultWriter = new Writer()

export const mustache = {
  name: 'mustache.js',
  version: '?.?.?',
  tags: ['{{', '}}'] as [string, string], // 默认标签
  clearCache() {
    return defaultWriter.clearCache()
  },
  escape: escapeHtml,
  parse(template: string, tags?: tags) {
    return defaultWriter.parse(template, tags)
  },
  render(template: any, view: any, partials?: renderPartials, config?: renderConfig) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
        'but "' + typeStr(template) + '" was given as the first ' +
        'argument for mustache#render(template, view, partials)')
    }

    return defaultWriter.render(template, view, partials, config)
  },
  Scanner: Scanner,
  Context: Context,
  Writer: Writer,
  set templateCache(cache) {
    defaultWriter.templateCache = cache
  },
  get templateCache() {
    return defaultWriter.templateCache
  },
}
