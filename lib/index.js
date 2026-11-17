/**
 * Host half of dsh-answer-style.
 *
 * Owns the preference file `~/.dsh/answer-style.json` (`$DSH_HOME/answer-style.json`
 * when that variable is set): one document shared by every browser and by the
 * Desktop app of this Host, instead of per-browser `localStorage`.
 *
 * Serves it at `/answer-style/config` (GET reads, PUT replaces) for
 * the browser half, which also keeps a `localStorage` copy purely as a first
 * paint / offline cache.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** Cordis plugin name. */
export const name = 'answer-style'

/** No Host services are required up front; `webServer` is injected below. */
export const inject = []

/** Mount point of this plugin's Host routes. */
const ROUTE = '/answer-style'

/** Refuse config documents larger than this. */
const MAX_BODY_BYTES = 8192

/** Accepted body weight values, mirroring the browser half. */
const WEIGHTS = new Set(['default', '300', '400', '500', '600', '700'])

/** Accepted heading weight values. */
const HEADING_WEIGHTS = new Set(['default', '400', '500', '600', '700'])

/** Bold-looking runs the color may apply to. */
const SCOPE_KEYS = ['strong', 'headings', 'headers']

/** Preference used when the file does not exist yet. */
const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  family: '',
  weight: 'default',
  headingWeight: 'default',
  color: '',
  colorScope: Object.freeze({ strong: true, headings: true, headers: true }),
  lineHeight: 0,
  paragraphGap: 0,
  tableZebra: false,
  tableCompact: false,
  tableNums: false,
})

/** Accepted spacing values; `0` means "follow the theme". */
const LINE_HEIGHTS = new Set([0, 24, 26, 28, 30, 32, 34])
const PARAGRAPH_GAPS = new Set([0, 8, 12, 16, 20, 24, 28])

/**
 * Absolute path of the shared preference file.
 * @returns the config file path under the Harness home.
 */
function configPath() {
  const configured = process.env.DSH_HOME
  const home = configured !== undefined && configured.trim() !== '' ? configured : join(homedir(), '.dsh')
  return join(home, 'answer-style.json')
}

/**
 * Narrow one arbitrary JSON value to the accepted preference shape.
 * @param input - parsed JSON body or file contents.
 * @returns the sanitized preference.
 */
function sanitize(input) {
  const source = input !== null && typeof input === 'object' ? input : {}
  const family = typeof source.family === 'string' ? source.family.slice(0, 300) : ''
  const color = typeof source.color === 'string' ? source.color.slice(0, 64) : ''
  const scope = source.colorScope !== null && typeof source.colorScope === 'object' ? source.colorScope : {}
  const colorScope = {}
  for (const key of SCOPE_KEYS) colorScope[key] = scope[key] !== false
  return {
    enabled: source.enabled !== false,
    family,
    weight: WEIGHTS.has(source.weight) ? source.weight : 'default',
    headingWeight: HEADING_WEIGHTS.has(source.headingWeight) ? source.headingWeight : 'default',
    color: /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu.test(color) || /^rgba?\([\d\s.,%/]+\)$/iu.test(color) ? color : '',
    colorScope,
    lineHeight: LINE_HEIGHTS.has(source.lineHeight) ? source.lineHeight : 0,
    paragraphGap: PARAGRAPH_GAPS.has(source.paragraphGap) ? source.paragraphGap : 0,
    tableZebra: source.tableZebra === true,
    tableCompact: source.tableCompact === true,
    tableNums: source.tableNums === true,
  }
}

/**
 * Answer one JSON body.
 * @param response - response writer.
 * @param status - HTTP status.
 * @param value - JSON-serializable payload.
 */
function sendJson(response, status, value) {
  const body = JSON.stringify(value)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

/**
 * Read a bounded request body.
 * @param request - incoming request.
 * @returns the decoded body text.
 */
async function readBody(request) {
  return await new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

/**
 * Read the shared preference file.
 * @returns the stored preference, or the defaults when the file is absent or unreadable.
 */
async function readConfig() {
  try {
    return sanitize(JSON.parse(await readFile(configPath(), 'utf8')))
  } catch {
    return { ...DEFAULT_CONFIG, colorScope: { ...DEFAULT_CONFIG.colorScope } }
  }
}

/**
 * Replace the shared preference file atomically.
 * @param value - sanitized preference.
 */
async function writeConfig(value) {
  const file = configPath()
  await mkdir(dirname(file), { recursive: true })
  const temporary = `${file}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, file)
}

/**
 * Mount the config route on the Host web server.
 * @param ctx - Host plugin context.
 */
export function apply(ctx) {
  ctx.inject(['webServer'], (scope) => {
    scope.effect(() => scope.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: async (request, response) => {
        const path = new URL(request.url ?? '/', 'http://localhost').pathname
        if (path !== `${ROUTE}/config`) {
          sendJson(response, 404, { error: 'not found' })
          return
        }
        if (request.method === 'GET') {
          sendJson(response, 200, await readConfig())
          return
        }
        if (request.method === 'PUT' || request.method === 'POST') {
          try {
            const text = await readBody(request)
            const value = sanitize(text.trim() === '' ? {} : JSON.parse(text))
            await writeConfig(value)
            sendJson(response, 200, value)
          } catch {
            sendJson(response, 400, { error: 'invalid config' })
          }
          return
        }
        sendJson(response, 405, { error: 'method not allowed' })
      },
    }), 'dsh-answer-style: config route')
  })
}
