/**
 * 存储值，可以根据对应规则的标识取出特定值。
 *
 * 比如：初始化时存储的 view 是 'Tom'，那么可以调用 context.lookup('.') 取出 'Tom'，具体规则请看 lookup 方法
 */
export default class Context {
    view: any;
    cache: {
        '.': Context['view'];
        [key: string]: any;
    };
    parent?: Context;
    /**
     *
     * @param {any} view // 渲染值，比如 view = { name: 'Tom' }，那么调用 lookup('name') 会返回 'Tom'
     * @param {Context} parentContext
     */
    constructor(view: any, parentContext?: Context);
    /**
     * 创建一个 Context 实例，并把自身作为该实例的父 Context
     *
     * @param {any} view 渲染值
     * @returns {Context}
     */
    push(view: any): Context;
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
    lookup(name: string): any;
}
