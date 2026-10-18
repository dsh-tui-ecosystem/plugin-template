#!/usr/bin/env node
/**
 * Offline manifest guard for this template.
 *
 * The authoritative validator is the Community v0.15 parser
 * (`@dsh-std/manifest`) plus the TUI admission checklist. This script is the
 * dependency-free subset that catches the field-shape mistakes that parser
 * rejects most often — a protocol coordinate in `facets.host.apiVersion`,
 * `rationale` instead of `reason` in a permission row, missing required
 * arrays — so a fresh clone can check itself before `pnpm install`.
 *
 * It is a pre-check, not a replacement: a manifest that passes here still has
 * to pass the parser and the checklist before it can claim admission.
 *
 * Run: node scripts/check-manifest.mjs [path]
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = process.argv[2] ?? join(root, 'dsh-plugin.json')

const TOP_LEVEL = [
  '$schema', 'manifestVersion', 'id', 'name', 'version', 'facets', 'requires',
  'permissions', 'contributes', 'subscriptions', 'license', 'source', 'artifact',
  'compat', 'overrides',
]
const FACET_API_VERSION = /^v[1-9][0-9]*(?:(?:alpha|beta)[1-9][0-9]*)?$/u
const NAMESPACED_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9][a-z0-9-]*)+$/u
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value) => typeof value === 'string' && value.trim() !== ''

let manifest
try {
  manifest = JSON.parse(readFileSync(file, 'utf8'))
} catch (error) {
  console.error(`FAIL: ${file} is not readable JSON — ${error.message}`)
  process.exit(1)
}

const errors = []
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${ok || detail === undefined ? '' : ` — ${detail}`}`)
  if (!ok) errors.push(name)
}

check('manifest is an object', isObject(manifest))
if (!isObject(manifest)) {
  console.error(`FAIL: ${errors.length} check(s) failed`)
  process.exit(1)
}

const unknownTopLevel = Object.keys(manifest)
  .filter((key) => !TOP_LEVEL.includes(key) && !key.startsWith('x-'))
check('no unknown top-level fields', unknownTopLevel.length === 0, unknownTopLevel.join(', '))

let schemaUrl = false
try {
  schemaUrl = isText(manifest.$schema) && new URL(manifest.$schema).protocol === 'https:'
} catch {
  schemaUrl = false
}
check('$schema is an absolute https URL', schemaUrl)
check('manifestVersion is "0.15"', manifest.manifestVersion === '0.15', String(manifest.manifestVersion))
check('id is a namespaced identifier', isText(manifest.id) && NAMESPACED_ID.test(manifest.id), String(manifest.id))
check('name is non-empty', isText(manifest.name))
check('version is semver', isText(manifest.version) && SEMVER.test(manifest.version), String(manifest.version))

if (file === join(root, 'dsh-plugin.json')) {
  let pkg
  try {
    pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  } catch {
    pkg = undefined
  }
  check(
    'manifest version matches package.json',
    isObject(pkg) && manifest.version === pkg.version,
    isObject(pkg) ? `${String(manifest.version)} != ${String(pkg.version)}` : 'package.json unreadable',
  )
  check(
    'package.json ships dsh-plugin.json',
    isObject(pkg) && Array.isArray(pkg.files) && pkg.files.includes('dsh-plugin.json'),
    isObject(pkg) ? JSON.stringify(pkg.files) : 'package.json unreadable',
  )
}

const facets = manifest.facets
check('facets is an object with only "host"', isObject(facets) && Object.keys(facets).every((key) => key === 'host'))
const host = isObject(facets) ? facets.host : undefined
check('facets.host is an object', isObject(host))
check(
  'facets.host.entry is package-relative',
  isObject(host) && isText(host.entry)
    && !host.entry.startsWith('/') && !host.entry.startsWith('\\')
    && !host.entry.replaceAll('\\', '/').split('/').includes('..'),
  isObject(host) ? String(host.entry) : undefined,
)
check(
  'facets.host.apiVersion is a facet version (v1alpha1), not a protocol coordinate',
  isObject(host) && typeof host.apiVersion === 'string' && FACET_API_VERSION.test(host.apiVersion),
  isObject(host) ? String(host.apiVersion) : undefined,
)

const requires = manifest.requires
check('requires.contracts is an array', isObject(requires) && Array.isArray(requires.contracts))
check(
  'requires.services is empty when present',
  !isObject(requires) || requires.services === undefined
    || (Array.isArray(requires.services) && requires.services.length === 0),
)

const permissions = manifest.permissions
const permissionRowsOk = Array.isArray(permissions) && permissions.every((row) => (
  isObject(row)
  && Object.keys(row).every((key) => ['name', 'scope', 'reason'].includes(key))
  && isText(row.name) && isText(row.scope)
  && (row.reason === undefined || isText(row.reason))
))
check('permissions is an array of { name, scope, reason? }', permissionRowsOk)

const contributes = manifest.contributes
check(
  'contributes.commands is an array',
  isObject(contributes) && Array.isArray(contributes.commands),
)
check(
  'contributes.panels is empty when present',
  !isObject(contributes) || contributes.panels === undefined
    || (Array.isArray(contributes.panels) && contributes.panels.length === 0),
)
check(
  'contributes has no unknown point outside commands/panels/x-*',
  !isObject(contributes)
    || Object.keys(contributes).every((key) => ['commands', 'panels'].includes(key) || key.startsWith('x-')),
)

check('subscriptions is an array', Array.isArray(manifest.subscriptions))

if (errors.length > 0) {
  console.error(`FAIL: ${errors.length} check(s) failed — see the TUI admission guide`)
  process.exit(1)
}
console.log('ALL PASS: manifest matches the v0.15 field shapes this template uses')
