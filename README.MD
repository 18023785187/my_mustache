# my_mustache

#### mustache 模版引擎源码学习

对 mustache 源码进行重写并注有大量注释，原库中使用的语法为 ES5 之前的语法，在重写后将会使用 ES6 语法，新增模块化的重写库，使读者更好关注某一模块，进一步降低阅读门槛。

---

### mustache 标签类型

* <strong>{{name}}</strong>

把变量 name 的值复制到标签内，所有 {{key}} 的值都会被 mustache 转义。

```javascript
mustache.render('<div>{{name}}</div>', {
  name: '>Tom<'
})

// output: <div>&gt;Tom&lt;</div>
```

* <strong>{{{name}}} 或 {{&name}}</strong>

把变量 name 的值复制到标签内，所有 {{{key}}} 或 {{&key}} 的值都不会被 mustache 转义。

```javascript
mustache.render('<div>{{{name}}}</div>', {
  name: '>Tom<'
})

// output: <div>>Tom<</div>
```

* <strong>
    {{#isShow}}
      Never shown!
    {{/isShow}}
  </strong>

如果 isShow 的键存在且值为 false 或空列表，则不会显示标签内包裹的内容。

```javascript
mustache.render('Shown{{#isShow}}Never shown!{{/isShow}}', {
  isShow: false
})

// output: Shown
```

* <strong>
    {{#repo}}
      <b>{{name}}</b>
    {{/repo}}
  </strong>

如果 repo 的键存在且非 flasy 值且为空列表时，则根据 repo 循环渲染指定内容。

```javascript
mustache.render(
  `
    {{#repo}}
      <b>{{name}}</b>
    {{/repo}}
  `, 
  {
    repo: [
      { "name": "resque" },
      { "name": "hub" },
      { "name": "rip" }
    ]
  }
)

// output:
//         <b>resque</b>
//         <b>hub</b>
//         <b>rip</b>
```

* <strong>
    {{#wrapped}}
      {{name}} is awesome.
    {{/wrapped}}
  </strong>

当 wrapped 是函数时，该函数会调用并传递文本块，该文本块不会被转义。

```javascript
mustache.render(
  `
    {{#wrapped}}
      {{name}} is awesome.
    {{/wrapped}}
  `, 
  {
    "name": "Willy",
    "wrapped": function() {
      return function(text, render) {
        return "<b>" + render(text) + "{{text}}</b>"
      }
    }
  }
)

// output:
//         <b>
//          Willy is awesome.
//         {{text}}</b>  
```

* <strong>
    {{#person?}}
      Hi {{name}}!
    {{/person?}}
  </strong>

当值为非 false 但不是列表时，它将用作块的单个渲染的上下文。

```javascript
mustache.render(
  `
    {{#person?}}
      Hi {{name}}!
    {{/person?}}
  `, 
  {
    "person?": { "name": "Jon" }
  }
)

// output: Hi Jon!
```

* <strong>
    {{#repo}}
      <b>{{name}}</b>
    {{/repo}}
    {{^repo}}
      No repos :(
    {{/repo}}
  </strong>

当 repo 键不存在或为 falsy 值或为空列表时，渲染 No repos :( 。

```javascript
mustache.render(
  `
    {{#repo}}
      <b>{{name}}</b>
    {{/repo}}
    {{^repo}}
      No repos :(
    {{/repo}}
  `, 
  {
    "repo": []
  }
)

// output: No repos :(
```

* <strong> Today{{! ignore me }}. </strong>

以 ! 开头的标签会被视为注释，mustache 将忽悠渲染。

```javascript
mustache.render(
  `<h1>Today{{! ignore_me }}.</h1>`, 
  {
    "ignore_me": "ignore me"
  }
)

// output: <h1>Today.</h1>
```

* <strong>
    <span>Names</span>
    {{#names}}
      {{> user}}
    {{/names}}
  </strong>

&gt; 用于模版的继承。

```javascript
const baseTemp = 
`<span>Names</span>
{{#names}}
  {{> user}}
{{/names}}`
const userTemp = '<strong>{{name}}</strong>'

mustache.render(
  baseTemp, 
  {
    names: [
      { name: 'Tom' }
    ]
  },
  {
    user: userTemp
  }
)

// output: <span>Names</span>
//         <strong>Tom</strong>
```

* <strong>
    {{name}}
    {{=<% %>=}}
    <%age%>
  </strong>

= 用于重定义标签的样式，比如初始标签为 {{}}，现在需要把 {{}} 转为 <%%>，那么可以这样写：{{=<% %>=}}。

自定义分隔符不能包含空格或等号。

```javascript
mustache.render(
  `{{name}}{{=<% %>=}}<%age%>`, 
  {
    name: 'Tom',
    age: 18,
  }
)

// output: Tom18
```

---
