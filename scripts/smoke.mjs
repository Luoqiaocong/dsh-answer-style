/**
 * Dependency-free smoke test for the browser bundle.
 *
 * Loads `lib/client.js` behind minimal `window` / `document` / `react` stubs,
 * runs the Cordis plugin face, and asserts the wiring and the injected CSS:
 *   - the bundle registers with the DSH module loader under the package name;
 *   - `apply()` injects no stylesheet while every preference is default;
 *   - a commit produces the assistant-scoped rules, with the color rule
 *     limited to bold runs (`strong, b`);
 *   - preferences round-trip through `localStorage`;
 *   - reset removes both the stylesheet and the storage key.
 *
 * Run: `node scripts/smoke.mjs`
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const bundlePath = join(here, '..', 'lib', 'client.js')
const PACKAGE_NAME = 'dsh-answer-style'
const SHEET_ID = 'dsh-answer-style-sheet'
const STORAGE_KEY = 'dsh-answer-style/v1'

/* ------------------------------------------------------------ DOM stubs ---- */

const storage = new Map()
const localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => { storage.set(key, String(value)) },
  removeItem: (key) => { storage.delete(key) },
}

const nodes = new Map()
const head = {
  children: [],
  append(node) {
    this.children.push(node)
    node.isConnected = true
    nodes.set(node.id, node)
  },
}
const document = {
  head,
  getElementById: (id) => nodes.get(id) ?? null,
  createElement: () => ({
    id: '',
    textContent: '',
    isConnected: false,
    remove() {
      this.isConnected = false
      nodes.delete(this.id)
      head.children = head.children.filter((child) => child !== this)
    },
  }),
}

const reactStub = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
}

/* ---------------------------------------------------------------- loader ---- */

let registration
const window = {
  __ModuleLoader__: { load: (definition) => { registration = definition } },
  localStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
}

// The browser half talks to its Host route; this smoke test has no Host.
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) })

const source = readFileSync(bundlePath, 'utf8')
new Function('window', 'document', 'console', source)(window, document, console)

assert.ok(registration, 'bundle did not call window.__ModuleLoader__.load')
assert.equal(registration.id, PACKAGE_NAME, 'bundle id must equal the package name')

const exportsObject = registration.factory((specifier) => {
  assert.equal(specifier, 'react', `unexpected require("${specifier}")`)
  return reactStub
})
assert.equal(exportsObject.name, 'answer-style')
assert.deepEqual(exportsObject.inject, ['slots'])
assert.equal(typeof exportsObject.apply, 'function')

/* ------------------------------------------------------------ plugin face ---- */

let registered
const effects = []
const ctx = {
  effect(fn, label) {
    const disposer = fn()
    effects.push({ label, disposer })
    return typeof disposer === 'function' ? disposer : () => {}
  },
  slots: {
    inject: (name, factory) => { assert.equal(name, 'settings.section'); return factory() },
    register: (options, component) => { registered = { options, component }; return () => {} },
  },
}

exportsObject.apply(ctx)
assert.ok(registered, 'settings.section was not registered')
assert.equal(registered.options.id, 'answer-style')
assert.equal(registered.options.label(), '回答字体')
assert.equal(document.getElementById(SHEET_ID), null, 'defaults must not inject a stylesheet')

const face = registered.options.inject()
assert.equal(typeof face.get, 'function')
assert.equal(typeof face.update, 'function')
assert.equal(typeof face.reset, 'function')

/* --------------------------------------------------------------- behaviour ---- */

face.update({ family: 'LXGW WenKai, Microsoft YaHei', weight: '700', color: '#1d4ed8' })
const sheet = document.getElementById(SHEET_ID)
assert.ok(sheet, 'commit did not inject the stylesheet')
assert.match(sheet.textContent, /\[data-chat-flow-kind="assistant-step"\]/)
assert.match(sheet.textContent, /font-family: "LXGW WenKai", "Microsoft YaHei" !important;/)
assert.match(sheet.textContent, /font-weight: 700 !important;/)
assert.match(
  sheet.textContent,
  /\[data-chat-flow-kind="assistant-step"\] :is\(strong, b, h1, h2, h3, h4, h5, h6, th\) \{ color: #1d4ed8 !important; \}/,
  'the color rule must cover bold runs, headings and table headers',
)
assert.doesNotMatch(sheet.textContent, /p, li[^}]*color:/, 'body text must keep the theme color')
assert.equal(
  JSON.parse(localStorage.getItem(STORAGE_KEY)).family,
  '"LXGW WenKai", "Microsoft YaHei"',
  'preferences must persist',
)

face.update({ family: 'a}</style><script>alert(1)</script>, serif' })
assert.doesNotMatch(document.getElementById(SHEET_ID).textContent, /<script/, 'CSS injection must be sanitized')

// Heading weight is its own axis.
face.update({ headingWeight: '500' })
assert.match(
  document.getElementById(SHEET_ID).textContent,
  /\[data-chat-flow-kind="assistant-step"\] :is\(h1, h2, h3, h4, h5, h6\) \{ font-weight: 500 !important; \}/,
  'heading weight must be a separate rule',
)

// Unchecking “headings” takes headings out of the color rule only.
face.update({ colorScope: { headings: false } })
const scoped = document.getElementById(SHEET_ID).textContent
assert.match(scoped, /:is\(strong, b, th\) \{ color: #1d4ed8 !important; \}/, 'color must skip headings')
assert.doesNotMatch(scoped, /strong, b, h1/, 'headings must be gone from the color target list')
face.update({ colorScope: { headings: true } })

// Typography spacing and table polish are independent switches.
face.update({ lineHeight: 28, paragraphGap: 20 })
let spacing = document.getElementById(SHEET_ID).textContent
assert.match(spacing, /line-height: 28px !important;/, 'line height rule missing')
assert.match(spacing, /margin-top: 20px !important; margin-bottom: 20px !important;/, 'paragraph gap rule missing')

face.update({ tableZebra: true, tableCompact: true, tableNums: true })
spacing = document.getElementById(SHEET_ID).textContent
assert.match(spacing, /tbody tr:nth-child\(even\)/, 'zebra rule missing')
assert.match(spacing, /padding: 6px 10px !important;/, 'compact padding missing')
assert.match(spacing, /font-variant-numeric: tabular-nums !important;/, 'tabular numbers missing')

face.update({ lineHeight: 0, paragraphGap: 0, tableZebra: false, tableCompact: false, tableNums: false })

face.update({ enabled: false })
assert.equal(document.getElementById(SHEET_ID), null, 'disabling must remove the stylesheet')
face.update({ enabled: true })
assert.ok(document.getElementById(SHEET_ID), 'enabling must reinstall the stylesheet')

face.reset()
assert.equal(document.getElementById(SHEET_ID), null, 'reset must remove the stylesheet')
assert.equal(localStorage.getItem(STORAGE_KEY), null, 'reset must clear the stored preference')
assert.deepEqual(face.get(), {
  enabled: true,
  family: '',
  weight: 'default',
  headingWeight: 'default',
  color: '',
  colorScope: { strong: true, headings: true, headers: true },
  lineHeight: 0,
  paragraphGap: 0,
  tableZebra: false,
  tableCompact: false,
  tableNums: false,
})

console.log('smoke: ok')
