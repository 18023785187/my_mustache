import { isFunction, hasProperty, primitiveHasOwnProperty } from './utils'

/**
 * 存储值，可以根据对应规则的标识取出特定值。
 * 
 * 比如：初始化时存储的 view 是 'Tom'，那么可以调用 context.lookup('.') 取出 'Tom'，具体规则请看 lookup 方法
 */
export default class Context {
  public view: any
  public cache: { '.': Context['view'], [key: string]: any }
  public parent?: Context
  /**
   * 
   * @param {any} view // 渲染值，比如 view = { name: 'Tom' }，那么调用 lookup('name') 会返回 'Tom'
   * @param {Context} parentContext 
   */
  constructor(view: any, parentContext?: Context) {
    this.view = view
    /**
     *  缓存每次拿到的结果, 初始值为 '.'，应用场景是 {{.}}，
     * 在每次 lookup(name) 时都会把得出的结果添加到 cache 中，下一次直接获取缓存值。比如：
     * 
     * this.view = { a: { b: { c: 'Tom' } } }
     * this.lookup('a') // cache: { '.': { a: { b: { c: 'Tom' } } }, 'a': { b: { c: 'Tom' } } }
     * this.lookup('a.b') // cache: { '.': { a: { b: { c: 'Tom' } } }, 'a': { b: { c: 'Tom' } }, 'a.b': { c: 'Tom' } }
     * this.lookup('a.b.c') // cache: { '.': { a: { b: { c: 'Tom' } } }, 'a': { b: { c: 'Tom' } }, 'a.b': { c: 'Tom' }, 'a.b.c': 'Tom' }
     */
    this.cache = { '.': this.view }
    this.parent = parentContext
  }

  /**
   * 创建一个 Context 实例，并把自身作为该实例的父 Context
   * 
   * @param {any} view 渲染值
   * @returns {Context}
   */
  public push(view: any): Context {
    return new Context(view, this)
  }

  /**
   * 给定 name，查找 Context 实例是否有对应的值。
   *  
   * 查找规则：通过存储的 view 或 context 查找。
   * 
   * 比如 view = { a: { b: c: 'Tom' } }, name = 'a.b.c' ，那么可以找到结果，结果为 'Tom'。
   * 比如 view = { a: 'Tom' }, name = 'b' ，那么 view 中找不到对应结果，如果有父 context，将会找父 context 中的 view，直到找到或不再存在父 context 为止。
   * 
   * @param {string} name 属性链，比如是 '.'、'a'、'a.b.c' 等
   * @returns {any}
   */
  public lookup(name: string): any {
    const cache = this.cache // 获取缓存结果对象

    let value: any // 结果值
    if (cache.hasOwnProperty(name)) { // 如果在之前缓存有该值，那么直接取到
      value = cache[name]
    } else {
      let context: this | Context['parent'] = this // 当前作用域
      let intermediateValue: any // 过渡值，类似于数组两个数交换时定义的一个 temp
      let names: string[] // 分割后的 name 数组
      let index: number // 指向 names 的索引
      let lookupHit = false // 是否找到目标值

      while (context) {
        if (name.indexOf('.') > 0) {
          intermediateValue = context.view // 初始化 intermediateValue
          names = name.split('.') // 如果 name 是 'a.b.c'，则拆成 ['a', 'b', 'c']
          index = 0

          while (intermediateValue != null && index < names.length) {
            if (index === names.length - 1) {
              lookupHit = (
                hasProperty(intermediateValue, names[index])
                /**
                 * 这种情形在 intermediateValue 是个字符串，names[index] 是索引时适用
                 * 
                 * intermediateValue = 'hello'
                 * name = a.b.c.0, names[index] = '0'
                 * 
                 * primitiveHasOwnProperty(intermediateValue, names[index]) // true
                 */
                || primitiveHasOwnProperty(intermediateValue, names[index])
              )
            }

            /**
             * 这个操作相当于链式获取某个值，比如：
             * 
             *  intermediateValue = { a: { b: { c: 'Tom' } } }, names = ['a', 'b', 'c']
             * 
             * 那么每次循环的情景是：
             *  intermediateValue = intermediateValue['a'] // { b: { c: 'Tom' } }
             *  intermediateValue = intermediateValue['b'] // { c: 'Tom' }
             *  intermediateValue = intermediateValue['c'] // 'Tom'
             */
            intermediateValue = intermediateValue[names[index++]]
          }
        } else { // 如果 name 中没有 .
          intermediateValue = context.view[name]

          lookupHit = hasProperty(context.view, name)
        }

        if (lookupHit) { // 如果找到了目标值，那么结束循环
          value = intermediateValue
          break
        }

        context = context.parent // 如果没有找到目标值，那么继续往上找父 context，直到找到或 context 为空
      }

      cache[name] = value // 向 cache 添加结果，下次遇到相同值直接取出
    }

    if (isFunction(value)) { // 如果 value 是一个函数，那么调用该函数把返回值赋值给 value
      value = value.call(this.view)
    }

    return value
  }
}
