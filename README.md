# dsh-tui plugin-template

dsh-TUI 生态插件的起步脚手架。克隆它、改个名，5 分钟出一个能跑的
Cordis 运行时插件。

The starting scaffold for dsh-TUI ecosystem plugins. Clone it, rename it, and
ship a working Cordis runtime plugin in minutes.

## 先读这个 / Read this first

模板只示范接缝，**不是准入豁免**——装得上不等于过得了准入（The template only
demonstrates seams; being installable is not admission）:

- [准入与开发指南](https://github.com/ccch1mneyyy/dsh-TUI/blob/main/tui-profile/docs/plugin-admission-and-development.md)：
  TUI Admission v0.15 的正文（包身份、声明闭包、供应链证据、命名与发布、从旧模板迁移）
- [插件与扩展](https://github.com/ccch1mneyyy/dsh-TUI/blob/main/docs/plugins.md)：
  接缝目录、质量红线与 `/plugin` 的用法

包根的 `dsh-plugin.json` 就是**声明面**（`manifestVersion: "0.15"`，由固定 revision 的
`@dsh-std/manifest` parser 接受）。只有 `cordis.patch.yml`、没有 manifest 的包没有声明面：
不参与准入、不能声明 `Backend`、不发布协议坐标——不是"默认通过"（迁移清单见准入指南）。

## 声明面 / The manifest

- `id` / `name` / `version`：与 `package.json` 对齐；`id` 用命名空间形式、稳定不随版本变
- `facets.host`：`entry` 指向包内入口（本模板是 `lib/types/index.js`）；`apiVersion` 写
  **facet 版本 `v1alpha1`**——`tui.dsh/v1alpha1` 是私有协议坐标，只出现在
  `requires.contracts` 的引用与贡献声明里
- `requires.contracts`：本模板不引用协议坐标，所以是 `[]`；optional 引用必须写 TUI 可展示的
  fallback
- `permissions` / `contributes` / `subscriptions` 都是**必填项**，最小集分别是 `[]` /
  `{ "commands": [] }` / `[]`——没有内容也要写出来
- **不写** `provides`；`requires.services` 在 v0.15 只接受空数组，所以别在里面声明任何东西

改完字段先跑 `node scripts/check-manifest.mjs`：它离线检查上面这些形状（不替代
`@dsh-std/manifest` 与准入清单，只是让新克隆不必先装依赖）。

## 快速开始 / Quick start

```sh
# 1. 复制并改名
cp -r plugin-template my-plugin && cd my-plugin
# 把 package.json 的 name 与 dsh-plugin.json 的 id / name 改成你的
# （组织内建议 @dsh-tui-ecosystem/<name>；裸名也是一等公民，不因命名被拒）

# 2. 安装与构建（首次用 pnpm install 生成锁文件，之后 CI 用 --frozen-lockfile）
pnpm install
pnpm build          # tsc -> lib/types/（发布前提交产物与 pnpm-lock.yaml）

# 3. 自查声明面，再装进 dsh-tui profile 并在真实 TTY 验证
node scripts/check-manifest.mjs
dsh plugin --profile dsh-tui add <你的包名>
dsh --profile dsh-tui
```

## 发布 / Publishing

- `v*` tag 驱动，**tag 必须等于 `package.json` 的 version**；
  [`.github/workflows/publish.yml`](.github/workflows/publish.yml) 会先跑
  `check-manifest`、`pnpm build` 与 `npm pack --dry-run`，再 `npm publish --provenance`。
- **优先 trusted publishing**：在 npmjs.com 把本仓库与这个 workflow 配成 trusted publisher，
  不需要任何 secret；静态 `NPM_TOKEN` 是降级做法。provenance 是 `attested` 档 evidence 的
  来源，**不构成准入**，也不代表"官方认证"。
- 要发 claim 的包再补 `source`（repository + revision）与 `artifact`（tarball digest）——
  没有 artifact digest 的包不能被标成 Verified（见准入指南的 `TUI-CLAIM-001`）。

## 结构 / Layout

```text
src/index.ts               插件契约 + apply（入口）
src/events.ts              事件类型 + SessionEventMap 合并
src/registration.ts        KNOWN_SESSION_EVENT_TYPES 注册（resume 安全）
dsh-plugin.json            声明面（Community v0.15 manifest）
cordis.patch.yml           向 profile 插入插件行
scripts/check-manifest.mjs 离线检查声明面的字段形状
skills/                    打包技能（随包分发）
themes/                    主题资产（用户复制到 ~/.dsh-tui/themes/）
```

## 规范 / Conventions

- 纯 ESM，TypeScript 相对导入带 `.js` 后缀
  (Pure ESM; `.js` suffixes on relative imports)
- 许可证 MIT；Node `^22.19 || >=24`；语义化版本
  (MIT license; Node `^22.19 || >=24`; semver)
- 完整接缝目录、质量红线与收录方式见核心仓库的
  [插件开发指南](https://github.com/ccch1mneyyy/dsh-TUI/blob/main/docs/plugins.md)
  (Full seam catalogue, red lines, and listing: the core repo's
  [Plugin development guide](https://github.com/ccch1mneyyy/dsh-TUI/blob/main/docs/plugins.en.md))
