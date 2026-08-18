# dsh-tui plugin-template

dsh-TUI 生态插件的起步脚手架。克隆它、改个名，5 分钟出一个能跑的
Cordis 运行时插件。

The starting scaffold for dsh-TUI ecosystem plugins. Clone it, rename it, and
ship a working Cordis runtime plugin in minutes.

## 这个模板演示了什么 / What this template demonstrates

- 完整插件契约：`name` / `Config`（类型 + Schema）/ `apply`，无默认导出
  (The full plugin contract: `name` / `Config` type + schema / `apply`, no
  default export)
- 会话事件接缝：监听 `session/event` / `session/disposed`，追加 log-only
  事件（Session events: consume the session stream, append log-only events）
- 事件类型注册 + `SessionEventMap` 合并（`src/registration.ts` /
  `src/events.ts`）——不注册会让会话无法 resume（mandatory event-type
  registration — skipping it makes sessions unresumable）
- 可选 TUI 槽位接缝：宿主提供 `ctx.tuiPrompt` 时注册 `${example}` 模板值
  (Optional TUI prompt slot: `${example}` in `theme.leftPrompt` when the host
  provides `ctx.tuiPrompt`)
- 打包技能（`skills/example-skill/SKILL.md`）与主题资产
  （`themes/example.json`，用户复制到 `~/.dsh-tui/themes/` 即可）
  (Packaged skill + theme asset)

## 快速开始 / Quick start

```sh
# 1. 复制并改名
cp -r plugin-template my-plugin && cd my-plugin
# 把 package.json 的 name 改成你的包名（约定 @dsh-tui-ecosystem/<name>）

# 2. 安装与构建（首次用 pnpm install 生成锁文件，之后 CI 用 --frozen-lockfile）
pnpm install
pnpm build          # tsc -> lib/types/（发布前提交产物与 pnpm-lock.yaml）

# 3. 装进 dsh-tui profile 并在真实 TTY 验证
dsh plugin --profile dsh-tui add <你的包名>
dsh --profile dsh-tui
```

## 结构 / Layout

```text
src/index.ts          插件契约 + apply（入口）
src/events.ts         事件类型 + SessionEventMap 合并
src/registration.ts   KNOWN_SESSION_EVENT_TYPES 注册（resume 安全）
cordis.patch.yml      向 profile 插入插件行
skills/               打包技能（随包分发）
themes/               主题资产（用户复制到 ~/.dsh-tui/themes/）
```

## 规范 / Conventions

- 纯 ESM，TypeScript 相对导入带 `.js` 后缀
  (Pure ESM; `.js` suffixes on relative imports)
- 许可证 MIT；Node `^22.19 || >=24`；语义化版本，`v*` tag 驱动发布
  (MIT license; Node `^22.19 || >=24`; semver with tag-driven releases)
- 完整接缝目录、质量红线与收录方式见核心仓库的
  [插件开发指南](https://github.com/ccch1mneyyy/dsh-TUI/blob/main/docs/plugins.md)
  (Full seam catalogue, red lines, and listing: the core repo's
  [Plugin development guide](https://github.com/ccch1mneyyy/dsh-TUI/blob/main/docs/plugins.en.md))

## 生态规范与验证（dsh-ecosystem-spec v0.15）

本模板随 [dsh-ecosystem-spec](https://github.com/T-Auto/dsh-ecosystem-spec)
（社区 v0.15 准入 profile）附上声明性身份文件 `dsh-plugin.json`：用 `facets.host`
（entry `lib/types/index.js` + `apiVersion v1alpha1`）、`requires.contracts`
（`messages.dsh/v1alpha1#MessageObserver`）、`permissions`
（`messages.observe.read`，默认 deny）与 `subscriptions` 描述插件的 v0.15 身份
与契约面；实际可运行层仍是 `package.json` 的 `dsh.bundle.patch` +
`cordis.patch.yml`（见 `overrides`）。

验证（需要一个 [dsh-ecosystem-spec](https://github.com/T-Auto/dsh-ecosystem-spec)
检出，可用 `DASH_ECOSYSTEM_SPEC` 指向；检出内先 `npm run test:standalone`）：

```sh
npm run verify:plugin
```

预期决策为 `waiting_authorization`（`messages.observe.read` 默认 deny，符合
RFC 0005 默认拒绝语义）；授权后（`~/.dsh-tui/extension-grants.json`）为
`compatible`。
