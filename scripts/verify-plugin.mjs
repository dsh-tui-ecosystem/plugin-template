#!/usr/bin/env node
/**
 * 用 dsh-ecosystem-spec 的 conformance 校验本模板的 `dsh-plugin.json`。
 *
 * 用法：
 *   1) 把 https://github.com/T-Auto/dsh-ecosystem-spec 克隆到本仓库同级
 *      （或设置 DASH_ECOSYSTEM_SPEC 指向它的检出路径）；
 *   2) 在 spec 检出里先跑 `npm run test:standalone` 构建依赖；
 *   3) 回到本仓库执行 `npm run verify:plugin`。
 *
 * 预期结果：`waiting_authorization` —— 本模板声明 `messages.observe.read`
 * （权限默认 deny），这正是默认拒绝的正确语义；在该会话授权
 * （`~/.dsh-tui/extension-grants.json`）后应为 `compatible`。
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const spec = process.env.DASH_ECOSYSTEM_SPEC ?? join(here, '..', '..', 'dsh-ecosystem-spec')
if (!existsSync(join(spec, 'package.json'))) {
  console.error('[verify:plugin] 未找到 dsh-ecosystem-spec。请先克隆到本仓库同级（或设 DASH_ECOSYSTEM_SPEC 指向它），并在其内运行 npm run test:standalone 构建依赖。')
  process.exit(2)
}
const manifest = resolve(here, '..', 'dsh-plugin.json')
const run = spawnSync(process.execPath, [join(spec, 'scripts', 'validate-manifest.mjs'), '--manifest', manifest], { stdio: 'inherit' })
console.log(`[verify:plugin] validate-manifest exit=${run.status}`)
console.log('[verify:plugin] 说明：模板声明 messages.observe.read（默认 deny），预期决策为 waiting_authorization；授权后为 compatible。')
process.exit(run.status ?? 1)
