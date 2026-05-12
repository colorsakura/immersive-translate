# Firefox 划词翻译扩展 — 设计文档

**日期**: 2026-05-12
**状态**: 待评审

## 概述

一款 Firefox 浏览器翻译扩展，核心功能为划词翻译。用户选中网页文本后，浮动气泡显示翻译结果。支持 Google 翻译和有道翻译 API，翻译源以回退链模式工作，后续可扩展大模型翻译接口。

## 技术栈

- TypeScript
- React 18
- Vite（构建，使用 vite-plugin-web-extension）
- Firefox Extension（MV2/MV3 兼容）

## 功能范围

### 包含

- 选中文本后浮动气泡显示翻译结果
- 气泡仅展示翻译文本（无额外 UI）
- Google 翻译和有道翻译 API
- 翻译源回退链：优先源失败自动尝试下一个
- 可配置源语言和目标语言
- 用户自行申请 API Key，在设置页配置

### 不包含（v1）

- 整页翻译
- 音标/发音/朗读
- 翻译历史记录
- 离线翻译
- 大模型翻译接口（架构预留，后续添加）

## 架构

采用方案：**Content Script + Shadow DOM 气泡 + Background Worker**

```
Extension
├── Background Worker     — 翻译 API 调用，保护 API Key
├── Content Script        — 文本选择检测，Shadow DOM 气泡渲染
├── Options Page          — 设置页（React SPA）
└── Shared                — 类型、消息协议、storage 封装
```

### 消息通信

- Content Script 通过 `browser.runtime.sendMessage` 发送翻译请求到 Background
- Background 调用翻译 API 后返回结果
- API Key 始终在 Background 侧，不暴露到页面环境

## 项目结构

```
immersive-translate/
├── src/
│   ├── background/
│   │   ├── index.ts
│   │   └── translator/
│   │       ├── types.ts          # 翻译源统一接口
│   │       ├── google.ts         # Google Translate API
│   │       ├── youdao.ts         # 有道翻译 API
│   │       └── chain.ts          # 回退链逻辑
│   ├── content/
│   │   ├── index.ts              # mouseup 监听入口
│   │   └── bubble/
│   │       ├── index.tsx         # ReactDOM.createRoot 入口
│   │       ├── App.tsx           # 状态机: idle/loading/result/error
│   │       ├── Bubble.tsx        # 气泡 UI（定位、渲染）
│   │       └── shadow.ts         # Shadow DOM 创建/挂载/清理
│   ├── options/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx               # API Key、语言、回退链配置
│   ├── shared/
│   │   ├── types.ts
│   │   ├── messages.ts           # 消息类型定义
│   │   └── storage.ts            # browser.storage 读写封装
│   └── manifest.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 组件与状态

### 气泡状态机（App.tsx）

| 状态   | UI                           | 触发条件                     |
|--------|------------------------------|------------------------------|
| idle   | 不可见                       | 未选中文字                   |
| loading| 骨架屏/loading 动画          | 已发送翻译请求，等待响应     |
| result | 翻译文本                     | Background 返回成功结果      |
| error  | 错误提示（2 秒后自动消失）   | API 调用全部失败             |

### 气泡定位（Bubble.tsx）

- 基于选中文字 `getBoundingClientRect()` 计算位置
- 优先在选中文字下方显示，空间不足时翻转到上方
- x/y 坐标约束在 viewport 内
- Shadow DOM 根节点挂载到 `document.body`

## 数据流

```
1. 用户选中文字 → Content Script mouseup 事件
2. 获取 window.getSelection() → 文本 + rect
3. shadow.ts 创建 ShadowRoot，挂载 React App
4. App → loading 状态，Bubble 定位
5. Content → sendMessage({ type: "translate", text, sourceLang, targetLang })
6. Background → chain.ts 按优先级依次调用翻译源
7. 成功 → 返回 { text, source } | 全部失败 → 返回 { error }
8. Content 收到响应 → 更新 App 状态
9. 用户点击页面空白处 → blur 事件 → 清除 Shadow DOM
```

## 翻译源接口

```typescript
interface TranslationSource {
  name: string;
  translate(
    text: string,
    source: string,
    target: string,
    config: SourceConfig
  ): Promise<TranslationResult>;
}

interface TranslationResult {
  text: string;
  source: string; // 使用的翻译源名称
}
```

### Google Translate API

- 端点：`https://translation.googleapis.com/language/translate/v2`
- 认证：API Key（query param 或 header）
- 配置项：apiKey

### 有道翻译 API

- 端点：`https://openapi.youdao.com/api`
- 认证：appKey + appSecret 签名
- 配置项：appKey, appSecret

### 回退链（chain.ts）

按用户配置的顺序依次调用翻译源，成功即返回，失败尝试下一个，全部失败返回错误。

## 设置页

- **API Key 配置**：Google API Key、有道 appKey + appSecret
- **源语言**：auto / zh / en / ja / ko / ...
- **目标语言**：zh / en / ja / ko / ...
- **回退链顺序**：拖拽调整翻译源优先级
- 保存到 `browser.storage.sync`

## 错误处理

| 场景                        | 处理方式                           |
|-----------------------------|------------------------------------|
| API Key 无效/403            | 不重试，直接回退到下一个源         |
| 频率限制 429                | 等待 1s 重试一次，仍失败则回退     |
| 网络错误                    | 回退到下一个源                     |
| 全部翻译源失败              | 显示 "翻译失败，请检查 API Key"    |
| 选中文本为空/纯空格         | 不触发                             |
| 选中文本超过 5000 字符      | 截断到 5000 字符后翻译             |
| 超时（8 秒）                | 视为失败，回退                     |
| 气泡超出视口                | 约束位置到 viewport 内             |
| SPA 页面路由切换            | 清理旧气泡                         |

## 安全

- API Key 使用 `browser.storage.sync`（Firefox 加密存储）
- API Key 仅在 Background Worker 中使用，Content Script 不可访问
- 翻译文本仅在内存中处理，不持久化

## 性能

- mouseup 事件 150ms 防抖
- Shadow DOM 已挂载时复用，仅更新内容
- API 请求 8s 超时

## 扩展性预留

翻译源使用统一 `TranslationSource` 接口，后续添加大模型翻译（OpenAI、Claude 等）只需：
1. 实现 `TranslationSource` 接口
2. 在 chain 中注册
3. 在设置页添加对应 API Key 配置项
