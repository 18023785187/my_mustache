export declare const isArray: (arg: any) => arg is any[];
export declare function isFunction(object: any): boolean;
/**
 * 检查 obj 是否为对象且 propName 是否为 obj 的属性（继承或原型链上的属性也符合）
 * @param {any} obj
 * @param {symbol | string | number} propName
 * @returns {boolean}
 */
export declare function hasProperty(obj: any, propName: symbol | string | number): boolean;
/**
 * 判断 primitive 是否不为 null 且不为 object 且有 hasProperty 并且 propName 是 primitive 的属性
 *
 * 例如 string 类型将符合要求
 *
 * @param {any} primitive
 * @param {string} propName
 * @returns {boolean}
 */
export declare function primitiveHasOwnProperty(primitive: any, propName: string): boolean;
