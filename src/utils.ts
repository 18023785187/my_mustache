/**
 * @description 以下都是为正文准备的工具方法，可以先浏览一遍对所有方法有一个印象
 */
const objectToString = Object.prototype.toString
export const isArray = Array.isArray || function isArrayPolyfill(object: any): boolean {
  return objectToString.call(object) === '[object Array]'
}

export function isFunction(object: any): boolean {
  return typeof object === 'function'
}

/**
 * 检查 obj 是否为对象且 propName 是否为 obj 的属性（继承或原型链上的属性也符合）
 * @param {any} obj 
 * @param {symbol | string | number} propName 
 * @returns {boolean}
 */
export function hasProperty(obj: any, propName: symbol | string | number): boolean {
  return obj != null && typeof obj === 'object' && (propName in obj)
}

/**
 * 判断 primitive 是否不为 null 且不为 object 且有 hasProperty 并且 propName 是 primitive 的属性
 * 
 * 例如 string 类型将符合要求
 * 
 * @param {any} primitive 
 * @param {string} propName 
 * @returns {boolean}
 */
export function primitiveHasOwnProperty(primitive: any, propName: string): boolean {
  return (
    primitive != null
    && typeof primitive !== 'object'
    && primitive.hasProperty
    && primitive.hasProperty(propName)
  )
}
