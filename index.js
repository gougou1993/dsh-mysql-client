/**
 * Host half of the MySQL client bundle.
 *
 * Talks to MySQL over the wire with the pure-JavaScript `mysql2` driver, so no
 * local `mysql` CLI is required. Connection details come per request from the
 * Client; passwords never enter the browser (they live in the DSH credential store).
 */
import mysql from 'mysql2/promise'

export const name = 'dsh-mysql-client'
export const inject = ['connection', 'credentials']

const API = '/api/dsh-mysql-client'
const CONNECT_TIMEOUT = 10000
const MAX_ROWS = 500
const MAX_LIVE_POOLS = 6

class SqlError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}
function json(value, status = 200) {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store' } })
}
function failure(error, fallback) {
  if (!(error instanceof SqlError)) {
    const translated = translateError(error)
    if (translated) return json({ error: translated.message }, translated.status)
  }
  const message = error instanceof SqlError ? error.message : (error && error.message) || fallback
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

// MySQLError carries a `code` such as ER_ACCESS_DENIED_ERROR.
function translateError(error) {
  const code = (error && error.code) || ''
  const msg = (error && error.message) || ''
  if (/ECONNREFUSED/i.test(code + msg)) return { message: '连接被拒绝，请检查主机与端口。', status: 502 }
  if (/ENOTFOUND|EAI_AGAIN/i.test(code + msg)) return { message: '无法解析主机地址。', status: 502 }
  if (/ETIMEDOUT|PROTOCOL_SEQUENCE_TIMEOUT/i.test(code + msg)) return { message: '连接或查询超时。', status: 504 }
  if (code === 'ER_ACCESS_DENIED_ERROR') return { message: '用户名或密码错误。', status: 401 }
  if (code === 'ER_BAD_DB_ERROR') return { message: '数据库不存在。', status: 404 }
  if (code === 'ER_NO_SUCH_TABLE') return { message: '数据表不存在。', status: 404 }
  if (code === 'ER_PARSE_ERROR') return { message: 'SQL 语法错误：' + String(msg).replace(/^You have an error in your SQL syntax;\s*/i, ''), status: 400 }
  return null
}

// Credential reference for one connection (DSH refs are env-var-like identifiers).
function refOf(connId) {
  const safe = String(connId || '').replace(/[^A-Za-z0-9]/g, '_')
  return 'MYSQL_CONN_' + (safe || 'DEFAULT').toUpperCase()
}
async function getStoredPassword(ctx, connId) {
  if (!connId) return ''
  try {
    const resolved = await ctx.credentials.resolve(refOf(connId))
    // resolve() returns { value, source }, not a bare string.
    if (resolved && typeof resolved === 'object' && typeof resolved.value === 'string') return resolved.value
    if (typeof resolved === 'string') return resolved
    return ''
  } catch (_) { return '' }
}
async function withStoredPassword(ctx, cfg) {
  const merged = { ...cfg }
  if (!merged.password && merged.id) {
    const stored = await getStoredPassword(ctx, merged.id)
    if (stored) merged.password = stored
    // No password stored for this connection: surface it directly instead of
    // letting the server report a confusing access-denied error.
    else if (merged.hasPassword) throw new SqlError('该连接的密码未保存，请重新编辑连接并填写密码。', 401)
  }
  return merged
}

// --- pool --------------------------------------------------------------------
// One mysql2 pool per host:port:user, reused across requests.
const pools = new Map()
// The key must include the credential identity: otherwise a pool created with a
// wrong password is reused for later requests that supply the right one.
function poolKey(cfg) {
  const pw = String(cfg.password == null ? '' : cfg.password)
  let tag = 'noauth'
  if (pw) {
    let hash = 0
    for (let i = 0; i < pw.length; i += 1) hash = ((hash << 5) - hash + pw.charCodeAt(i)) | 0
    tag = 'pw' + (hash >>> 0).toString(36)
  }
  return [cfg.host || '127.0.0.1', Number(cfg.port) || 3306, cfg.user || 'root', tag].join('|')
}
function createPool(cfg) {
  return mysql.createPool({
    host: cfg.host || '127.0.0.1',
    port: Number(cfg.port) || 3306,
    user: cfg.user || 'root',
    password: cfg.password === undefined ? '' : String(cfg.password),
    waitForConnections: true,
    connectionLimit: 3,
    maxIdle: 3,
    idleTimeout: 60000,
    connectTimeout: CONNECT_TIMEOUT,
    multipleStatements: true,
    dateStrings: true,
    supportBigNumbers: true,
  })
}
function getPool(cfg) {
  const key = poolKey(cfg)
  const existing = pools.get(key)
  if (existing) return existing
  const pool = createPool(cfg)
  pools.set(key, pool)
  if (pools.size > MAX_LIVE_POOLS) {
    for (const [k, p] of pools) {
      if (pools.size <= MAX_LIVE_POOLS) break
      if (k === key) continue
      try { p.end().catch(() => {}) } catch (_) {}
      pools.delete(k)
    }
  }
  return pool
}
// Run one statement against an optional database, returning [rows, fields].
// A dedicated connection is taken from the pool so that a failed statement can be
// destroyed instead of returned, which would otherwise poison the pool.
async function runQuery(cfg, database, sql) {
  const pool = getPool(cfg)
  let conn
  try {
    conn = await pool.getConnection()
    if (database) {
      await conn.query('USE `' + String(database).replace(/`/g, '``') + '`')
    }
    const [rows, fields] = await conn.query(sql)
    conn.release()
    return { rows, fields }
  } catch (error) {
    // Destroy instead of release: a connection left in a bad state (failed USE,
    // aborted query, dropped socket) must not go back into the pool.
    if (conn && typeof conn.destroy === 'function') { try { conn.destroy() } catch (_) {} }
    const t = translateError(error)
    if (t) throw new SqlError(t.message, t.status)
    throw new SqlError((error && error.message) || 'SQL 执行失败。')
  }
}

function toCell(value) {
  if (value === null || value === undefined) return null
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}
// Normalise driver output into the {columns, rows} shape the Client expects.
function toTable(rows, fields) {
  if (!Array.isArray(rows)) {
    // DML/DDL: an OkPacket.
    const affected = rows && rows.affectedRows != null ? rows.affectedRows : null
    return { columns: [], rows: [], truncated: false, message: affected != null ? `影响 ${affected} 行` : '执行成功', affectedRows: affected }
  }
  const columns = Array.isArray(fields) ? fields.map((f) => f.name) : (rows[0] ? Object.keys(rows[0]) : [])
  const truncated = rows.length > MAX_ROWS
  const slice = truncated ? rows.slice(0, MAX_ROWS) : rows
  const matrix = slice.map((row) => (Array.isArray(row) ? row.map(toCell) : columns.map((c) => toCell(row[c]))))
  return { columns, rows: matrix, truncated, message: truncated ? `结果超过 ${MAX_ROWS} 行，已截断` : '', affectedRows: null }
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

    // Test connection.
    register(route('test', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const { rows } = await runQuery(cfg, '', 'SELECT 1 AS ok')
        const t = toTable(rows, null)
        return json({ ok: Boolean(t.rows.length && Number(t.rows[0][0]) === 1), columns: t.columns, rows: t.rows })
      } catch (error) { return failure(error, '连接测试失败。') }
    }))

    // Server information via SHOW VARIABLES / SHOW GLOBAL STATUS.
    register(route('info', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const varRows = toTable((await runQuery(cfg, '', 'SHOW VARIABLES')).rows, null).rows
        const statusRows = toTable((await runQuery(cfg, '', 'SHOW GLOBAL STATUS')).rows, null).rows
        const variables = {}
        const status = {}
        for (const r of varRows) if (r[0] != null) variables[String(r[0]).toLowerCase()] = r[1]
        for (const r of statusRows) if (r[0] != null) status[String(r[0]).toLowerCase()] = r[1]
        const uptimeSec = Number(status.uptime || 0)
        const days = Math.floor(uptimeSec / 86400)
        const hours = Math.floor((uptimeSec % 86400) / 3600)
        const minutes = Math.floor((uptimeSec % 3600) / 60)
        const uptime = [days ? days + 'd' : '', hours ? hours + 'h' : '', minutes + 'm'].filter(Boolean).join(' ') || (uptimeSec + 's')
        const info = {
          version: variables.version || '-',
          edition: variables.version_comment || variables.version_compile_os || '-',
          host: variables.hostname || '-',
          port: variables.port || '-',
          user: variables.user || '-',
          os: variables.version_compile_os || '-',
          arch: variables.system_architecture || '-',
          datadir: variables.datadir || '-',
          charset: variables.character_set_server || '-',
          uptime, uptimeSec,
          connections: status.connections || '-',
          threads: status.threads_connected || '-',
          maxConnections: variables.max_connections || '-',
          queries: status.questions || status.queries || '-',
          slowQueries: status.slow_queries || '-',
        }
        return json({ info })
      } catch (error) { return failure(error, '无法读取服务器信息。') }
    }))

    // List databases.
    register(route('databases', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const { rows, fields } = await runQuery(cfg, '', 'SHOW DATABASES')
        const t = toTable(rows, fields)
        const databases = t.rows.map((r) => r[0]).filter(Boolean)
        return json({ databases })
      } catch (error) { return failure(error, '无法读取数据库列表。') }
    }))

    // Create a new database. Names are strictly validated and backtick-escaped.
    register(route('createDatabase', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        if (!name) throw new SqlError('请输入数据库名称。')
        if (!/^[A-Za-z0-9_]+$/.test(name)) throw new SqlError('数据库名称只能包含字母、数字和下划线。')
        if (name.length > 64) throw new SqlError('数据库名称不能超过 64 个字符。')
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const charset = typeof body.charset === 'string' && /^[A-Za-z0-9_]+$/.test(body.charset) ? body.charset : 'utf8mb4'
        const escaped = '`' + name.replace(/`/g, '``') + '`'
        await runQuery(cfg, '', 'CREATE DATABASE IF NOT EXISTS ' + escaped + ' CHARACTER SET ' + charset)
        return json({ ok: true, name })
      } catch (error) { return failure(error, '创建数据库失败。') }
    }))

    // Drop a database. Name is strictly validated and backtick-escaped.
    register(route('dropDatabase', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        if (!name) throw new SqlError('请输入数据库名称。')
        if (!/^[A-Za-z0-9_]+$/.test(name)) throw new SqlError('数据库名称只能包含字母、数字和下划线。')
        const protectedDbs = ['information_schema', 'mysql', 'performance_schema', 'sys']
        if (protectedDbs.includes(name.toLowerCase())) throw new SqlError('系统数据库不允许删除。')
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const escaped = '`' + name.replace(/`/g, '``') + '`'
        await runQuery(cfg, '', 'DROP DATABASE IF EXISTS ' + escaped)
        return json({ ok: true, name })
      } catch (error) { return failure(error, '删除数据库失败。') }
    }))

    // List tables of a database.
    register(route('tables', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const db = body.database
        if (typeof db !== 'string' || !db) throw new SqlError('缺少数据库名。')
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const { rows, fields } = await runQuery(cfg, db, 'SHOW TABLES')
        const t = toTable(rows, fields)
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
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const safeDb = '`' + db.replace(/`/g, '``') + '`'
        const safeTable = '`' + table.replace(/`/g, '``') + '`'
        const { rows } = await runQuery(cfg, db, 'SHOW FULL COLUMNS FROM ' + safeDb + '.' + safeTable)
        const columns = rows.map((r) => ({
          field: r.Field || '',
          type: r.Type || '',
          nullable: r.Null || '',
          key: r.Key || '',
          default: r.Default == null ? '' : String(r.Default),
          extra: r.Extra || '',
          comment: r.Comment || '',
        }))
        return json({ columns })
      } catch (error) { return failure(error, '无法读取表结构。') }
    }))

    // List indexes of a table.
    register(route('indexes', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const db = body.database
        const table = body.table
        if (typeof db !== 'string' || !db) throw new SqlError('缺少数据库名。')
        if (typeof table !== 'string' || !table) throw new SqlError('缺少表名。')
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const safeDb = '`' + db.replace(/`/g, '``') + '`'
        const safeTable = '`' + table.replace(/`/g, '``') + '`'
        const { rows } = await runQuery(cfg, db, 'SHOW INDEX FROM ' + safeDb + '.' + safeTable)
        const map = {}
        for (const r of rows) {
          const name = r.Key_name || ''
          if (!name) continue
          if (!map[name]) {
            map[name] = {
              name,
              unique: Number(r.Non_unique) === 0,
              type: r.Index_type || 'BTREE',
              columns: [],
              comment: r.Index_comment || '',
            }
          }
          map[name].columns.push({
            seq: Number(r.Seq_in_index) || 0,
            column: r.Column_name || '',
            subPart: r.Sub_part == null ? '' : String(r.Sub_part),
          })
        }
        const indexes = Object.values(map).map((ix) => ({
          ...ix,
          columns: ix.columns.sort((a, b) => a.seq - b.seq).map((c) => c.column),
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
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const { rows, fields } = await runQuery(cfg, body.database || '', sql)
        const table = toTable(rows, fields)
        return json({
          columns: table.columns,
          rows: table.rows,
          truncated: table.truncated,
          message: table.message || '执行成功',
          affectedRows: table.affectedRows,
        })
      } catch (error) { return failure(error, 'SQL 执行失败。') }
    }))

    // --- connection secrets: passwords live in DSH credentials, never in the browser ---
    // EXPLAIN: prefix the statement with EXPLAIN and return its query plan.
    register(route('explain', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        let sql = typeof body.sql === 'string' ? body.sql.trim() : ''
        if (!sql) throw new SqlError('请输入 SQL。')
        sql = sql.replace(/;+\s*$/, '')
        // Avoid double EXPLAIN if the user already wrote one.
        if (!/^EXPLAIN\s/i.test(sql)) sql = 'EXPLAIN ' + sql
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const { rows, fields } = await runQuery(cfg, body.database || '', sql)
        const table = toTable(rows, fields)
        return json({ columns: table.columns, rows: table.rows, truncated: table.truncated, sql })
      } catch (error) { return failure(error, 'EXPLAIN 执行失败。') }
    }))

    // --- user management ---------------------------------------------------
    // Quote a MySQL identifier component (user/host) inside single quotes for
    // CREATE/DROP/ALTER USER, escaping embedded quotes and backslashes.
    function qid(value) {
      return "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'"
    }
    function qident(value) {
      return '`' + String(value).replace(/`/g, '``') + '`'
    }
    // Accept either 'user'@'host' or a bare user (defaults to '%').
    function splitUserHost(raw) {
      const text = String(raw || '').trim()
      const m = text.match(/^([^@]+)@(.+)$/)
      return m ? { user: m[1].trim(), host: m[2].trim() } : { user: text, host: '%' }
    }

    register(route('users', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const { rows, fields } = await runQuery(cfg, '', 'SELECT User AS user, Host AS host, account_locked, password_expired FROM mysql.user ORDER BY User, Host')
        const table = toTable(rows, fields)
        const users = table.rows.map((r) => ({
          user: r[0] != null ? String(r[0]) : '',
          host: r[1] != null ? String(r[1]) : '',
          locked: r[2] != null ? String(r[2]) : '',
          expired: r[3] != null ? String(r[3]) : '',
        }))
        return json({ users })
      } catch (error) { return failure(error, '无法读取用户列表。') }
    }))

    register(route('createUser', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const { user, host } = splitUserHost(body.account)
        if (!user) throw new SqlError('请输入用户名。')
        const password = typeof body.password === 'string' ? body.password : ''
        const cfg = await withStoredPassword(ctx, body.connection || {})
        const sql = 'CREATE USER ' + qid(user) + '@' + qid(host || '%') + ' IDENTIFIED BY ' + qid(password)
        await runQuery(cfg, '', sql)
        return json({ ok: true })
      } catch (error) { return failure(error, '创建用户失败。') }
    }))

    register(route('dropUser', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const { user, host } = splitUserHost(body.account)
        if (!user) throw new SqlError('请输入用户名。')
        const cfg = await withStoredPassword(ctx, body.connection || {})
        await runQuery(cfg, '', 'DROP USER ' + qid(user) + '@' + qid(host || '%'))
        return json({ ok: true })
      } catch (error) { return failure(error, '删除用户失败。') }
    }))

    register(route('changePassword', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const { user, host } = splitUserHost(body.account)
        if (!user) throw new SqlError('请输入用户名。')
        const password = typeof body.password === 'string' ? body.password : ''
        const cfg = await withStoredPassword(ctx, body.connection || {})
        await runQuery(cfg, '', 'ALTER USER ' + qid(user) + '@' + qid(host || '%') + ' IDENTIFIED BY ' + qid(password))
        return json({ ok: true })
      } catch (error) { return failure(error, '修改密码失败。') }
    }))

    register(route('grantPrivileges', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const { user, host } = splitUserHost(body.account)
        if (!user) throw new SqlError('请输入用户名。')
        const privileges = typeof body.privileges === 'string' && /^[A-Z_, ]+$/i.test(body.privileges) ? body.privileges.toUpperCase() : 'ALL PRIVILEGES'
        const target = body.database && /^[A-Za-z0-9_]+$/.test(body.database) ? qident(body.database) + '.*' : '*.*'
        const cfg = await withStoredPassword(ctx, body.connection || {})
        await runQuery(cfg, '', 'GRANT ' + privileges + ' ON ' + target + ' TO ' + qid(user) + '@' + qid(host || '%'))
        await runQuery(cfg, '', 'FLUSH PRIVILEGES')
        return json({ ok: true })
      } catch (error) { return failure(error, '授权失败。') }
    }))

    register(route('secret_set', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const id = typeof body.id === 'string' ? body.id.trim() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        if (!id) throw new SqlError('缺少连接标识。')
        if (!password) {
          await ctx.credentials.unset(refOf(id))
          if (await getStoredPassword(ctx, id)) throw new SqlError('清空密码失败，请重试。', 500)
          return json({ ok: true, stored: false })
        }
        await ctx.credentials.set(refOf(id), password)
        return json({ ok: true, stored: true })
      } catch (error) { return failure(error, '保存密码失败。') }
    }))

    register(route('secret_clear', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const id = typeof body.id === 'string' ? body.id.trim() : ''
        if (!id) throw new SqlError('缺少连接标识。')
        await ctx.credentials.unset(refOf(id))
        if (await getStoredPassword(ctx, id)) throw new SqlError('密码未能从凭证库删除，请重试。', 500)
        return json({ ok: true, cleared: true })
      } catch (error) { return failure(error, '删除密码失败。') }
    }))

    register(route('secret_has', ['POST'], async (request) => {
      try {
        const body = await readBody(request)
        const ids = Array.isArray(body.ids) ? body.ids.map((x) => String(x)) : []
        const result = {}
        for (const id of ids) {
          if (!id) continue
          result[id] = Boolean(await getStoredPassword(ctx, id))
        }
        return json({ result })
      } catch (error) { return failure(error, '查询密码状态失败。') }
    }))

    return () => {
      for (const pool of pools.values()) {
        try { pool.end().catch(() => {}) } catch (_) {}
      }
      pools.clear()
      for (const dispose of disposers) {
        try {
          const result = dispose()
          if (result && typeof result.then === 'function') result.catch(() => {})
        } catch (_) {}
      }
    }
  }, 'dsh-mysql-client: routes')
}
