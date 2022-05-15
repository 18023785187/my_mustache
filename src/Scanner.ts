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
export default class Scanner {
  private string: string // 入参字符串模板
  private tail: string // 每次扫描剩下的字符串，扫描器会从前往后扫描
  public pos: number // 对于入参字符串模板的当前扫描到的位置
  constructor(string: string) {
    this.string = string
    this.tail = string
    this.pos = 0
  }
  /**
   * 判断字符串是否已扫描完成
   * @returns {boolean}
   */
  public eos(): boolean {
    return this.tail === ''
  }
  /**
   * 扫描 tag，如果 tag 在 tail 开头位置那么把 tag 匹配的字符截取并返回，否则返回空字符。
   * 
   * @param {RegExp | string} re tag 的正则表达式或字符串
   * @returns {string}
   */
  public scan(re: RegExp | string): string {
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
  public scanUntil(re: RegExp | string): string {
    const index = this.tail.search(re)
    let match: string

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
