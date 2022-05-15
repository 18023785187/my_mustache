import { tags, token } from './mustache';
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
export default function parseTemplate(template: string, tags?: tags): token[];
