

const objectToString = Object.prototype.toString
const isArray = Array.isArray || function isArrayPolyfill(object) {
  return objectToString.call(object) === '[object Array]'
}

function isFunction(object) {
  return typeof object === 'function'
}

/**
 * 与 typeof 作用一致，但是修复了 array 为 object 的错误
 * @param {any} obj 
 * @returns {'array' | typeof obj}
 */
function typeStr(obj) {
  return isArray(obj) ? 'array' : typeof obj
}

/**
 * 在所有 - [ ] { } ( ) * + ? . , \ ^ $ # 所有空格 前添加 \
 * 如 '-[]' -> '\-\[\]'
 * @param {string} string 
 * @returns {string}
 */
function escapeRegExp(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
}

/**
 * 检查 obj 是否为对象且 propName 为 obj 的属性（继承或原型链上的属性也符合）
 * @param {any} obj 
 * @param {symbol | string | number} propName 
 * @returns {boolean}
 */
function hasProperty(obj, propName) {
  return obj != null && typeof obj === 'object' && (propName in obj)
}

function primitiveHasOwnProperty(primitive, propName) {
  return (
    primitive != null
    && typeof primitive !== 'object'
    && primitive.hasProperty
    && primitive.hasProperty(propName)
  )
}

const regExpTest = RegExp.prototype.test
function testRegExp(re, string) {
  return regExpTest.call(re, string)
}

const nonSpaceRe = /\S/ // 匹配非空字符
function isWhitespace(string) {
  return !testRegExp(nonSpaceRe, string)
}

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
function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
    return entityMap[s]
  })
}

const whiteRe = /\s*/ // 匹配空白
const spaceRe = /\s+/ // 匹配至少一个空格
const equalsRe = /\s*=/ // 匹配 =
const curlyRe = /\s*\}/ // 匹配 }
const tagRe = /#|\^|\/|>|\{|&|=|!/ // 匹配 #、^、/、>、{、&、=、!

function parseTemplate(template, tags) {
  if (!template) {
    return []
  }
  let lineHasNonSpace = false // 当前行是否有非空格
  const sections = [] // 用于存储 {{#names}}、{{^names}} 标记
  const tokens = [] // token 数组
  let spaces = [] // 存储在当前行中每个空格的索引
  let hasTag = false // 当前行是否有标签 {{}}
  let nonSpace = false // 是否有非空格
  let indentation = ''
  let tagIndex = 0 // 每一行文本所遇到的 {{}} 数量

  function stripSpace() {
    if (hasTag && !nonSpace) { // 如果检测到有标签且全是空格
      while (spaces.length)
        delete tokens[spaces.pop()]
    } else {
      spaces = []
    }

    hasTag = false // 重置
    nonSpace = false // 重置
  }

  let openingTagRe
  let closingTagRe
  let closingCurlyRe
  /**
   * 处理 tags，根据 tags 生成对应的正则表达式，tags 必须为字符串或数组，例如 ['{{', '}}']
   * @param {string | [string, string]} tagsToCompile 
   */
  function compileTags(tagsToCompile) {
    if (typeof tagsToCompile === 'string') {
      tagsToCompile = tagsToCompile.split(spaceRe, 2) // 生成至少一个空格作为分隔符，长度为 2 的数组，例如： '{{  }}' -> ['{{', '}}']
    }

    if (!isArray(tagsToCompile) && tagsToCompile.length !== 2) { // 如果 tagsToCompile 不是数组或数组长度不等于 2，说明不符合条件
      throw new Error('Invalid tags: ' + tagsToCompile)
    }

    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*') // /\{\{\s*/
    closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1])) // /\s*\}\}/
    closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1])) // /\s*\}\}\}/
  }

  compileTags(tags || mustache.tags)

  const scanner = new Scanner(template)

  let start // 每次扫描一对 {{}} 时扫描器 scanner 的起始指针
  let type // 每个标签的类型，后面会根据类型去处理 token
  let value // {{ 或 }} 前的文本，比如：'hello, {{name}}' 对应的文本是 hello, 和 name
  let chr // 文本中每一个字符
  let token // 存储的信息标识
  let openSection // 每次遇到 {{/names}} 时从 sections 弹出开口标签
  while (!scanner.eos()) { // 循环使扫描器扫描完成，这里的 tag 以默认值 ['{{', '}}'] 为例，每次循环都会扫描出一对 {{}}
    start = scanner.pos

    value = scanner.scanUntil(openingTagRe) // 获取 {{ 前或全部文本

    if (value) {
      for (let i = 0, valueLength = value.length; i < valueLength; ++i) {
        chr = value.charAt(i) // 获取当前字符

        if (isWhitespace(chr)) { // 如果该字符为空白字符
          spaces.push(tokens.length)
          indentation += chr
        } else { // 如果有非空白字符
          nonSpace = true
          lineHasNonSpace = true
          indentation += ' '
        }

        tokens.push(['text', chr, start, start + 1])
        start += 1

        if (chr === '\n') { // 如果 chr 是一个换行符，说明当前行已经遍历结束，重置新的行
          stripSpace()
          indentation = ''
          tagIndex = 0
          lineHasNonSpace = false
        }
      }
    }

    if (!scanner.scan(openingTagRe)) { // 如果找不到 {{ ，返回
      break
    }

    hasTag = true // 否则该行一定有 {{ 标签

    type = scanner.scan(tagRe) || 'name' // 获取标签的类型，要么是特殊标签，要么是普通标签 {{name}}
    scanner.scan(whiteRe) // 跳过空格

    // 根据 type 进行处理
    if (type === '=') {
      value = scanner.scanUntil(equalsRe)
      scanner.scan(equalsRe)
      scanner.scanUntil(closingTagRe)
    } else if (type === '{') { // type 为 { 说明是 {{{name}}}，使得 name 中的值跳过转义，如 name = '<Tom'，那么直接输出 '<Tom'，而 {{name}} 会输出 '&lt;Tom'
      value = scanner.scanUntil(closingCurlyRe) // 获取 {{{name}}} 中的 name
      scanner.scan(curlyRe) // 跳过 }
      scanner.scanUntil(closingTagRe) // 跳过 }}
      type = '&'
    } else {
      value = scanner.scanUntil(closingTagRe) // 收集 {{name}} 中的 name
    }

    if (!scanner.scan(closingTagRe)) { // 如果没有找到 }}，那么说明标签不匹配，抛出错误
      throw new Error('Unclosed tag at ' + scanner.pos)
    }

    if (type === '>') {
      token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace]
    } else {
      token = [type, value, start, scanner.pos]
    }
    tagIndex++ // 当前行遇到的标签数加一

    tokens.push(token)

    if (type === '#' || type === '^') { // 如果遇到 {{#names}} 或 {{^names}}，
      sections.push(token) // 把 token 推入 sections 数组。
    } else if (type === '/') { // 如果遇到 {{/names}}，
      openSection = sections.pop() // 把与之匹配的 {{#names}} 弹出。

      if (!openSection) { // 如果没有 {{#names}}，说明闭口标签没有匹配的开口标签，抛出错误
        throw new Error('Unopened section "' + value + '" at ' + start)
      }

      if (openSection[1] !== value) { // 如果两者变量不匹配，例如：{{#names}}{{/ages}}，说明不符合规则，抛出错误
        throw new Error('Unclosed section "' + openSection[1] + '" at ' + start)
      }
    } else if (type === 'name' || type === '{' || type === '&') {
      nonSpace = true
    } else if (type === '=') {
      compileTags(value)
    }

    stripSpace()

    openSection = sections.pop()

    if (openSection) { // 每次扫描器循环都要确保 sections 栈为空，因为每次循环都只会收集一对标签，收集 {{#names}} 后必然需要 {{/names}} 使 {{#names}} 出栈
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos)
    }
  }
}

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
  /**
   * 
   * @param {string} string 
   */
  constructor(string) {
    this.string = string // 入参字符串模板
    this.tail = string // 每次扫描剩下的字符串，扫描器会从前往后扫描
    this.pos = 0 // 对于入参字符串模板的当前扫描到的位置
  }
  /**
   * 判断字符串是否已扫描完成
   * @returns {boolean}
   */
  eos() {
    return this.tail === ''
  }
  /**
   * 扫描 tag，如果 tag 在 tail 开头位置那么把 tag 匹配的字符截取并返回，否则返回空字符。
   * 
   * @param {RegExp | string} re tag 的正则表达式或字符串
   * @returns {string}
   */
  scan(re) {
    const match = this.tail.match(re)

    if (!match || match.index !== 0) { // 如果没有匹配到或匹配到的 tag 字符串不在 tail 开头，那么返回空字符
      return ''
    }

    const string = match[0]

    this.tail = this.tail.substring(string.length)
    this.pos += string.length

    return string
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
    const index = this.tail.search(re)
    let match

    switch (index) {
      case -1: // 第一种情况
        match = this.tail
        this.tail = ''
        break
      case 0: // 第二种情况
        match = ''
        break
      default: // 第三种情况
        match = this.tail.substring(0, index)
        this.tail = this.tail.substring(index)
    }

    this.pos += match.length // 同时扫描指针要后移

    return match
  }
}
