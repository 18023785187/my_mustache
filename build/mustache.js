(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["mustache"] = factory();
	else
		root["mustache"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "mustache": () => (/* reexport */ mustache)
});

;// CONCATENATED MODULE: ./src/utils.ts
/**
 * @description 以下都是为正文准备的工具方法，可以先浏览一遍对所有方法有一个印象
 */
const objectToString = Object.prototype.toString;
const isArray = Array.isArray || function isArrayPolyfill(object) {
    return objectToString.call(object) === '[object Array]';
};
function isFunction(object) {
    return typeof object === 'function';
}
/**
 * 检查 obj 是否为对象且 propName 是否为 obj 的属性（继承或原型链上的属性也符合）
 * @param {any} obj
 * @param {symbol | string | number} propName
 * @returns {boolean}
 */
function hasProperty(obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
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
function primitiveHasOwnProperty(primitive, propName) {
    return (primitive != null
        && typeof primitive !== 'object'
        && primitive.hasProperty
        && primitive.hasProperty(propName));
}

;// CONCATENATED MODULE: ./src/Scanner.ts
/**
 * 扫描器，传入字符串模板 string，通过标记 tag 收集相关 string 片段。
 *
 * scanUntil 可以收集 tag 前的字符
 * scanner 可以标识当前 tag 是否位于 string 开头
 * eos 判断 string 是否已扫描完成
 *
 * 例子：
 *  入参字符串模板为 '你好，{{name}}！'
 *
 *  scanner.scanUntil('{{') -> '你好，'
 *  scanner.eos()           -> false
 *  scanner.scan('{{')      -> '{{'
 *  scanner.eos()           -> false
 *  scanner.scanUntil('}}') -> 'name'
 *  scanner.eos()           -> false
 *  scanner.scan('}}')      -> '}}'
 *  scanner.eos()           -> false
 *  scanner.scanUntil('{{') -> '！'
 *  scanner.eos()           -> true
 */
class Scanner {
    constructor(string) {
        this.string = string;
        this.tail = string;
        this.pos = 0;
    }
    /**
     * 判断字符串是否已扫描完成
     * @returns {boolean}
     */
    eos() {
        return this.tail === '';
    }
    /**
     * 扫描 tag，如果 tag 在 tail 开头位置那么把 tag 匹配的字符截取并返回，否则返回空字符。
     *
     * @param {RegExp | string} re tag 的正则表达式或字符串
     * @returns {string}
     */
    scan(re) {
        const match = this.tail.match(re);
        if (!match || match.index !== 0) { // 如果没有匹配到或匹配到的 tag 字符串不在 tail 开头，那么返回空字符
            return '';
        }
        const string = match[0];
        this.tail = this.tail.substring(string.length);
        this.pos += string.length;
        return string;
    }
    /**
     * 扫描 tag，跳过匹配字符串之前的字符串，并返回跳过的字符串。
     *
     * 三种情况：
     *  1、如果没有匹配字符串，则返回整个 tail。
     *  2、如果匹配字符串在 tail 的头部，说明没有可跳过的字符串，返回空字符。
     *  3、如果匹配字符串在 tail 的中间，那么返回匹配字符串之前的字符串。
     *
     * 例子：
     *  假设 tag 是 {{，
     *    对于第一种情况，有 'hello' -> 'hello'
     *    对于第二种情况，有 '{{hello}}' -> ''
     *    对于第三种情况，有 'hello，{{hi}}' -> 'hello，'
     *
     * @param {RegExp | string} re tag 的正则表达式或字符串
     * @returns {string}
     */
    scanUntil(re) {
        const index = this.tail.search(re);
        let match;
        switch (index) {
            case -1: // 第一种情况
                match = this.tail;
                this.tail = '';
                break;
            case 0: // 第二种情况
                match = '';
                break;
            default: // 第三种情况
                match = this.tail.substring(0, index);
                this.tail = this.tail.substring(index);
        }
        this.pos += match.length; // 同时扫描指针要后移
        return match;
    }
}

;// CONCATENATED MODULE: ./src/Context.ts

/**
 * 存储值，可以根据对应规则的标识取出特定值。
 *
 * 比如：初始化时存储的 view 是 'Tom'，那么可以调用 context.lookup('.') 取出 'Tom'，具体规则请看 lookup 方法
 */
class Context {
    /**
     *
     * @param {any} view // 渲染值，比如 view = { name: 'Tom' }，那么调用 lookup('name') 会返回 'Tom'
     * @param {Context} parentContext
     */
    constructor(view, parentContext) {
        this.view = view;
        /**
         *  缓存每次拿到的结果, 初始值为 '.'，应用场景是 {{.}}，
         * 在每次 lookup(name) 时都会把得出的结果添加到 cache 中，下一次直接获取缓存值。比如：
         *
         * this.view = { a: { b: { c: 'Tom' } } }
         * this.lookup('a') // cache: { '.': { a: { b: { c: 'Tom' } } }, 'a': { b: { c: 'Tom' } } }
         * this.lookup('a.b') // cache: { '.': { a: { b: { c: 'Tom' } } }, 'a': { b: { c: 'Tom' } }, 'a.b': { c: 'Tom' } }
         * this.lookup('a.b.c') // cache: { '.': { a: { b: { c: 'Tom' } } }, 'a': { b: { c: 'Tom' } }, 'a.b': { c: 'Tom' }, 'a.b.c': 'Tom' }
         */
        this.cache = { '.': this.view };
        this.parent = parentContext;
    }
    /**
     * 创建一个 Context 实例，并把自身作为该实例的父 Context
     *
     * @param {any} view 渲染值
     * @returns {Context}
     */
    push(view) {
        return new Context(view, this);
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
    lookup(name) {
        const cache = this.cache; // 获取缓存结果对象
        let value; // 结果值
        if (cache.hasOwnProperty(name)) { // 如果在之前缓存有该值，那么直接取到
            value = cache[name];
        }
        else {
            let context = this; // 当前作用域
            let intermediateValue; // 过渡值，类似于数组两个数交换时定义的一个 temp
            let names; // 分割后的 name 数组
            let index; // 指向 names 的索引
            let lookupHit = false; // 是否找到目标值
            while (context) {
                if (name.indexOf('.') > 0) {
                    intermediateValue = context.view; // 初始化 intermediateValue
                    names = name.split('.'); // 如果 name 是 'a.b.c'，则拆成 ['a', 'b', 'c']
                    index = 0;
                    while (intermediateValue != null && index < names.length) {
                        if (index === names.length - 1) {
                            lookupHit = (hasProperty(intermediateValue, names[index])
                                /**
                                 * 这种情形在 intermediateValue 是个字符串，names[index] 是索引时适用
                                 *
                                 * intermediateValue = 'hello'
                                 * name = a.b.c.0, names[index] = '0'
                                 *
                                 * primitiveHasOwnProperty(intermediateValue, names[index]) // true
                                 */
                                || primitiveHasOwnProperty(intermediateValue, names[index]));
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
                        intermediateValue = intermediateValue[names[index++]];
                    }
                }
                else { // 如果 name 中没有 .
                    intermediateValue = context.view[name];
                    lookupHit = hasProperty(context.view, name);
                }
                if (lookupHit) { // 如果找到了目标值，那么结束循环
                    value = intermediateValue;
                    break;
                }
                context = context.parent; // 如果没有找到目标值，那么继续往上找父 context，直到找到或 context 为空
            }
            cache[name] = value; // 向 cache 添加结果，下次遇到相同值直接取出
        }
        if (isFunction(value)) { // 如果 value 是一个函数，那么调用该函数把返回值赋值给 value
            value = value.call(this.view);
        }
        return value;
    }
}

;// CONCATENATED MODULE: ./src/parseTemplate.ts



/**
 * 在所有 - [ ] { } ( ) * + ? . , \ ^ $ # 所有空格 前添加 \
 * 如 '-[]' -> '\-\[\]'
 * @param {string} string
 * @returns {string}
 */
function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
}
const regExpTest = RegExp.prototype.test;
function testRegExp(re, string) {
    return regExpTest.call(re, string);
}
const nonSpaceRe = /\S/; // 匹配非空字符
function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
}
const whiteRe = /\s*/; // 匹配空白
const spaceRe = /\s+/; // 匹配至少一个空格
const equalsRe = /\s*=/; // 匹配 =
const curlyRe = /\s*\}/; // 匹配 }
const tagRe = /#|\^|\/|>|\{|&|=|!/; // 匹配 #、^、/、>、{、&、=、!
/**
 * 扫描 template，根据 tags 及其规则生成 tokens
 *
 *  tokens 是一个多维数组，其作为某段 template 片段的描述，类似于 AST 抽象语法树，
 * 将文字解析成 tokens 后可以根据里面 token 更好更有规律地转义 template。
 *
 * 例子：
 *  const template = '你好，{{name}}！'
 *  const tags = ['{{', '}}']
 *
 *  parseTemplate(template, tags) // [[ 'text', '你好，', 0, 3 ], [ 'name', 'name', 3, 11 ], [ 'text', '！', 11, 12 ]]
 *
 *  上述 tokens 中的 token 是最基础的形态，类型为 [type, text, startIdx, endIdx]
 *
 *  其中：
 *    type 为该 token 的处理类型，后续可以根据 type 来对该 token 进行处理;
 *    text 为该 token 的文本信息，该文本就是在 template 提取的文本;
 *    startIdx 和 endIdx 为该 token 对于 template 的起始和结束的位置索引;
 *
 *    实际上根据 type 的不同生成的 token 类型也会有所不同，比如某类 token 还会存储儿子 token，
 *  这就是说为什么 tokens 是一个多维数组的原因。具体的 token 生成规则和处理方法，请继续往下看。
 *
 * 注：下面所有例子和描述的 tags 以默认值 ['{{', '}}'] 为例
 *
 * @param {string} template 字符串模版
 * @param {tags} tags 标记
 * @returns {token[]} tokens
 */
function parseTemplate(template, tags) {
    if (!template) {
        return [];
    }
    let lineHasNonSpace = false; // 当前行是否有非空格
    const sections = []; // 存储 {{#names}}、{{^names}} 标记，用于判断这些标记是否有匹配 {{/names}}
    const tokens = []; // token 数组
    let spaces = []; // 存储在当前行中每个空格的 token 索引，当遇到 {{#names}} 时且当前项全是空格时，会把 tokens 中对应 spaces 索引的 token 全部删除
    let hasTag = false; // 当前行是否有标签 {{}}
    let nonSpace = false; // 是否有非空格
    let indentation = ''; // 当前行收集到的缩进，又称空白字符串
    let tagIndex = 0; // 每一行文本所遇到的 {{}} 数量
    /**
     * 当遇到 {{#names}} 且当前行全部为空格时，会把所有空格移除。
     *
     * 例如 :
     *  template: '    {{#names}}    \n{{name}}{{/names}}'
     *  view: { names: { name: 'Tom' } }
     *
     *  output: 'Tom'
     *
     * {{#names}} 前后的空格已被移除，但当 {{#names}} 所在的当前行如果有非空格字符，这个规则将不适用。
     */
    function stripSpace() {
        if (hasTag && !nonSpace) { // 如果检测到有标签且全是空格，这里的标签只能是 {{#names}}
            while (spaces.length) // 删除 tokens 中所有空格 token
                delete tokens[spaces.pop()];
        }
        else {
            spaces = []; // 重置
        }
        hasTag = false; // 重置
        nonSpace = false; // 重置
    }
    let openingTagRe; // 开口标签正则
    let closingTagRe; // 闭口标签正则
    let closingCurlyRe; // } + closingTagRe 正则，比如闭口标签为 }}，那么该正则为 }}}
    /**
     * 处理 tags，根据 tags 生成对应的正则表达式，tags 必须为数组或字符串，例如 ['{{', '}}'] 或 '{{ }}'
     *
     * 为什么会有字符串？因为在遇到 {{=<% %>=}} 的时候会把 '<% %>' 作为参数传入，这时就需要将其解析为标签
     *
     * @param {string | tags} tagsToCompile
     */
    function compileTags(tagsToCompile) {
        if (typeof tagsToCompile === 'string') {
            tagsToCompile = tagsToCompile.split(spaceRe, 2); // 生成至少一个空格作为分隔符，长度为 2 的数组，例如： '{{  }}' -> ['{{', '}}']
        }
        if (!isArray(tagsToCompile) && tagsToCompile.length !== 2) { // 如果 tagsToCompile 不是数组或数组长度不等于 2，说明不符合条件，抛出错误
            throw new Error('Invalid tags: ' + tagsToCompile);
        }
        openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*'); // /\{\{\s*/
        closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1])); // /\s*\}\}/
        closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1])); // /\s*\}\}\}/
    }
    compileTags(tags || mustache.tags); // 初始化编译一个 tags 确定标签的样式
    const scanner = new Scanner(template); // 创建扫描器，下面循环将围绕扫描器收集 token
    let start; // 每次扫描一对 {{}} 即每次循环时，扫描器 scanner 的当前指针
    let type; // 每个标签的类型，后面会根据类型去处理 token
    let value; // {{ 或 }} 前的文本，比如：'hello, {{name}}' 对应的文本是 hello, 和 name
    let chr; // 文本中每一个字符
    let token; // 存储的信息标识
    let openSection; // 每次遇到 {{/names}} 时从 sections 弹出的开口标签
    while (!scanner.eos()) { // 循环使扫描器扫描完成，每次循环都会扫描出一对 {{}}
        start = scanner.pos;
        value = scanner.scanUntil(openingTagRe); // 获取 {{ 前或全部文本
        if (value) { // 循环将文本转换成单字符 token，方便后续处理
            for (let i = 0, valueLength = value.length; i < valueLength; ++i) {
                chr = value.charAt(i); // 获取当前字符
                if (isWhitespace(chr)) { // 如果该字符为空白字符，记录该空白 token 的位置，同时增加缩进的长度
                    spaces.push(tokens.length);
                    indentation += chr;
                }
                else {
                    /**
                     * @see {Writer.indentPartial} 如果有非空白字符，记录当前行有非空格字符，缩进长度也需增加
                     */
                    nonSpace = true;
                    lineHasNonSpace = true;
                    indentation += ' ';
                }
                tokens.push(['text', chr, start, start + 1]);
                start += 1;
                if (chr === '\n') { // 如果 chr 是一个换行符，说明当前行已经遍历结束，重置新的行
                    stripSpace();
                    indentation = '';
                    tagIndex = 0;
                    lineHasNonSpace = false;
                }
            }
        }
        if (!scanner.scan(openingTagRe)) { // 如果找不到 {{ ，返回
            break;
        }
        hasTag = true; // 否则该行一定有 {{ 标签
        type = scanner.scan(tagRe) || 'name'; // 获取标签的类型，要么是特殊标签，要么是普通标签 {{name}}
        scanner.scan(whiteRe); // 跳过空格
        // 根据 type 收集 value
        if (type === '=') { // type 为 =，说明需要转换标签样式，收集即将需要转换的样式
            /**
             * @see {compileTags}
             */
            value = scanner.scanUntil(equalsRe);
            scanner.scan(equalsRe);
            scanner.scanUntil(closingTagRe);
        }
        else if (type === '{') { // type 为 { 说明是 {{{name}}}，使得 name 中的值跳过转义，如 name = '<Tom'，那么直接输出 '<Tom'，而 {{name}} 会输出 '&lt;Tom'
            value = scanner.scanUntil(closingCurlyRe); // 获取 {{{name}}} 中的 name
            scanner.scan(curlyRe); // 跳过 }
            scanner.scanUntil(closingTagRe); // 跳过 }}
            type = '&'; // 无论是 {{&name}} 或 {{{name}}}，其类型都是 &
        }
        else {
            value = scanner.scanUntil(closingTagRe); // 收集 {{name}} 中的 name
        }
        if (!scanner.scan(closingTagRe)) { // 如果没有找到 }}，那么说明标签不匹配，抛出错误
            throw new Error('Unclosed tag at ' + scanner.pos);
        }
        if (type === '>') {
            token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace];
        }
        else {
            token = [type, value, start, scanner.pos];
        }
        tagIndex++; // 当前行遇到的标签数加一
        tokens.push(token);
        if (type === '#' || type === '^') { // 如果遇到 {{#names}} 或 {{^names}}，
            sections.push(token); // 把 token 推入 sections 数组。
        }
        else if (type === '/') { // 如果遇到 {{/names}}，
            openSection = sections.pop(); // 把与之匹配的 {{#names}} 弹出。
            if (!openSection) { // 如果没有 {{#names}}，说明闭口标签没有匹配的开口标签，抛出错误
                throw new Error('Unopened section "' + value + '" at ' + start);
            }
            if (openSection[1] !== value) { // 如果两者变量不匹配，例如：{{#names}}{{/ages}}，说明不符合规则，抛出错误
                throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
            }
        }
        else if (type === 'name' || type === '{' || type === '&') { // 这种情况为普通标签
            nonSpace = true;
        }
        else if (type === '=') { // 如果 type 为 = ，说明标签需要转换，例如 {{=<% %>=}} 使 {{}} 转为 <%%>
            compileTags(value);
        }
    }
    stripSpace();
    openSection = sections.pop();
    if (openSection) { // 扫描完成，所有的 {{#names}} 都应该被出栈，如果有剩余的 {{#names}} 则说明剩余的开闭标签没有成对出现
        throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    }
    // return tokens // 未处理的 tokens
    // return squashTokens(tokens) // 把连续的 tokens 合并
    return nestTokens(squashTokens(tokens)); // 把散列的儿子 tokens 合并到父 token 中
}
/**
 * 把连续序号的散列 token 合并到一个 token 中。
 *
 * 例子：
 *  const tokens = [['text', 'T', 0, 1], ['text', 'o', 1, 2], ['text', 'm', 2, 3]]
 *
 *  squashTokens(tokens) // [['text', 'Tom', 0, 3]]
 *
 * @param {token[]} tokens
 * @returns {token[]}
 */
function squashTokens(tokens) {
    const squashedTokens = []; // 合并完成后的 tokens
    let token;
    let lastToken; // 合并的 token
    for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
        token = tokens[i];
        if (token) { // token 并非一定存在，在清除空格 token 的情况下当前位置将会是 empty
            if (token[0] === 'text' && lastToken && lastToken[0] === 'text') { // 如果当前 token 和合并 token 都是普通文本，那么进行合并操作
                // 一个普通的 token: ['text', word, startIdx, endIdx]
                lastToken[1] += token[1];
                lastToken[3] = token[3];
            }
            else {
                squashedTokens.push(token);
                lastToken = token;
            }
        }
    }
    return squashedTokens;
}
/**
 * 对于类型为 #、^ 的 token 都会有对应的儿子 token，该函数的作用就是把散列的儿子 token 收集起来存储到其父亲 token 中。
 *
 * 例子：
 *  const tokens = [['#', 'a', 0, 6], ['name', 'b', 6, 11], ['/', 'a', 11, 17]]
 *
 *  nestTokens(tokens) // [['#', 'a', 0, 6, ['name', 'b', 6, 11], 11]]
 *
 * @param {token[]} tokens
 * @returns {token[]}
 */
function nestTokens(tokens) {
    const nestedTokens = []; // 结果 tokens
    let collector = nestedTokens; // 当前操作的 token
    const sections = []; // 存储操作的 token 的栈，栈顶元素指向当前操作的 token 的父亲 token 或 nestedTokens
    let token;
    let section;
    for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
        token = tokens[i];
        switch (token[0]) { // type
            /**
             * 如果是开口标签标记，那么他应该有儿子 token，需要对该 token 进行处理
             * [type, key, startIdx, childrenStartIdx, children, endIdx]
             */
            case '#':
            case '^':
                collector.push(token);
                sections.push(token);
                collector = token[4] = []; // 为当前 token 开辟存储儿子 token 的空间，同时 collector 指向儿子 token
                break;
            case '/': // 如果遇到结束标签标记，说明当前 collector 已处理完毕
                section = sections.pop();
                section[5] = token[2];
                collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
                break;
            default:
                collector.push(token);
        }
    }
    return nestedTokens;
}

;// CONCATENATED MODULE: ./src/Writer.ts




/**
 * Writer 整合了各类工具，集成了 mustache 的各类方法，可以针对 token 的类型处理模板，为核心类。
 * Writer 还具有缓存功能，能够将相同条件下生成的 tokens 进行缓存，在下次遇到相同条件时取出缓存值即可。
 */
class Writer {
    constructor() {
        // 创建缓存器，用于缓存转义后的模板 tokens
        this.templateCache = {
            _cache: {},
            set: function set(key, value) {
                this._cache[key] = value;
            },
            get: function get(key) {
                return this._cache[key];
            },
            clear: function clear() {
                this._cache = {};
            }
        };
    }
    /**
     * 清除缓存对象中的缓存值
     */
    clearCache() {
        if (typeof this.templateCache !== 'undefined') {
            this.templateCache.clear();
        }
    }
    /**
     * 查找缓存或调用 parseTemplate 方法将 template 转为 tokens
     * @see parseTemplate
     * @param {string} template
     * @param {tags} tags
     * @returns {token[]}
     */
    parse(template, tags) {
        const cache = this.templateCache; // 获取缓存对象
        const cacheKey = template + ':' + (tags || mustache.tags).join(':'); // 创建缓存标识
        const isCacheEnabled = typeof cache !== 'undefined'; // 获取是否需要缓存标识
        let tokens = isCacheEnabled ? cache.get(cacheKey) : undefined;
        if (tokens == undefined) { // 如果没有缓存或未开启获取，则调用 parseTemplate 得到 tokens
            tokens = parseTemplate(template, tags);
            isCacheEnabled && cache.set(cacheKey, tokens);
        }
        return tokens;
    }
    /**
     * 把 tokens 转换为结果视图
     * @param {string} template 模板
     * @param {any} view 渲染视图
     * @param {renderPartials} partials 子模板对象或方法
     * @param {renderConfig} config 配置项
     * @returns {string}
     */
    render(template, view, partials, config) {
        const tags = this.getConfigTags(config);
        const tokens = this.parse(template, tags);
        const context = (view instanceof Context) ? view : new Context(view, undefined);
        return this.renderTokens(tokens, context, partials, template, config);
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
    renderTokens(tokens, context, partials, originalTemplate, config) {
        let buffer = ''; // 结果，由 token 和 context 根据规则生成的文本内容
        let token;
        let symbol;
        let value;
        for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
            value = undefined; // 重置 value
            token = tokens[i]; // 获取当前 token
            symbol = token[0]; // 获取 token 标识
            switch (symbol) { // 根据标识决定使用何种方式处理 token
                case '#': // {{#name}}
                    value = this.renderSection(token, context, partials, originalTemplate, config);
                    break;
                case '^': // {{^name}}
                    value = this.renderInverted(token, context, partials, originalTemplate, config);
                    break;
                case '>': // {{>name}}
                    value = this.renderPartial(token, context, partials, config);
                    break;
                case '&': // {{&name}} 或 {{{name}}}
                    value = this.unescapedValue(token, context);
                    break;
                case 'name': // {{name}}
                    value = this.escapedValue(token, context, config);
                    break;
                case 'text': // text
                    value = this.rawValue(token);
                    break;
            }
            if (value !== undefined) {
                buffer += value;
            }
        }
        return buffer;
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
    renderSection(token, context, partials, originalTemplate, config) {
        const self = this;
        let buffer = '';
        let value = context.lookup(token[1]); // 获取当前的作用域值
        /**
         * 当 value 为函数时，该方法充当 value 的渲染器
         * @param {string} template
         * @returns {string}
         */
        function subRender(template) {
            return self.render(template, context, partials, config);
        }
        if (!value)
            return; // 当值为 falsy 类型时，将不会渲染任何内容
        if (isArray(value)) { // 当 value 是一个数组时，那么会遍历渲染子模板
            for (let j = 0, valueLength = value.length; j < valueLength; ++j) {
                // 把子 token 和当前项作用域交给 renderTokens 进行渲染
                buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config);
            }
        }
        else if (['object', 'string', 'number'].includes(typeof value)) { // 当 value 是对象、字符串、数字类型时，把 value 当作作用域渲染子 token
            buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
        }
        else if (isFunction(value)) { // 当 value 是方法时，会根据该方法渲染模板
            if (typeof originalTemplate !== 'string') {
                throw new Error('Cannot use higher-order sections without the original template');
            }
            // 调用 value 获取渲染结果，第一个参数为模板中此段渲染部分的字符串，第二个参数是渲染器
            value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
            if (value != null) {
                buffer += value;
            }
        }
        else { // 当 value 为 true，那么渲染子 token
            buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
        }
        return buffer;
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
    renderInverted(token, context, partials, originalTemplate, config) {
        const value = context.lookup(token[1]); // 获取当前的作用域值
        if (!value || (isArray(value) && value.length === 0)) { // 如果 value 是 falsy 或空数组时才会渲染子 token
            return this.renderTokens(token[4], context, partials, originalTemplate, config);
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
    indentPartial(partial, indentation, lineHasNonSpace) {
        const filteredIndentation = indentation.replace(/[^ \t]/g, ''); // 把换行符去掉，只保留缩进和空格
        const partialByNl = partial.split('\n'); // 子模板以行分组处理
        for (let i = 0; i < partialByNl.length; i++) {
            // 如果当前行有非空格，那么第一行不用处理，否则统一在每行都加上 indentation
            if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
                partialByNl[i] = filteredIndentation + partialByNl[i];
            }
        }
        return partialByNl.join('\n');
    }
    /**
     * 针对 {{>name}} 的处理
     * @param {token} token
     * @param {Context} context
     * @param {renderPartials} partials
     * @param {renderConfig | undefined} config
     * @returns {string | undefined}
     */
    renderPartial(token, context, partials, config) {
        if (!partials)
            return; // 如果子模板对象或方法为空，则不渲染任何内容
        const tags = this.getConfigTags(config); // 获取标签类型
        // 获取子模板，当 partials 为方法时，则调用方法，否则从对象中获取
        const value = isFunction(partials) ?
            partials(token[1]) :
            partials[token[1]];
        if (value != null) {
            const lineHasNonSpace = token[6]; // 原模板当前行是否有非空格
            const tagIndex = token[5]; // 原模板当前行的标签数
            const indentation = token[4]; // 当前 token 在原模板当前行中收集到的缩进
            let indentedValue = value; // 处理缩进后得到的子模板
            if (tagIndex === 0 && indentation) { // 只有在原模板当前行没有标签，才会去处理缩进
                indentedValue = this.indentPartial(value, indentation, lineHasNonSpace);
            }
            const tokens = this.parse(indentedValue, tags);
            return this.renderTokens(tokens, context, partials, indentedValue, config);
        }
    }
    /**
     * 针对 {{&name}} 或 {{{name}}} 的处理
     * @param {token} token
     * @param {Context} context
     * @returns {any | undefined}
     */
    unescapedValue(token, context) {
        const value = context.lookup(token[1]); // 获取当前的作用域值
        if (value != null) {
            return value;
        }
    }
    /**
     * 针对 {{name}} 的处理
     * @param {token} token
     * @param {Context} context
     * @param {renderConfig | undefined} config
     * @returns {any | string | undefined}
     */
    escapedValue(token, context, config) {
        const escape = this.getConfigEscape(config) || mustache.escape; // 获取文本转义方法
        const value = context.lookup(token[1]); // 获取当前的作用域值
        if (value != null) {
            // 如果 value 是数字类型并且转义方法是默认的转义方法，则把 value 转为字符串返回，否则调用自定义的转义方法返回
            return (typeof value === 'number' && escape === mustache.escape) ? String(value) : escape(value);
        }
    }
    /**
     * 针对 text 的处理
     * @param {token} token
     * @returns {string}
     */
    rawValue(token) {
        return token[1];
    }
    /**
     * 获取自定义标签
     * @param {renderConfig | tags | undefined} config
     * @returns {tags | undefined}
     */
    getConfigTags(config) {
        if (isArray(config)) { // 当 config 是数组时，将当作标签直接返回
            return config;
        }
        else if (config && typeof config === 'object') { // 当 config 时对象时，返回 config.tags
            return config.tags;
        }
        else {
            return undefined;
        }
    }
    /**
     * 获取自定义转义器
     * @param {renderConfig | undefined} config
     * @returns {renderConfig.escape | undefined}
     */
    getConfigEscape(config) {
        // 只有 config 是一个对象时，才会去获取 config.escape
        if (config && typeof config === 'object' && !isArray(config)) {
            return config.escape;
        }
        else {
            return undefined;
        }
    }
}

;// CONCATENATED MODULE: ./src/mustache.ts
/**
 * mustache 对象
 */




/**
 * 与 typeof 作用一致，但是修复了 array 为 object 的错误
 * @param {any} obj
 * @returns {'array' | typeof obj}
 */
function typeStr(obj) {
    return isArray(obj) ? 'array' : typeof obj;
}
const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};
/**
 * 转义 html 文本中的符号，该方法会根据上面的 entityMap 替换
 * @param {string} string
 * @returns {string}
 */
function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
        return entityMap[s];
    });
}
const defaultWriter = new Writer();
const mustache = {
    name: 'mustache.js',
    version: '?.?.?',
    tags: ['{{', '}}'],
    clearCache() {
        return defaultWriter.clearCache();
    },
    escape: escapeHtml,
    parse(template, tags) {
        return defaultWriter.parse(template, tags);
    },
    render(template, view, partials, config) {
        if (typeof template !== 'string') {
            throw new TypeError('Invalid template! Template should be a "string" ' +
                'but "' + typeStr(template) + '" was given as the first ' +
                'argument for mustache#render(template, view, partials)');
        }
        return defaultWriter.render(template, view, partials, config);
    },
    Scanner: Scanner,
    Context: Context,
    Writer: Writer,
    set templateCache(cache) {
        defaultWriter.templateCache = cache;
    },
    get templateCache() {
        return defaultWriter.templateCache;
    },
};

;// CONCATENATED MODULE: ./src/index.ts
/**
 * @file mustache 源码重写 ES6 + module + 注释版
 * @see http://github.com/18023785187/my_mustache
 */


/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=mustache.js.map