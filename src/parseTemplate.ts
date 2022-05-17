import { mustache, tags, token } from './mustache'
import { isArray } from './utils'
import Scanner from './Scanner'

/**
 * 在所有 - [ ] { } ( ) * + ? . , \ ^ $ # 所有空格 前添加 \
 * 如 '-[]' -> '\-\[\]'
 * @param {string} string 
 * @returns {string}
 */
function escapeRegExp(string: string): string {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
}

const regExpTest = RegExp.prototype.test
function testRegExp(re: RegExp, string: string): boolean {
  return regExpTest.call(re, string)
}

const nonSpaceRe = /\S/ // 匹配非空字符
function isWhitespace(string: string): boolean { // 检查一个值是否为空白字符串
  return !testRegExp(nonSpaceRe, string)
}

const whiteRe = /\s*/ // 匹配空白
const spaceRe = /\s+/ // 匹配至少一个空格
const equalsRe = /\s*=/ // 匹配 =
const curlyRe = /\s*\}/ // 匹配 }
const tagRe = /#|\^|\/|>|\{|&|=|!/ // 匹配 #、^、/、>、{、&、=、!

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
export default function parseTemplate(template: string, tags?: tags): token[] {
  if (!template) {
    return []
  }
  let lineHasNonSpace = false // 当前行是否有非空格
  const sections = [] // 存储 {{#names}}、{{^names}} 标记，用于判断这些标记是否有匹配 {{/names}}
  const tokens: token[] = [] // token 数组
  let spaces: number[] = [] // 存储在当前行中每个空格的 token 索引，当遇到 {{#names}} 时且当前项全是空格时，会把 tokens 中对应 spaces 索引的 token 全部删除
  let hasTag = false // 当前行是否有标签 {{}}
  let nonSpace = false // 是否有非空格
  let indentation = '' // 当前行收集到的缩进，又称空白字符串
  let tagIndex = 0 // 每一行文本所遇到的 {{}} 数量

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
  function stripSpace(): void {
    if (hasTag && !nonSpace) { // 如果检测到有标签且全是空格，这里的标签只能是 {{#names}}
      while (spaces.length) // 删除 tokens 中所有空格 token
        delete tokens[spaces.pop() as number]
    } else {
      spaces = [] // 重置
    }

    hasTag = false // 重置
    nonSpace = false // 重置
  }

  let openingTagRe: RegExp // 开口标签正则
  let closingTagRe: RegExp // 闭口标签正则
  let closingCurlyRe: RegExp // } + closingTagRe 正则，比如闭口标签为 }}，那么该正则为 }}}
  /**
   * 处理 tags，根据 tags 生成对应的正则表达式，tags 必须为数组或字符串，例如 ['{{', '}}'] 或 '{{ }}'
   * 
   * 为什么会有字符串？因为在遇到 {{=<% %>=}} 的时候会把 '<% %>' 作为参数传入，这时就需要将其解析为标签
   * 
   * @param {string | tags} tagsToCompile 
   */
  function compileTags(tagsToCompile: string | tags): void {
    if (typeof tagsToCompile === 'string') {
      tagsToCompile = tagsToCompile.split(spaceRe, 2) as tags // 生成至少一个空格作为分隔符，长度为 2 的数组，例如： '{{  }}' -> ['{{', '}}']
    }

    if (!isArray(tagsToCompile) && (tagsToCompile as string[]).length !== 2) { // 如果 tagsToCompile 不是数组或数组长度不等于 2，说明不符合条件，抛出错误
      throw new Error('Invalid tags: ' + tagsToCompile)
    }

    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*') // /\{\{\s*/
    closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1])) // /\s*\}\}/
    closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1])) // /\s*\}\}\}/
  }

  compileTags(tags || mustache.tags) // 初始化编译一个 tags 确定标签的样式

  const scanner = new Scanner(template) // 创建扫描器，下面循环将围绕扫描器收集 token

  let start: number // 每次扫描一对 {{}} 即每次循环时，扫描器 scanner 的当前指针
  let type: string // 每个标签的类型，后面会根据类型去处理 token
  let value: string // {{ 或 }} 前的文本，比如：'hello, {{name}}' 对应的文本是 hello, 和 name
  let chr: string // 文本中每一个字符
  let token: token // 存储的信息标识
  let openSection: token | undefined // 每次遇到 {{/names}} 时从 sections 弹出的开口标签
  while (!scanner.eos()) { // 循环使扫描器扫描完成，每次循环都会扫描出一对 {{}}
    start = scanner.pos

    value = scanner.scanUntil(openingTagRe!) // 获取 {{ 前或全部文本

    if (value) { // 循环将文本转换成单字符 token，方便后续处理
      for (let i = 0, valueLength = value.length; i < valueLength; ++i) {
        chr = value.charAt(i) // 获取当前字符

        if (isWhitespace(chr)) { // 如果该字符为空白字符，记录该空白 token 的位置，同时增加缩进的长度
          spaces.push(tokens.length)
          indentation += chr
        } else {
          /**
           * @see {Writer.indentPartial} 如果有非空白字符，记录当前行有非空格字符，缩进长度也需增加
           */
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

    if (!scanner.scan(openingTagRe!)) { // 如果找不到 {{ ，返回
      break
    }

    hasTag = true // 否则该行一定有 {{ 标签

    type = scanner.scan(tagRe) || 'name' // 获取标签的类型，要么是特殊标签，要么是普通标签 {{name}}
    scanner.scan(whiteRe) // 跳过空格

    // 根据 type 收集 value
    if (type === '=') { // type 为 =，说明需要转换标签样式，收集即将需要转换的样式
      /**
       * @see {compileTags}
       */
      value = scanner.scanUntil(equalsRe)
      scanner.scan(equalsRe)
      scanner.scanUntil(closingTagRe!)
    } else if (type === '{') { // type 为 { 说明是 {{{name}}}，使得 name 中的值跳过转义，如 name = '<Tom'，那么直接输出 '<Tom'，而 {{name}} 会输出 '&lt;Tom'
      value = scanner.scanUntil(closingCurlyRe!) // 获取 {{{name}}} 中的 name
      scanner.scan(curlyRe) // 跳过 }
      scanner.scanUntil(closingTagRe!) // 跳过 }}
      type = '&' // 无论是 {{&name}} 或 {{{name}}}，其类型都是 &
    } else {
      value = scanner.scanUntil(closingTagRe!) // 收集 {{name}} 中的 name
    }

    if (!scanner.scan(closingTagRe!)) { // 如果没有找到 }}，那么说明标签不匹配，抛出错误
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
    } else if (type === 'name' || type === '{' || type === '&') { // 这种情况为普通标签
      nonSpace = true
    } else if (type === '=') { // 如果 type 为 = ，说明标签需要转换，例如 {{=<% %>=}} 使 {{}} 转为 <%%>
      compileTags(value)
    }
  }

  stripSpace()

  openSection = sections.pop()

  if (openSection) { // 扫描完成，所有的 {{#names}} 都应该被出栈，如果有剩余的 {{#names}} 则说明剩余的开闭标签没有成对出现
    throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos)
  }

  // return tokens // 未处理的 tokens
  // return squashTokens(tokens) // 把连续的 tokens 合并
  return nestTokens(squashTokens(tokens)) // 把散列的儿子 tokens 合并到父 token 中
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
function squashTokens(tokens: token[]): token[] {
  const squashedTokens: token[] = [] // 合并完成后的 tokens

  let token: token | undefined
  let lastToken: token | undefined // 合并的 token
  for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i]

    if (token) { // token 并非一定存在，在清除空格 token 的情况下当前位置将会是 empty
      if (token[0] === 'text' && lastToken && lastToken[0] === 'text') { // 如果当前 token 和合并 token 都是普通文本，那么进行合并操作
        // 一个普通的 token: ['text', word, startIdx, endIdx]
        lastToken[1] += token[1]
        lastToken[3] = token[3]
      } else {
        squashedTokens.push(token)
        lastToken = token
      }
    }
  }

  return squashedTokens
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
function nestTokens(tokens: token[]): token[] {
  const nestedTokens: token[] = [] // 结果 tokens
  let collector = nestedTokens // 当前操作的 token
  const sections: token[] = [] // 存储操作的 token 的栈，栈顶元素指向当前操作的 token 的父亲 token 或 nestedTokens

  let token: token
  let section: token
  for (let i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i]

    switch (token[0]) { // type
      /**
       * 如果是开口标签标记，那么他应该有儿子 token，需要对该 token 进行处理
       * [type, key, startIdx, childrenStartIdx, children, endIdx]
       */
      case '#':
      case '^':
        collector.push(token)
        sections.push(token)
        collector = token[4] = [] // 为当前 token 开辟存储儿子 token 的空间，同时 collector 指向儿子 token
        break
      case '/': // 如果遇到结束标签标记，说明当前 collector 已处理完毕
        section = sections.pop()!
        section[5] = token[2]
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens
        break
      default:
        collector.push(token)
    }
  }

  return nestedTokens
}
