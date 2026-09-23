# PaperMate 论文伴读

真实 PDF.js 阅读器 + Mermaid 流程图 + 本地模型代理。原有固定 HTML 阅读模板已替换。

## 启动

需要 Node.js 22。日常使用只需双击“启动 PaperMate.cmd”，脚本会检查依赖、启动后台服务并打开浏览器。服务地址是 http://127.0.0.1:4180 。首次使用若尚未配置 DeepSeek，脚本会提示输入 API Key。

## AI 配置

推荐双击“配置 DeepSeek.cmd”，在本机提示框输入 DeepSeek API Key。脚本会在项目根目录生成 `.env.local`，配置官方地址 `https://api.deepseek.com` 和默认模型 `deepseek-flash`。也可以参考 `.env.example` 手动填写 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`。保存后重新启动。不要把密钥发到聊天或提交到仓库。

未配置模型时，真实 PDF 可阅读、翻页、缩放、选中文本；分析会明确提示尚未配置，不会返回示例论文结论。首页“体验示例论文”提供独立 Mock 模式，数据均为虚构。真实模式调用会把选中文字、当前页和相关章节发送至 DeepSeek。PDF 文件本身不上传、不持久保存。

## 功能

- 上传/拖放 PDF，真实页数、页码跳转、缩放与适应宽度。
- PDF 文本层选择，解释、翻译、术语、句子解析、结果解释。
- PDF 书签目录；没有书签时按常见标题识别，仍未识别则显示逐页导航。
- 论文速览、问答、简洁/详细/举例；术语分层与前置概念。
- 实验步骤、三个复杂度、真实 Mermaid、编辑、复制、PNG 与源码下载。
- 手机 PDF / AI / 导航切换。

## 验证与构建

`npm test`；`npm run build`；构建后 `node server.mjs --production`。

## 结构

`src/pdf.js` PDF；`src/flow.js` 流程图；`src/app.js` 界面；`lib/provider.mjs` 模型接口；`lib/mock.mjs` 离线示例；`lib/schema.mjs` 输入输出校验；`server.mjs` 本地服务。

## 当前限制

扫描版无 OCR；最多 40MB / 300 页。模型上下文最多 90,000 字符，优先当前页、摘要、方法实验结果及末页，不保证长论文全部进入上下文。图片表格只提取可选文字，不包含视觉识别。无持久会话、账号和跨设备同步。Mock 是预设演示，不进行任意翻译；真实 AI 质量依赖配置的模型。原生 JavaScript 模块使用运行时 Zod 校验，尚未迁移 TypeScript/React。仅本机使用，公网部署需要额外认证与运行时适配。
