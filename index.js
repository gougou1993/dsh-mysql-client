/**
 * Host half of the MySQL client bundle.
 *
 * Runs the mysql CLI via child_process for each operation. Connection details
 * come per request from the Client; nothing is persisted on the Host. SQL is
 * passed as a single argv value to `-e` so it is never interpreted by a shell.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export const name = 'dsh-mysql-client'
export const inject = ['connection']

const execFileAsync = promisify(execFile)
const API = '/api/dsh-mysql-client'
const CLI = process.env.MYSQL_CLI_PATH || '/usr/local/mysql/bin/mysql'
const TIMEOUT = 15000
const MAX_ROWS = 500

class SqlError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}
function json(value, status = 200) {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store' } })
}
function failure(error, fallback) {
  const message = error instanceof SqlError ? error.message : fallback
  const status = error instanceof SqlError ? error.status : 500
  return json({ error: message }, status)
}
function route(path, methods, fetch) {
  return { path: `${API}/${path}`, methods, requestBody: 'buffered', fetch }
}
async function readBody(request) {
  try { return JSON.parse((await request.text()) || '{}') }
  catch (_) { throw new SqlError('请求内容不是合法的 JSON。') }
}
function connArgs(cfg) {
  const args = []
  if (cfg.host) args.push('-h', String(cfg.host))
  if (cfg.port) args.push('-P', String(cfg.port))
  if (cfg.user) args.push('-u', String(cfg.user))
  if (cfg.password) args.push('-p' + String(cfg.password)) // mysql requires -ppass (no space)
  return args
}
// mysql prints an unavoidable warning to stderr when a password is supplied
// on the CLI; strip these noise lines so they never surface as errors/messages.
function cleanWarning(text) {
  return String(text == null ? '' : text)
    .split('\n')
    .filter((line) => !/Using a password on the command line interface can be insecure/i.test(line))
    .join('\n')
    .trim()
}
// Run SQL via mysql --batch --raw -e "<sql>". Returns stdout text.
async function runSql(cfg, database, sql) {
  const args = [...connArgs(cfg), '--batch', '--raw']
  if (database) args.push(String(database))
  args.push('-e', String(sql))
  try {
    const { stdout, stderr } = await execFileAsync(CLI, args, { timeout: TIMEOUT, maxBuffer: 16 * 1024 * 1024 })
    return { out: stdout, err: cleanWarning(stderr) }
  } catch (error) {
    const msg = (error && error.message) || String(error)
    if (msg.includes('ENOENT')) throw new SqlError('找不到 mysql 客户端，请确认路径。', 500)
    if (msg.includes('timed out') || msg.includes('ETIMEDOUT')) throw new SqlError('查询超时。', 504)
    const detail = (error && error.stderr) ? cleanWarning(error.stderr) : msg
    throw new SqlError(detail || 'SQL 执行失败。')
  }
}
// Parse mysql --batch output (tab-separated, first line = headers).
function parseTable(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === ''))
  if (!lines.length) return { columns: [], rows: [], truncated: false, message: '' }
  // A single line without tabs is a status message (e.g. "Query OK, 1 row affected").
  // Anything with multiple lines is a result set — even a single-column one
  // such as SHOW DATABASES / SHOW TABLES, whose lines contain no tabs.
  const hasTab = lines[0].includes('\t')
  if (lines.length === 1 && !hasTab) return { columns: [], rows: [], truncated: false, message: lines[0] }
  const split = (l) => l.split('\t').map((v) => v === 'NULL' ? null : v)
  const columns = split(lines[0])
  const all = lines.slice(1).map(split)
  const truncated = all.length > MAX_ROWS
  const rows = truncated ? all.slice(0, MAX_ROWS) : all
  return { columns, rows, truncated, message: '' }
}

export function apply(ctx) {
  ctx.effect(() => {
    const disposers = []
    const register = (entry) => {
      try {
        const dispose = ctx.connection.fetch.register(entry)
        if (typeof dispose === 'function') disposers.push(dispose)
      } catch (error) {
        console.warn(`[dsh-mysql-client] route ${entry.path} rejected: ${(error && error.message) || error}`)
      }
    }

    // Test connection with SELECT 1.
    register(route('test', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const { out } = await runSql(body.connection || '', '', 'SELECT 1 AS ok')
        const t = parseTable(out)
        return json({ ok: t.rows.length > 0 && t.rows[0][0] === '1', columns: t.columns, rows: t.rows })
      } catch (error) { return failure(error, '连接测试失败。') }
    }))

    // List databases.
    register(route('databases', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const { out } = await runSql(body.connection || '', '', 'SHOW DATABASES')
        const t = parseTable(out)
        const databases = t.rows.map((r) => r[0]).filter(Boolean)
        return json({ databases })
      } catch (error) { return failure(error, '无法读取数据库列表。') }
    }))

    // List tables of a database.
    register(route('tables', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const db = body.database
        if (typeof db !== 'string' || !db) throw new SqlError('缺少数据库名。')
        const { out } = await runSql(body.connection || '', db, 'SHOW TABLES')
        const t = parseTable(out)
        return json({ tables: t.rows.map((r) => r[0]).filter(Boolean) })
      } catch (error) { return failure(error, '无法读取数据表。') }
    }))

    // Describe a table's columns.
    register(route('describe', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const db = body.database
        const table = body.table
        if (typeof db !== 'string' || !db) throw new SqlError('缺少数据库名。')
        if (typeof table !== 'string' || !table) throw new SqlError('缺少表名。')
        const safeDb = '`' + db.replace(/`/g, '``') + '`'
        const safeTable = '`' + table.replace(/`/g, '``') + '`'
        const { out } = await runSql(body.connection || '', db, 'DESCRIBE ' + safeDb + '.' + safeTable)
        const t = parseTable(out)
        // DESCRIBE columns: Field, Type, Null, Key, Default, Extra
        const columns = t.rows.map((r) => ({
          field: r[0] || '', type: r[1] || '', nullable: r[2] || '',
          key: r[3] || '', default: r[4] == null ? '' : String(r[4]), extra: r[5] || '',
        }))
        return json({ columns })
      } catch (error) { return failure(error, '无法读取表结构。') }
    }))

    // List indexes of a table: SHOW INDEX (one row per indexed column).
    register(route('indexes', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const db = body.database
        const table = body.table
        if (typeof db !== 'string' || !db) throw new SqlError('缺少数据库名。')
        if (typeof table !== 'string' || !table) throw new SqlError('缺少表名。')
        const safeDb = '`' + db.replace(/`/g, '``') + '`'
        const safeTable = '`' + table.replace(/`/g, '``') + '`'
        const { out } = await runSql(body.connection || '', db, 'SHOW INDEX FROM ' + safeDb + '.' + safeTable)
        const t = parseTable(out)
        // SHOW INDEX columns: Table, Non_unique, Key_name, Seq_in_index,
        // Column_name, Collation, Cardinality, Sub_part, Packed, Null, Index_type, Comment, Index_comment
        const map = {}
        for (const r of t.rows) {
          const name = r[2] || ''
          if (!name) continue
          if (!map[name]) map[name] = {
            name, unique: String(r[1]) === '0', type: r[10] || 'BTREE',
            columns: [], comment: r[12] || '',
          }
          map[name].columns.push({ seq: Number(r[3]) || 0, column: r[4] || '', subPart: r[7] || '' })
        }
        const indexes = Object.values(map).map((ix) => ({
          ...ix, columns: ix.columns.sort((a, b) => a.seq - b.seq).map((c) => c.column),
        }))
        return json({ indexes })
      } catch (error) { return failure(error, '无法读取索引。') }
    }))

    // Execute arbitrary SQL against an optional database.
    register(route('query', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const sql = typeof body.sql === 'string' ? body.sql.trim() : ''
        if (!sql) throw new SqlError('请输入 SQL。')
        const { out, err } = await runSql(body.connection || '', body.database || '', sql)
        const table = parseTable(out)
        return json({
          columns: table.columns, rows: table.rows, truncated: table.truncated,
          message: table.message || (err ? String(err).trim() : '') || '执行成功',
          affectedRows: null,
        })
      } catch (error) { return failure(error, 'SQL 执行失败。') }
    }))

    return () => {
      for (const dispose of disposers) {
        try {
          const result = dispose()
          if (result && typeof result.then === 'function') result.catch(() => {})
        } catch (_) {}
      }
    }
  }, 'dsh-mysql-client: routes')
}
