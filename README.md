# Immersive Translate

一个基于 Vite、React 和 TypeScript 的 Firefox 划词翻译扩展。选中文本后，页面会显示翻译气泡，并通过后台脚本调用已配置的翻译服务。

## 功能

- 页面划词后显示翻译入口与结果气泡
- 支持 Google Translate、有道翻译与 OpenAI 兼容大模型翻译
- 支持配置源语言、目标语言和翻译源回退顺序
- OpenAI 兼容大模型支持自定义提供商 Base URL、模型和系统提示词
- API Key 保存在浏览器扩展 storage 中
- 提供独立的扩展设置页

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- vite-plugin-web-extension
- webextension-polyfill

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 类型检查

```bash
npm run typecheck
```

### 构建

```bash
npm run build
```

构建产物会输出到 `dist/` 目录。

### 代码格式化

```bash
npm run format
```

检查格式：

```bash
npm run format:check
```

## 在 Firefox 中加载扩展

1. 执行 `npm run build`。
2. 打开 Firefox，访问 `about:debugging#/runtime/this-firefox`。
3. 点击“临时载入附加组件”。
4. 选择 `dist/manifest.json`。
5. 打开扩展选项页，配置至少一个翻译服务密钥。

## 配置翻译服务

扩展当前支持以下翻译源：

- Google Translate：需要 Google Cloud Translation API Key
- 有道翻译：需要有道智云 `appKey` 和 `appSecret`
- OpenAI 兼容大模型：需要 API Key，可自定义兼容 OpenAI Chat Completions 的 Base URL、模型和系统提示词

在设置页中可调整启用的翻译源及其回退顺序。翻译时会按回退链顺序依次尝试可用服务。

## 项目结构

```text
src/
  background/          后台脚本与翻译服务实现
  content/             内容脚本与页面翻译气泡
  options/             扩展设置页
  shared/              共享类型、消息与存储逻辑
  manifest.json        WebExtension manifest
```
