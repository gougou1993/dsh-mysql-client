/**
 * Client half of the MySQL client bundle.
 * Left sidebar entry + panel: connection manager and multiple query tabs.
 */
window.__ModuleLoader__.load({
  id: '@oakzhong/dsh-mysql-client',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useCallback, useMemo } = React

    const NS = 'dsh-mysql-client'
    const PANEL_ID = 'mysql-client'
    const STYLE_ID = 'dsh-mysql-client/css'
    const API = '/api/dsh-mysql-client'
    const CONN_KEY = 'dsh-mysql-client.connections.v1'
    const ACTIVE_KEY = 'dsh-mysql-client.active.v1'
    const TABS_KEY = 'dsh-mysql-client.tabs.v1'

    const zh = {
      title: 'MySQL 客户端', subtitle: '管理连接，新建查询页面，执行 SQL 语句。',
      connections: '连接', newConn: '新建连接', edit: '编辑', del: '删除', save: '保存', cancel: '取消',
      name: '名称', host: '地址', port: '端口', user: '用户名', password: '密码',
      import: '导入连接', export: '导出连接', confirmImport: '导入将追加到现有连接列表，继续？',
      importOk: '成功导入 {n} 个连接', importFail: '导入失败：文件格式不正确', exported: '已导出 {n} 个连接（不含密码）',
      group: '分组', groupPlaceholder: '分组名称（留空=未分组）', ungrouped: '未分组', collapseAll: '全部折叠', expandAll: '全部展开',
      pwdHint: '密码保存在本机凭证库，不写入浏览器存储', pwdEmpty: '留空则不修改已存密码', secretClearFail: '删除连接失败：密码未能从凭证库清除', pwdSaved: '密码已保存到本机凭证库', back: '返回',
      serverInfo: '服务器信息', infoFail: '读取服务器信息失败', infoClose: '收起信息',
      infoVersion: 'MySQL 版本', infoEdition: '版本说明', infoHost: '主机名', infoPort: '端口', infoUser: '用户',
      infoOs: '操作系统', infoArch: '架构', infoDatadir: '数据目录', infoCharset: '字符集',
      infoUptime: '运行时间', infoConnections: '累计连接数', infoThreads: '当前连接数', infoMaxConn: '最大连接数',
      infoQueries: '已执行查询', infoSlowQueries: '慢查询数',
      test: '测试连接', ok: '连接成功', fail: '连接失败',
      queries: '查询', newTab: '新建查询', closeTab: '关闭', db: '数据库',
      renameTab: '重命名查询', tabNamePlaceholder: '查询名称', searchTabs: '搜索查询', searchPlaceholder: '搜索查询名称...',
      explain: 'EXPLAIN 分析', explainDone: 'EXPLAIN 执行计划',
      dbMgmt: '数据库管理', dropDb: '删除数据库', confirmDropDb: '确定删除数据库「{name}」？此操作不可恢复。', dropDbOk: '数据库「{name}」已删除',
      refreshDbs: '刷新数据库', confirmTitle: '确认操作', confirmYes: '确认删除',
      searchDbs: '搜索数据库', searchUsers: '搜索用户', searchPlaceholder: '输入关键字筛选...', noDbs: '暂无数据库',
      expand: '展开', collapse: '收起', collapseSide: '收起左栏', expandSide: '展开左栏',
      newDb: '新建数据库', dbName: '数据库名称', dbNamePlaceholder: '例如：my_app_db', dbCharset: '字符集',
      createDb: '创建', createDbOk: '数据库「{name}」创建成功', createDbFail: '创建数据库失败',
      invalidDbName: '数据库名称只能包含字母、数字和下划线',
      userMgmt: '用户管理', users: '用户列表', noUsers: '暂无用户', refreshUsers: '刷新用户',
      newUser: '新建用户', account: '账户', accountHint: '格式：用户名@主机，如 app@% 或 app@localhost',
      password: '密码', host: '主机', user: '用户名',
      createUser: '创建用户', dropUser: '删除用户', changePwd: '修改密码', grant: '授权',
      confirmDropUser: '确定删除该用户？', userOk: '操作成功', userFail: '操作失败',
      grantPrivileges: '权限', grantTarget: '数据库(留空=全部)', grantHint: '如 ALL PRIVILEGES / SELECT,INSERT',
      accountLocked: '锁定', accountExpired: '密码过期', yes: '是', no: '否',
      run: '执行 (⌘/Ctrl+Enter)', result: '结果', rows: '{n} 行', truncated: '仅显示前 {n} 行',
      noConn: '请先新建并选择一个连接。', noTab: '点「新建查询」打开一个查询页面。',
      sqlPlaceholder: 'SELECT * FROM table LIMIT 100;', databases: '刷新库', tables: '表',
      structure: '结构', addField: '加字段', modifyField: '修改', dropField: '删除',
      fieldName: '字段名', fieldType: '类型', fieldLen: '长度', notNull: '非空',
      defaultValue: '默认值', comment: '备注', primary: '主键', autoInc: '自增',
      applySql: '执行变更', structureTitle: '表结构', noStructure: '暂无结构信息',
      exportCsv: '导出 CSV', exportSql: '导出 SQL', confirmDropField: '确定删除该字段？',
      indexes: '索引', indexName: '索引名', indexColumns: '字段(逗号分隔)', indexType: '类型',
      unique: '唯一', addIndex: '创建索引', dropIndex: '删除索引', noIndexes: '暂无索引',
      confirmDropIndex: '确定删除该索引？', tabColumns: '字段', tabIndexes: '索引',
      noWorkspace: '', listFailed: '操作失败', confirmDel: '确定删除该连接？',
      affected: '执行完成', error: '错误',
    }
    const en = {
      title: 'MySQL client', subtitle: 'Manage connections, open query tabs and run SQL.',
      connections: 'Connections', newConn: 'New connection', edit: 'Edit', del: 'Delete', save: 'Save', cancel: 'Cancel',
      name: 'Name', host: 'Host', port: 'Port', user: 'User', password: 'Password',
      import: 'Import', export: 'Export', confirmImport: 'Import will append to existing connections. Continue?',
      importOk: 'Imported {n} connections', importFail: 'Import failed: invalid file format', exported: 'Exported {n} connections (no passwords)',
      group: 'Group', groupPlaceholder: 'Group name (blank = ungrouped)', ungrouped: 'Ungrouped', collapseAll: 'Collapse all', expandAll: 'Expand all',
      pwdHint: 'Passwords live in the local credential store, not browser storage', pwdEmpty: 'Leave blank to keep the stored password', secretClearFail: 'Delete aborted: the stored password could not be cleared', pwdSaved: 'Password saved to the local credential store', back: 'Back',
      serverInfo: 'Server info', infoFail: 'Failed to load server info', infoClose: 'Hide info',
      infoVersion: 'MySQL version', infoEdition: 'Edition', infoHost: 'Hostname', infoPort: 'Port', infoUser: 'User',
      infoOs: 'OS', infoArch: 'Architecture', infoDatadir: 'Data directory', infoCharset: 'Charset',
      infoUptime: 'Uptime', infoConnections: 'Total connections', infoThreads: 'Current connections', infoMaxConn: 'Max connections',
      infoQueries: 'Queries executed', infoSlowQueries: 'Slow queries',
      test: 'Test connection', ok: 'Connected', fail: 'Connection failed',
      queries: 'Queries', newTab: 'New query', closeTab: 'Close', db: 'Database',
      renameTab: 'Rename query', tabNamePlaceholder: 'Query name', searchTabs: 'Search queries', searchPlaceholder: 'Search query name...',
      explain: 'EXPLAIN', explainDone: 'EXPLAIN plan',
      dbMgmt: 'Databases', dropDb: 'Drop database', confirmDropDb: 'Delete database "{name}"? This cannot be undone.', dropDbOk: 'Database "{name}" dropped',
      refreshDbs: 'Refresh databases', confirmTitle: 'Confirm', confirmYes: 'Delete',
      searchDbs: 'Search databases', searchUsers: 'Search users', searchPlaceholder: 'Type to filter...', noDbs: 'No databases',
      expand: 'Expand', collapse: 'Collapse', collapseSide: 'Hide sidebar', expandSide: 'Show sidebar',
      newDb: 'New database', dbName: 'Database name', dbNamePlaceholder: 'e.g. my_app_db', dbCharset: 'Charset',
      createDb: 'Create', createDbOk: 'Database "{name}" created', createDbFail: 'Failed to create database',
      invalidDbName: 'Name may contain only letters, digits and underscores',
      userMgmt: 'User management', users: 'Users', noUsers: 'No users', refreshUsers: 'Refresh users',
      newUser: 'New user', account: 'Account', accountHint: 'Format: user@host, e.g. app@% or app@localhost',
      password: 'Password', host: 'Host', user: 'User',
      createUser: 'Create user', dropUser: 'Drop user', changePwd: 'Change password', grant: 'Grant',
      confirmDropUser: 'Delete this user?', userOk: 'Operation succeeded', userFail: 'Operation failed',
      grantPrivileges: 'Privileges', grantTarget: 'Database (blank = all)', grantHint: 'e.g. ALL PRIVILEGES / SELECT,INSERT',
      accountLocked: 'Locked', accountExpired: 'Pwd expired', yes: 'Yes', no: 'No',
      run: 'Run (⌘/Ctrl+Enter)', result: 'Result', rows: '{n} rows', truncated: 'Showing first {n} rows',
      noConn: 'Create and select a connection first.', noTab: 'Click "New query" to open a query tab.',
      sqlPlaceholder: 'SELECT * FROM table LIMIT 100;', databases: 'Refresh DBs', tables: 'Tables',
      structure: 'Structure', addField: 'Add column', modifyField: 'Modify', dropField: 'Drop',
      fieldName: 'Field', fieldType: 'Type', fieldLen: 'Length', notNull: 'Not null',
      defaultValue: 'Default', comment: 'Comment', primary: 'Primary', autoInc: 'Auto increment',
      applySql: 'Apply', structureTitle: 'Table structure', noStructure: 'No structure info',
      exportCsv: 'Export CSV', exportSql: 'Export SQL', confirmDropField: 'Drop this column?',
      indexes: 'Indexes', indexName: 'Index name', indexColumns: 'Columns (comma separated)', indexType: 'Type',
      unique: 'Unique', addIndex: 'Create index', dropIndex: 'Drop index', noIndexes: 'No indexes',
      confirmDropIndex: 'Delete this index?', tabColumns: 'Columns', tabIndexes: 'Indexes',
      noWorkspace: '', listFailed: 'Operation failed', confirmDel: 'Delete this connection?',
      affected: 'Done', error: 'Error',
    }
    let t = (k) => (zh[k] || k)
    const fmt = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? v[k] : ''))

    function readJSON(key, fallback) { try { const r = window.localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch (_) { return fallback } }
    function writeJSON(key, v) { try { window.localStorage.setItem(key, JSON.stringify(v)) } catch (_) {} }
    function makeId() { return 'x-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7) }

    async function api(path, body) {
      const res = await fetch(API + path, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      let data = null
      try { data = await res.json() } catch (_) {}
      if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status))
      return data
    }

    function SidebarIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 20
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true,
        style: { opacity: props.active ? 1 : 0.82 },
      },
        h('ellipse', { cx: 12, cy: 6, rx: 8, ry: 3 }),
        h('path', { d: 'M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6' }),
        h('path', { d: 'M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6' })
      )
    }

    function MysqlPanel({ ctx }) {
      const [conns, setConns] = useState(() => readJSON(CONN_KEY, []))
      const [activeId, setActiveId] = useState(() => { try { return window.localStorage.getItem(ACTIVE_KEY) || '' } catch (_) { return '' } })
      const [editing, setEditing] = useState(null)
      const [form, setForm] = useState({ name: '', host: '127.0.0.1', port: 3306, user: 'root', password: '', group: '' })
      const [ping, setPing] = useState('')
      const [pingOk, setPingOk] = useState(false)
      const [serverInfo, setServerInfo] = useState(null)
      const [infoLoading, setInfoLoading] = useState(false)
      const fileRef = useRef(null)
      const [collapsed, setCollapsed] = useState({})
      const [tabs, setTabs] = useState(() => readJSON(TABS_KEY, []))
      const [activeTab, setActiveTab] = useState('')
      const [tabSearch, setTabSearch] = useState('')
      const [newDbOpen, setNewDbOpen] = useState(false)
      const [newDbName, setNewDbName] = useState('')
      const [newDbCharset, setNewDbCharset] = useState('utf8mb4')
      const [confirmDialog, setConfirmDialog] = useState(null)
      const [userMgmtOpen, setUserMgmtOpen] = useState(false)
      const [users, setUsers] = useState([])
      const [userForm, setUserForm] = useState({ account: '', password: '', privileges: 'ALL PRIVILEGES', database: '' })
      const [userMode, setUserMode] = useState('create')
      const [editingTab, setEditingTab] = useState('')
      const [databases, setDatabases] = useState([])
      const [dbSearch, setDbSearch] = useState('')
      const [userSearch, setUserSearch] = useState('')
      const [formCollapsed, setFormCollapsed] = useState(false)
      const [sideCollapsed, setSideCollapsed] = useState(false)
      const [tables, setTables] = useState([])
      const [busy, setBusy] = useState(false)
      const [err, setErr] = useState('')
      const [structTable, setStructTable] = useState('')
      const [structColumns, setStructColumns] = useState([])
      const [structTab, setStructTab] = useState('columns')
      const [indexes, setIndexes] = useState([])
      const [indexForm, setIndexForm] = useState({ name: '', columns: '', unique: false, type: 'BTREE' })
      const [fieldForm, setFieldForm] = useState({ name: '', type: 'VARCHAR', len: '255', notNull: false, def: '', comment: '', primary: false, autoInc: false })

      const active = useMemo(() => conns.find((c) => c.id === activeId) || null, [conns, activeId])
      const tab = useMemo(() => tabs.find((x) => x.id === activeTab) || null, [tabs, activeTab])
      const filteredTabs = useMemo(() => {
        const q = tabSearch.trim().toLowerCase()
        return q ? tabs.filter((x) => String(x.title || '').toLowerCase().includes(q)) : tabs
      }, [tabs, tabSearch])
      // Group connections by their `group` field; empty group renders as "Ungrouped".
      const grouped = useMemo(() => {
        const map = new Map()
        for (const c of conns) {
          const g = (c.group || '').trim()
          if (!map.has(g)) map.set(g, [])
          map.get(g).push(c)
        }
        return Array.from(map.entries()).sort((a, b) => {
          if (a[0] === '') return 1
          if (b[0] === '') return -1
          return a[0].localeCompare(b[0])
        })
      }, [conns])

      const connCfg = active ? { id: active.id, host: active.host, port: active.port, user: active.user, hasPassword: Boolean(active.hasPassword) } : null

      useEffect(() => { writeJSON(CONN_KEY, conns) }, [conns])
      useEffect(() => { writeJSON(TABS_KEY, tabs) }, [tabs])
      useEffect(() => { try { window.localStorage.setItem(ACTIVE_KEY, activeId) } catch (_) {} }, [activeId])

      // One-time migration: older versions kept the plaintext password in localStorage.
      // Move any such value into the Host credential store, then drop it locally.
      useEffect(() => {
        let cancelled = false
        ;(async () => {
          const legacy = conns.filter((c) => typeof c.password === 'string' && c.password)
          if (!legacy.length) return
          for (const c of legacy) {
            try { await api('/secret_set', { id: c.id, password: c.password }) } catch (_) { return }
          }
          if (cancelled) return
          setConns((prev) => prev.map((c) => {
            if (typeof c.password !== 'string' || !c.password) return c
            const { password, ...rest } = c
            return { ...rest, hasPassword: true }
          }))
        })()
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      const patchTab = useCallback((id, patch) => setTabs((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x)), [])

      const saveConn = useCallback(async () => {
        const id = editing || makeId()
        const password = form.password || ''
        // Passwords never enter localStorage: they go to the Host credential store.
        const c = {
          id,
          name: form.name.trim() || (form.user + '@' + form.host),
          host: form.host.trim() || '127.0.0.1',
          port: Number(form.port) || 3306,
          user: form.user.trim(),
          group: (form.group || '').trim(),
          hasPassword: Boolean(password) || Boolean(editing && conns.find((x) => x.id === editing)?.hasPassword),
        }
        // Store the password BEFORE selecting the connection: selecting it triggers the
        // auto-load effect, which would otherwise query the server without a credential.
        try {
          if (password) await api('/secret_set', { id, password })
          else if (editing) await api('/secret_set', { id, password: '' })
        } catch (e) { setErr(e.message); return }

        setConns((prev) => editing ? prev.map((x) => x.id === editing ? c : x) : [...prev, c])
        setActiveId(id)
        setEditing(null)
        setPing(''); setPingOk(false); setErr('')
      }, [form, editing, conns])

      const editConn = useCallback((c) => {
        setEditing(c.id)
        setForm({ name: c.name, host: c.host, port: c.port, user: c.user, password: '', group: c.group || '' })
      }, [])

      const removeConn = useCallback(async (id) => {
        if (!window.confirm(t('confirmDel'))) return
        // Clear the stored password first; a failure must abort so no secret is orphaned.
        try {
          await api('/secret_clear', { id })
        } catch (e) {
          setErr(t('secretClearFail') + (e.message ? ': ' + e.message : ''))
          return
        }
        setConns((prev) => prev.filter((c) => c.id !== id))
        if (activeId === id) { setActiveId(''); setPing(''); setDatabases([]); setTables([]) }
      }, [activeId])

      const loadServerInfo = useCallback(async () => {
        if (!connCfg) return
        setInfoLoading(true); setErr('')
        try {
          const d = await api('/info', { connection: connCfg })
          setServerInfo(d.info || null)
        } catch (e) { setErr(t('infoFail') + (e.message ? ': ' + e.message : '')); setServerInfo(null) }
        finally { setInfoLoading(false) }
      }, [connCfg])

      const testConn = useCallback(async () => {
        if (!connCfg) return
        setBusy(true); setErr(''); setPing(''); setPingOk(false)
        try {
          const d = await api('/test', { connection: connCfg })
          setPingOk(Boolean(d.ok))
          setPing(d.ok ? t('ok') : t('fail'))
        } catch (e) {
          setPingOk(false)
          setPing(t('fail') + (e.message ? ': ' + e.message : ''))
        } finally { setBusy(false) }
      }, [connCfg])

      const exportConns = useCallback(() => {
        const payload = {
          app: 'dsh-mysql-client', version: 1,
          exportedAt: new Date().toISOString(),
          // Passwords are never exported: they only live in the Host credential store.
          connections: conns.map(({ id, ...rest }) => ({ ...rest, password: '', hasPassword: Boolean(rest.hasPassword) })),
        }
        try {
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = 'mysql-connections.json'
          document.body.appendChild(a); a.click(); a.remove()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          setErr(fmt(t('exported'), { n: conns.length }))
        } catch (e) { setErr(e.message) }
      }, [conns])

      const importConns = useCallback(async (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          const list = Array.isArray(data) ? data : (data && Array.isArray(data.connections) ? data.connections : null)
          if (!list) { setErr(t('importFail')); return }
          const pending = []
          const clean = list.filter((x) => x && x.host).map((x) => {
            const id = makeId()
            const pwd = typeof x.password === 'string' ? x.password : ''
            if (pwd) pending.push({ id, password: pwd })
            return {
              id,
              name: x.name || ((x.user || 'root') + '@' + x.host),
              host: String(x.host),
              port: Number(x.port) || 3306,
              user: x.user || 'root',
              group: (x.group || '').trim(),
              hasPassword: Boolean(pwd) || Boolean(x.hasPassword),
            }
          })
          if (!clean.length) { setErr(t('importFail')); return }
          if (!window.confirm(t('confirmImport'))) return
          // Move any passwords carried by the file into the Host credential store.
          for (const item of pending) {
            try { await api('/secret_set', item) } catch (_) {}
          }
          setConns((prev) => [...prev, ...clean])
          setActiveId(clean[0].id)
          setErr(fmt(t('importOk'), { n: clean.length }))
        } catch (_) { setErr(t('importFail')) }
        e.target.value = ''
      }, [])

      const loadDatabases = useCallback(async (cfgOverride) => {
        const cfg = cfgOverride || connCfg
        if (!cfg) return
        const silent = Boolean(cfg && cfg.silent)
        const payload = { id: cfg.id, host: cfg.host, port: cfg.port, user: cfg.user, hasPassword: cfg.hasPassword }
        setBusy(true); if (!silent) setErr('')
        try {
          const d = await api('/databases', { connection: payload })
          setDatabases(d.databases || [])
        } catch (e) { if (!silent) setErr(e.message) }
        finally { setBusy(false) }
      }, [connCfg])

      const createDatabase = useCallback(async () => {
        const name = (newDbName || '').trim()
        if (!/^[A-Za-z0-9_]+$/.test(name)) { setErr(t('invalidDbName')); return }
        if (!connCfg) return
        setBusy(true); setErr('')
        try {
          await api('/createDatabase', { connection: connCfg, name, charset: newDbCharset })
          setNewDbOpen(false); setNewDbName('')
          await loadDatabases()
          setErr(fmt(t('createDbOk'), { name }))
          // Auto-select the new database in the active tab.
          if (tab) patchTab(tab.id, { database: name })
        } catch (e) { setErr(t('createDbFail') + (e.message ? ': ' + e.message : '')) }
        finally { setBusy(false) }
      }, [connCfg, newDbName, newDbCharset, loadDatabases, tab, patchTab])

      // ---- user management -------------------------------------------------
      const openDbMgmt = useCallback(() => {
        setNewDbName(''); setNewDbCharset('utf8mb4'); setNewDbOpen(true)
        loadDatabases()
      }, [loadDatabases])

      const doDropDatabase = useCallback(async (name) => {
        if (!connCfg) return
        setBusy(true); setErr('')
        try {
          await api('/dropDatabase', { connection: connCfg, name })
          setErr(fmt(t('dropDbOk'), { name }))
          await loadDatabases()
          // If the dropped database was selected, clear it in all tabs.
          setTabs((prev) => prev.map((x) => x.database === name ? { ...x, database: '' } : x))
        } catch (e) { setErr((t('dropDb') || '删除失败') + (e.message ? ': ' + e.message : '')) }
        finally { setBusy(false) }
      }, [connCfg, loadDatabases])

      const askDropDatabase = useCallback((name) => {
        setConfirmDialog({ message: fmt(t('confirmDropDb'), { name }), onConfirm: () => doDropDatabase(name) })
      }, [doDropDatabase])

      const loadUsers = useCallback(async () => {
        if (!connCfg) return
        setBusy(true); setErr('')
        try {
          const d = await api('/users', { connection: connCfg })
          setUsers(d.users || [])
        } catch (e) { setErr(t('userFail') + (e.message ? ': ' + e.message : '')) }
        finally { setBusy(false) }
      }, [connCfg])

      const openUserMgmt = useCallback(() => {
        setUserForm({ account: '', password: '', privileges: 'ALL PRIVILEGES', database: '' })
        setUserMode('create')
        setUserMgmtOpen(true)
        loadUsers()
      }, [loadUsers])

      const userAction = useCallback(async (route, payload, okMsg) => {
        if (!connCfg) return
        setBusy(true); setErr('')
        try {
          await api(route, { connection: connCfg, ...payload })
          setErr(okMsg || t('userOk'))
          await loadUsers()
          return true
        } catch (e) { setErr(t('userFail') + (e.message ? ': ' + e.message : '')); return false }
        finally { setBusy(false) }
      }, [connCfg, loadUsers])

      // Auto-load databases whenever the selected connection changes.
      const autoDbKey = activeId + '|' + (active ? active.host + ':' + active.port + ':' + active.user : '')
      useEffect(() => {
        if (!active) { setDatabases([]); setTables([]); return }
        // Silent on failure: this runs implicitly on selection, so surfacing an error
        // banner here (e.g. a brand-new connection) would be noise. The explicit
        // "Databases" button reports failures instead.
        loadDatabases({ id: active.id, host: active.host, port: active.port, user: active.user, silent: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [autoDbKey])

      const loadTables = useCallback(async (db) => {
        if (!connCfg || !db) { setTables([]); return }
        setErr('')
        try {
          const d = await api('/tables', { connection: connCfg, database: db })
          setTables(d.tables || [])
        } catch (e) { setErr(e.message); setTables([]) }
      }, [connCfg])

      const addTab = useCallback(() => {
        const id = makeId()
        setTabs((prev) => [...prev, { id, title: 'Query ' + (prev.length + 1), sql: '', database: '', result: null, message: '' }])
        setActiveTab(id)
      }, [])

      const closeTab = useCallback((id) => {
        setTabs((prev) => {
          const next = prev.filter((x) => x.id !== id)
          if (activeTab === id) setActiveTab(next.length ? next[next.length - 1].id : '')
          return next
        })
      }, [activeTab])

      const runSql = useCallback(async () => {
        if (!connCfg || !tab || !tab.sql.trim()) return
        setBusy(true); setErr('')
        try {
          const d = await api('/query', { connection: connCfg, database: tab.database, sql: tab.sql })
          patchTab(tab.id, {
            result: { columns: d.columns || [], rows: d.rows || [], truncated: !!d.truncated },
            message: d.message || t('affected'),
          })
          if (tab.database) loadTables(tab.database)
        } catch (e) {
          setErr(e.message)
          patchTab(tab.id, { result: null, message: t('error') + ': ' + e.message })
        }
        finally { setBusy(false) }
      }, [connCfg, tab, patchTab, loadTables])

      // ---- table structure management ----
      const qid = (s) => '`' + String(s).replace(/`/g, '``') + '`'
      const dbNow = () => (tab && tab.database) || ''

      const loadStructure = useCallback(async (tableName) => {
        const db = (tab && tab.database) || ''
        if (!connCfg || !db || !tableName) return
        setStructTable(tableName)
        setBusy(true); setErr('')
        try {
          const d = await api('/describe', { connection: connCfg, database: db, table: tableName })
          setStructColumns(d.columns || [])
          const first = (d.columns || [])[0]
          if (first) setFieldForm({
            name: first.field, type: (first.type || 'VARCHAR').split('(')[0].toUpperCase(),
            len: (first.type.match(/\(([^)]+)\)/) || [])[1] || '255',
            notNull: first.nullable === 'NO', def: first.default || '',
            comment: '', primary: first.key === 'PRI', autoInc: /auto_increment/i.test(first.extra),
          })
          // load indexes alongside columns
          try {
            const ix = await api('/indexes', { connection: connCfg, database: db, table: tableName })
            setIndexes(ix.indexes || [])
          } catch (_) { setIndexes([]) }
        } catch (e) { setErr(e.message); setStructColumns([]) }
        finally { setBusy(false) }
      }, [connCfg, tab])

      const columnDef = useCallback((f, includeName) => {
        const type = String(f.type || 'VARCHAR').toUpperCase()
        const withLen = ['VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC', 'INT', 'BIGINT', 'TINYINT', 'TEXT', 'BLOB'].indexOf(type) >= 0 && f.len
          ? type + '(' + f.len + ')' : type
        let def = (includeName ? qid(f.name) + ' ' : '') + withLen
        if (f.notNull) def += ' NOT NULL'
        else def += ' NULL'
        if (f.autoInc) def += ' AUTO_INCREMENT'
        if (f.def !== '' && f.def != null && !f.autoInc) def += ' DEFAULT ' + (/^(NULL|CURRENT_TIMESTAMP)$/i.test(String(f.def)) ? String(f.def) : "'" + String(f.def).replace(/'/g, "''") + "'")
        if (f.comment) def += " COMMENT '" + String(f.comment).replace(/'/g, "''") + "'"
        if (f.primary) def += ' PRIMARY KEY'
        return def
      }, [])

      const execStructureSql = useCallback(async (sql) => {
        const db = dbNow()
        if (!connCfg || !db || !sql) return
        setBusy(true); setErr('')
        try {
          const d = await api('/query', { connection: connCfg, database: db, sql })
          if (d.error) throw new Error(d.error)
          patchTab(tab.id, { message: t('affected') + ' · ' + (d.message || ''), result: (d.columns && d.columns.length) ? { columns: d.columns, rows: d.rows, truncated: d.truncated } : null })
          await loadStructure(structTable)
        } catch (e) { setErr(e.message) }
        finally { setBusy(false) }
      }, [connCfg, tab, dbNow, loadStructure, structTable, patchTab])

      const addField = useCallback(() => {
        if (!structTable || !fieldForm.name.trim()) return
        const db = dbNow()
        const sql = 'ALTER TABLE ' + qid(db) + '.' + qid(structTable) + ' ADD COLUMN ' + columnDef(fieldForm, true)
        execStructureSql(sql)
      }, [structTable, fieldForm, dbNow, columnDef, execStructureSql])

      const modifyField = useCallback((oldCol) => {
        if (!structTable || !oldCol || !oldCol.field) return
        const db = dbNow()
        const sql = 'ALTER TABLE ' + qid(db) + '.' + qid(structTable) + ' MODIFY COLUMN ' + columnDef(fieldForm, true)
        execStructureSql(sql)
      }, [structTable, dbNow, columnDef, execStructureSql])

      const dropField = useCallback((col) => {
        if (!structTable || !col) return
        if (!window.confirm(t('confirmDropField'))) return
        const db = dbNow()
        const sql = 'ALTER TABLE ' + qid(db) + '.' + qid(structTable) + ' DROP COLUMN ' + qid(col.field)
        execStructureSql(sql)
      }, [structTable, dbNow, execStructureSql])

      // ---- index management ----
      const addIndex = useCallback(() => {
        if (!structTable || !indexForm.name.trim() || !indexForm.columns.trim()) return
        const db = dbNow()
        const cols = indexForm.columns.split(',').map((s) => qid(s.trim())).filter((s) => s !== '``').join(', ')
        if (!cols) return
        const uniq = indexForm.unique ? 'UNIQUE ' : ''
        const sql = 'ALTER TABLE ' + qid(db) + '.' + qid(structTable) + ' ADD ' + uniq + 'INDEX ' + qid(indexForm.name.trim()) + ' (' + cols + ') USING ' + indexForm.type
        execStructureSql(sql)
        setIndexForm({ name: '', columns: '', unique: false, type: 'BTREE' })
      }, [structTable, indexForm, dbNow, execStructureSql])

      const dropIndex = useCallback((ix) => {
        if (!structTable || !ix) return
        if (!window.confirm(t('confirmDropIndex'))) return
        const db = dbNow()
        const sql = 'ALTER TABLE ' + qid(db) + '.' + qid(structTable) + ' DROP INDEX ' + qid(ix.name)
        execStructureSql(sql)
      }, [structTable, dbNow, execStructureSql])

      // ---- export results ----
      const download = useCallback((filename, content, mime) => {
        try {
          const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = filename
          document.body.appendChild(a); a.click(); a.remove()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        } catch (e) { setErr(e.message) }
      }, [])

      const runExplain = useCallback(async () => {
        if (!connCfg || !tab || !tab.sql.trim()) return
        setBusy(true); setErr('')
        try {
          const d = await api('/explain', { connection: connCfg, database: tab.database, sql: tab.sql })
          patchTab(tab.id, {
            result: { columns: d.columns || [], rows: d.rows || [], truncated: !!d.truncated },
            message: t('explainDone'),
          })
        } catch (e) {
          setErr(e.message)
          patchTab(tab.id, { result: null, message: t('error') + ': ' + e.message })
        } finally { setBusy(false) }
      }, [connCfg, tab, patchTab])

      const exportCsv = useCallback(() => {
        if (!tab || !tab.result || !tab.result.columns.length) return
        const esc = (v) => {
          const s = v == null ? '' : String(v)
          return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
        }
        const lines = [tab.result.columns.map(esc).join(',')]
        for (const row of tab.result.rows) lines.push(row.map(esc).join(','))
        download((tab.title || 'result').replace(/[^\w\u4e00-\u9fa5-]/g, '_') + '.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8')
      }, [tab, download])

      const exportSql = useCallback(() => {
        if (!tab || !tab.result || !tab.result.columns.length) return
        const table = structTable || 'exported_table'
        const esc = (v) => v == null ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'"
        const cols = tab.result.columns.map(qid).join(', ')
        const lines = tab.result.rows.map((row) =>
          'INSERT INTO ' + qid(table) + ' (' + cols + ') VALUES (' + row.map(esc).join(', ') + ');'
        )
        download((structTable || 'result').replace(/[^\w\u4e00-\u9fa5-]/g, '_') + '.sql', lines.join('\n'), 'application/sql;charset=utf-8')
      }, [tab, structTable, download])

      const goBack = useCallback(() => {
        const layout = ctx && ctx.layout
        if (!layout || typeof layout.selectPanel !== 'function') return
        try { layout.selectPanel(null) } catch (_) {
          try { layout.selectPanel('conversation') } catch (_) {}
        }
      }, [ctx])

      const infoRow = (labelKey, value) =>
        h('div', { className: 'dshMy-infoRow' },
          h('span', { className: 'dshMy-infoLabel' }, t(labelKey)),
          h('span', { className: 'dshMy-infoValue' }, value != null && value !== '' ? String(value) : '-')
        )

      const formRow = (label, key, type) =>
        h('label', { className: 'dshMy-field' },
          h('span', null, t(label)),
          h('input', {
            className: 'dshMy-input', type: type || 'text', value: form[key],
            onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
          })
        )

      const resultTable = tab && tab.result && tab.result.columns.length
        ? h('div', { className: 'dshMy-tableWrap' },
            h('table', { className: 'dshMy-table' },
              h('thead', null, h('tr', null,
                h('th', null, '#'),
                tab.result.columns.map((c, i) => h('th', { key: i }, c))
              )),
              h('tbody', null, tab.result.rows.map((row, ri) =>
                h('tr', { key: ri },
                  h('td', { className: 'dshMy-idx' }, ri + 1),
                  row.map((cell, ci) => h('td', { key: ci, title: cell == null ? '' : String(cell) }, cell == null ? 'NULL' : String(cell)))
                )
              ))
            ),
            tab.result.truncated ? h('div', { className: 'dshMy-note' }, fmt(t('truncated'), { n: tab.result.rows.length })) : null
          )
        : h('div', { className: 'dshMy-note' }, tab && tab.message ? tab.message : t('noTab'))

      return h('div', { className: 'dshMy-root' + (sideCollapsed ? ' dshMy-sideOff' : '') },
        h('div', { className: 'dshMy-head' },
          h('div', null,
            h('div', { className: 'dshMy-title' }, t('title')),
            h('div', { className: 'dshMy-sub' }, t('subtitle'))
          ),
          h('div', { className: 'dshMy-headActions' },
            h('button', { type: 'button', className: 'dshMy-back', title: sideCollapsed ? t('expandSide') : t('collapseSide'), onClick: () => setSideCollapsed((v) => !v) }, sideCollapsed ? '»' : '«'),
            h('button', { type: 'button', className: 'dshMy-back', onClick: goBack }, t('back'))
          )
        ),
        err ? h('div', { className: 'dshMy-err' }, err) : null,
        h('div', { className: 'dshMy-cols', style: sideCollapsed ? { gridTemplateColumns: 'minmax(0,1fr)' } : undefined },
          // left: connections + query tabs
          h('div', { className: 'dshMy-col', style: sideCollapsed ? { display: 'none' } : undefined },
            h('div', { className: 'dshMy-card' },
              h('div', { className: 'dshMy-cardTitle' }, t('connections')),
              h('div', { className: 'dshMy-connList' },
                conns.length === 0
                  ? h('div', { className: 'dshMy-note' }, t('noConn'))
                  : grouped.map(([groupName, list]) => {
                      const gkey = groupName || '__ungrouped__'
                      const isCollapsed = Boolean(collapsed[gkey])
                      return h('div', { key: gkey, className: 'dshMy-group' },
                        h('div', {
                          className: 'dshMy-groupHead',
                          onClick: () => setCollapsed((prev) => ({ ...prev, [gkey]: !prev[gkey] })),
                        },
                          h('span', { className: 'dshMy-groupArrow' }, isCollapsed ? '▸' : '▾'),
                          h('span', { className: 'dshMy-groupName' },
                            (groupName || t('ungrouped')),
                            h('span', { className: 'dshMy-groupCount' }, ' (' + list.length + ')')
                          )
                        ),
                        isCollapsed ? null : list.map((c) =>
                          h('div', {
                            key: c.id,
                            className: 'dshMy-conn' + (activeId === c.id ? ' dshMy-connOn' : ''),
                            onClick: () => { setActiveId(c.id); setPing(''); setPingOk(false); setDatabases([]); setTables([]) },
                          },
                            h('span', { className: 'dshMy-name' }, c.name),
                            h('span', { className: 'dshMy-addr' }, `${c.user}@${c.host}:${c.port}`),
                            c.hasPassword ? h('span', { className: 'dshMy-lock', title: t('pwdSaved') }, '🔒') : null,
                            h('button', { type: 'button', className: 'dshMy-mini', onClick: (e) => { e.stopPropagation(); editConn(c) } }, t('edit')),
                            h('button', { type: 'button', className: 'dshMy-mini dshMy-del', onClick: (e) => { e.stopPropagation(); removeConn(c.id) } }, '×')
                          )
                        )
                      )
                    })
              ),
              h('div', { className: 'dshMy-btnGrid' },
                h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', onClick: () => { setEditing(null); setForm({ name: '', host: '127.0.0.1', port: 3306, user: 'root', password: '', group: '' }) } }, '+ ' + t('newConn')),
                h('button', { type: 'button', className: 'dshMy-btn', disabled: !active || busy, onClick: testConn }, t('test')),
                h('button', { type: 'button', className: 'dshMy-btn', disabled: !active || busy || infoLoading, onClick: serverInfo ? () => setServerInfo(null) : loadServerInfo }, infoLoading ? '...' : (serverInfo ? t('infoClose') : t('serverInfo'))),
                active ? h('button', { type: 'button', className: 'dshMy-btn', disabled: busy, onClick: () => loadDatabases() }, t('databases')) : h('span'),
                h('button', { type: 'button', className: 'dshMy-btn', disabled: !active, title: t('dbMgmt'), onClick: openDbMgmt }, t('dbMgmt')),
                h('button', { type: 'button', className: 'dshMy-btn', disabled: !active, title: t('userMgmt'), onClick: openUserMgmt }, t('userMgmt')),
                h('button', { type: 'button', className: 'dshMy-btn', title: t('export'), onClick: exportConns }, t('export')),
                h('button', { type: 'button', className: 'dshMy-btn', title: t('import'), onClick: () => fileRef.current && fileRef.current.click() }, t('import'))
              ),
              h('input', { ref: fileRef, type: 'file', accept: '.json,application/json', style: { display: 'none' }, onChange: importConns }),
              ping ? h('div', { className: 'dshMy-ping ' + (pingOk ? 'dshMy-pingOk' : 'dshMy-pingFail') }, ping) : null,
              serverInfo
                ? h('div', { className: 'dshMy-infoPanel' },
                    h('div', { className: 'dshMy-infoTitle' }, t('serverInfo')),
                    h('div', { className: 'dshMy-infoGrid' },
                      infoRow('infoVersion', serverInfo.version),
                      infoRow('infoEdition', serverInfo.edition),
                      infoRow('infoHost', serverInfo.host),
                      infoRow('infoPort', serverInfo.port),
                      infoRow('infoUser', serverInfo.user),
                      infoRow('infoOs', serverInfo.os),
                      infoRow('infoArch', serverInfo.arch),
                      infoRow('infoDatadir', serverInfo.datadir),
                      infoRow('infoCharset', serverInfo.charset),
                      infoRow('infoUptime', serverInfo.uptime),
                      infoRow('infoConnections', serverInfo.connections),
                      infoRow('infoThreads', serverInfo.threads),
                      infoRow('infoMaxConn', serverInfo.maxConnections),
                      infoRow('infoQueries', serverInfo.queries),
                      infoRow('infoSlowQueries', serverInfo.slowQueries)
                    )
                  )
                : null
            ),
            h('div', { className: 'dshMy-card' },
              h('div', {
                className: 'dshMy-cardTitle dshMy-cardToggle',
                title: formCollapsed ? t('expand') : t('collapse'),
                onClick: () => setFormCollapsed((v) => !v),
              },
                h('span', { className: 'dshMy-toggleArrow' }, formCollapsed ? '▸' : '▾'),
                formCollapsed ? t('newConn') : (editing ? t('edit') : t('newConn'))
              ),
              formCollapsed ? null : h('div', { className: 'dshMy-form' },
                formRow('name', 'name'), formRow('host', 'host'),
                formRow('port', 'port', 'number'), formRow('user', 'user'), formRow('password', 'password', 'password'),
                h('label', { className: 'dshMy-field' },
                  h('span', null, t('group')),
                  h('input', {
                    className: 'dshMy-input', list: 'dshMy-groupOptions', value: form.group || '',
                    placeholder: t('groupPlaceholder'),
                    onChange: (e) => setForm((f) => ({ ...f, group: e.target.value })),
                  }),
                  h('datalist', { id: 'dshMy-groupOptions' },
                    Array.from(new Set(conns.map((c) => (c.group || '').trim()).filter(Boolean))).map((g) => h('option', { key: g, value: g }))
                  )
                ),
                h('div', { className: 'dshMy-note' }, editing ? t('pwdEmpty') : t('pwdHint')),
                h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', onClick: saveConn }, t('save'))
              )
            ),
            h('div', { className: 'dshMy-card dshMy-grow dshMy-queries' },
              h('div', { className: 'dshMy-cardTitle' }, t('queries')),
              h('input', {
                className: 'dshMy-input dshMy-tabSearch', type: 'text',
                value: tabSearch, placeholder: t('searchPlaceholder'),
                onChange: (e) => setTabSearch(e.target.value),
              }),
              h('div', { className: 'dshMy-tabs' },
                tabs.length === 0
                  ? h('div', { className: 'dshMy-note' }, t('noTab'))
                  : filteredTabs.length === 0
                    ? h('div', { className: 'dshMy-note' }, t('noTab'))
                    : filteredTabs.map((x) =>
                        h('div', {
                          key: x.id,
                          className: 'dshMy-tab' + (activeTab === x.id ? ' dshMy-tabOn' : ''),
                          onClick: () => setActiveTab(x.id),
                        },
                          editingTab === x.id
                            ? h('input', {
                                className: 'dshMy-input dshMy-tabEdit', autoFocus: true,
                                value: x.title, placeholder: t('tabNamePlaceholder'),
                                onClick: (e) => e.stopPropagation(),
                                onChange: (e) => patchTab(x.id, { title: e.target.value }),
                                onBlur: () => setEditingTab(''),
                                onKeyDown: (e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTab('') },
                              })
                            : h('span', {
                                title: t('renameTab') + ' (双击)',
                                onDoubleClick: (e) => { e.stopPropagation(); setEditingTab(x.id) },
                              }, x.title),
                          h('button', {
                            type: 'button', className: 'dshMy-mini', title: t('renameTab'),
                            onClick: (e) => { e.stopPropagation(); setEditingTab(x.id) },
                          }, '✎'),
                          h('button', { type: 'button', className: 'dshMy-mini', onClick: (e) => { e.stopPropagation(); closeTab(x.id) } }, '×')
                        )
                      )
              ),
              h('button', { type: 'button', className: 'dshMy-btn', onClick: addTab }, '+ ' + t('newTab'))
            )
          ),
          // right: query editor + result
          h('div', { className: 'dshMy-col dshMy-main' },
            tab
              ? h('div', { className: 'dshMy-card dshMy-grow' },
                  h('div', { className: 'dshMy-toolbar' },
                    h('span', null, t('db') + '：'),
                    h('select', {
                      className: 'dshMy-select', value: tab.database,
                      onChange: (e) => { patchTab(tab.id, { database: e.target.value }); loadTables(e.target.value) },
                    },
                      h('option', { value: '' }, '-'),
                      databases.map((db) => h('option', { key: db, value: db }, db))
                    ),
                    h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', disabled: busy || !connCfg, onClick: runSql }, t('run')),
                    h('button', { type: 'button', className: 'dshMy-btn', disabled: busy || !connCfg || !tab.sql.trim(), title: t('explain'), onClick: runExplain }, t('explain'))
                  ),
                  h('textarea', {
                    className: 'dshMy-sql', value: tab.sql, spellCheck: false,
                    placeholder: t('sqlPlaceholder'),
                    onChange: (e) => patchTab(tab.id, { sql: e.target.value }),
                    onKeyDown: (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runSql() } },
                  }),
                  tables.length
                    ? h('div', { className: 'dshMy-tables' },
                        h('span', { className: 'dshMy-cardTitle' }, t('tables') + ':'),
                        tables.map((tb) =>
                          h('span', { key: tb, className: 'dshMy-chipWrap' },
                            h('button', {
                              type: 'button', className: 'dshMy-chip',
                              onClick: () => patchTab(tab.id, { sql: `SELECT * FROM \`${tb}\` LIMIT 100;` }),
                            }, tb),
                            h('button', {
                              type: 'button', className: 'dshMy-chip dshMy-chipStruct',
                              title: t('structure'),
                              onClick: () => loadStructure(tb),
                            }, '⚙')
                          )
                        )
                      )
                    : null,
                  h('div', { className: 'dshMy-toolbar dshMy-resultBar' },
                    h('span', { className: 'dshMy-cardTitle' }, t('result') + (tab.result ? ' · ' + fmt(t('rows'), { n: tab.result.rows.length }) : '')),
                    h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm', disabled: !tab.result || !tab.result.columns.length, onClick: exportCsv }, t('exportCsv')),
                    h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm', disabled: !tab.result || !tab.result.columns.length, onClick: exportSql }, t('exportSql'))
                  ),
                  resultTable
                )
              : h('div', { className: 'dshMy-card dshMy-grow dshMy-empty' }, t('noTab')),
          // structure panel: shown when a table is selected for editing
          structTable
            ? h('div', { className: 'dshMy-card dshMy-struct' },
                h('div', { className: 'dshMy-toolbar' },
                  h('span', { className: 'dshMy-cardTitle' }, t('structureTitle') + ': ' + structTable),
                  h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm' + (structTab === 'columns' ? ' dshMy-tabOn' : ''), onClick: () => setStructTab('columns') }, t('tabColumns')),
                  h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm' + (structTab === 'indexes' ? ' dshMy-tabOn' : ''), onClick: () => setStructTab('indexes') }, t('tabIndexes')),
                  h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm', onClick: () => setStructTable('') }, '×')
                ),
                structTab === 'columns'
                  ? h('div', null,
                      structColumns.length
                        ? h('div', { className: 'dshMy-structList' },
                            structColumns.map((c) =>
                              h('div', { key: c.field, className: 'dshMy-structRow' },
                                h('span', { className: 'dshMy-sf' }, c.field),
                                h('span', { className: 'dshMy-st' }, c.type),
                                c.key ? h('span', { className: 'dshMy-sk' }, c.key) : null,
                                h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm',
                                  onClick: () => setFieldForm({ name: c.field, type: (c.type || 'VARCHAR').split('(')[0].toUpperCase(), len: (c.type.match(/\(([^)]+)\)/) || [])[1] || '255', notNull: c.nullable === 'NO', def: c.default || '', comment: '', primary: c.key === 'PRI', autoInc: /auto_increment/i.test(c.extra) }),
                                }, t('modifyField')),
                                h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm dshMy-del', onClick: () => dropField(c) }, t('dropField'))
                              )
                            )
                          )
                        : h('div', { className: 'dshMy-note' }, t('noStructure')),
                      h('div', { className: 'dshMy-structForm' },
                        h('input', { className: 'dshMy-input', value: fieldForm.name, placeholder: t('fieldName'), onChange: (e) => setFieldForm((f) => ({ ...f, name: e.target.value })) }),
                        h('input', { className: 'dshMy-input dshMy-typeInput', value: fieldForm.type, placeholder: t('fieldType'), onChange: (e) => setFieldForm((f) => ({ ...f, type: e.target.value })) }),
                        h('input', { className: 'dshMy-input dshMy-lenInput', value: fieldForm.len, placeholder: t('fieldLen'), onChange: (e) => setFieldForm((f) => ({ ...f, len: e.target.value })) }),
                        h('label', { className: 'dshMy-cb' }, h('input', { type: 'checkbox', checked: fieldForm.notNull, onChange: (e) => setFieldForm((f) => ({ ...f, notNull: e.target.checked })) }), t('notNull')),
                        h('label', { className: 'dshMy-cb' }, h('input', { type: 'checkbox', checked: fieldForm.primary, onChange: (e) => setFieldForm((f) => ({ ...f, primary: e.target.checked })) }), t('primary')),
                        h('label', { className: 'dshMy-cb' }, h('input', { type: 'checkbox', checked: fieldForm.autoInc, onChange: (e) => setFieldForm((f) => ({ ...f, autoInc: e.target.checked })) }), t('autoInc')),
                        h('input', { className: 'dshMy-input', value: fieldForm.def, placeholder: t('defaultValue'), onChange: (e) => setFieldForm((f) => ({ ...f, def: e.target.value })) }),
                        h('input', { className: 'dshMy-input', value: fieldForm.comment, placeholder: t('comment'), onChange: (e) => setFieldForm((f) => ({ ...f, comment: e.target.value })) }),
                        h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', disabled: busy || !fieldForm.name.trim(), onClick: addField }, '+ ' + t('addField')),
                        h('button', { type: 'button', className: 'dshMy-btn', disabled: busy || !fieldForm.name.trim(), onClick: () => modifyField(structColumns.find((c) => c.field === fieldForm.name)) }, t('modifyField'))
                      )
                    )
                  : h('div', null,
                      indexes.length
                        ? h('div', { className: 'dshMy-structList' },
                            indexes.map((ix) =>
                              h('div', { key: ix.name, className: 'dshMy-structRow' },
                                h('span', { className: 'dshMy-sf' }, ix.name),
                                h('span', { className: 'dshMy-st' }, ix.columns.join(', ') + ' · ' + ix.type + (ix.unique ? ' · UNIQUE' : '')),
                                h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm dshMy-del', onClick: () => dropIndex(ix) }, t('dropIndex'))
                              )
                            )
                          )
                        : h('div', { className: 'dshMy-note' }, t('noIndexes')),
                      h('div', { className: 'dshMy-structForm' },
                        h('input', { className: 'dshMy-input', value: indexForm.name, placeholder: t('indexName'), onChange: (e) => setIndexForm((f) => ({ ...f, name: e.target.value })) }),
                        h('input', { className: 'dshMy-input', value: indexForm.columns, placeholder: t('indexColumns'), onChange: (e) => setIndexForm((f) => ({ ...f, columns: e.target.value })) }),
                        h('label', { className: 'dshMy-cb' }, h('input', { type: 'checkbox', checked: indexForm.unique, onChange: (e) => setIndexForm((f) => ({ ...f, unique: e.target.checked })) }), t('unique')),
                        h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', disabled: busy || !indexForm.name.trim() || !indexForm.columns.trim(), onClick: addIndex }, '+ ' + t('addIndex'))
                      )
                    )
              )
            : null
          ),

          // database management modal
          newDbOpen
            ? h('div', { className: 'dshMy-modalMask', onClick: () => setNewDbOpen(false) },
                h('div', { className: 'dshMy-modal dshMy-modalWide', onClick: (e) => e.stopPropagation() },
                  h('div', { className: 'dshMy-modalTitle' }, t('dbMgmt')),
                  h('div', { className: 'dshMy-userToolbar' },
                    h('input', {
                      className: 'dshMy-input dshMy-listSearch', type: 'text', value: dbSearch,
                      placeholder: t('searchPlaceholder'), onChange: (e) => setDbSearch(e.target.value),
                    }),
                    h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm', disabled: busy, onClick: () => loadDatabases() }, '↻ ' + t('refreshDbs'))
                  ),
                  h('div', { className: 'dshMy-userList' },
                    databases.filter((db) => String(db).toLowerCase().includes(dbSearch.trim().toLowerCase())).length
                      ? databases.filter((db) => String(db).toLowerCase().includes(dbSearch.trim().toLowerCase())).map((db) =>
                          h('div', { key: db, className: 'dshMy-userRow' },
                            h('span', { className: 'dshMy-userName' }, db),
                            h('button', {
                              type: 'button', className: 'dshMy-btn dshMy-btnSm dshMy-del', disabled: busy,
                              onClick: () => askDropDatabase(db),
                            }, t('dropDb'))
                          )
                        )
                      : h('div', { className: 'dshMy-note' }, databases.length ? t('searchPlaceholder') : t('noDbs'))
                  ),
                  h('div', { className: 'dshMy-userForm' },
                    h('div', { className: 'dshMy-modalTitle' }, t('newDb')),
                    h('label', { className: 'dshMy-field' },
                      h('span', null, t('dbName')),
                      h('input', {
                        className: 'dshMy-input', value: newDbName,
                        placeholder: t('dbNamePlaceholder'),
                        onChange: (e) => setNewDbName(e.target.value),
                        onKeyDown: (e) => { if (e.key === 'Enter') createDatabase() },
                      })
                    ),
                    h('label', { className: 'dshMy-field' },
                      h('span', null, t('dbCharset')),
                      h('select', { className: 'dshMy-select', value: newDbCharset, onChange: (e) => setNewDbCharset(e.target.value) },
                        ['utf8mb4', 'utf8', 'latin1', 'gbk'].map((cs) => h('option', { key: cs, value: cs }, cs))
                      )
                    ),
                    h('div', { className: 'dshMy-modalActions' },
                      h('button', { type: 'button', className: 'dshMy-btn', onClick: () => setNewDbOpen(false) }, t('cancel')),
                      h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', disabled: busy || !newDbName.trim(), onClick: createDatabase }, t('createDb'))
                    )
                  )
                )
              )
            : null,

          // user-management modal
          userMgmtOpen
            ? h('div', { className: 'dshMy-modalMask', onClick: () => setUserMgmtOpen(false) },
                h('div', { className: 'dshMy-modal dshMy-modalWide', onClick: (e) => e.stopPropagation() },
                  h('div', { className: 'dshMy-modalTitle' }, t('userMgmt')),
                  h('div', { className: 'dshMy-userToolbar' },
                    h('input', {
                      className: 'dshMy-input dshMy-listSearch', type: 'text', value: userSearch,
                      placeholder: t('searchPlaceholder'), onChange: (e) => setUserSearch(e.target.value),
                    }),
                    h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm', disabled: busy, onClick: loadUsers }, '↻ ' + t('refreshUsers'))
                  ),
                  h('div', { className: 'dshMy-userList' },
                    users.filter((u) => (u.user + '@' + u.host).toLowerCase().includes(userSearch.trim().toLowerCase())).length
                      ? users.filter((u) => (u.user + '@' + u.host).toLowerCase().includes(userSearch.trim().toLowerCase())).map((u) => {
                          const account = u.user + '@' + u.host
                          return h('div', { key: account, className: 'dshMy-userRow' },
                            h('div', { className: 'dshMy-userInfo' },
                              h('span', { className: 'dshMy-userName' }, account),
                              h('span', { className: 'dshMy-userMeta' },
                                (u.locked === 'Y' ? t('accountLocked') + ' · ' : '') + (u.expired === 'Y' ? t('accountExpired') : '')
                              )
                            ),
                            h('div', { className: 'dshMy-userActions' },
                              h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm', disabled: busy, onClick: () => {
                                setUserMode('password'); setUserForm({ account, password: '', privileges: 'ALL PRIVILEGES', database: '' })
                              } }, t('changePwd')),
                              h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm', disabled: busy, onClick: () => {
                                setUserMode('grant'); setUserForm({ account, password: '', privileges: 'ALL PRIVILEGES', database: '' })
                              } }, t('grant')),
                              h('button', { type: 'button', className: 'dshMy-btn dshMy-btnSm dshMy-del', disabled: busy, onClick: () => {
                                setConfirmDialog({ message: t('confirmDropUser') + ' ' + account, onConfirm: () => userAction('/dropUser', { account }) })
                              } }, t('dropUser'))
                            )
                          )
                        })
                      : h('div', { className: 'dshMy-note' }, users.length ? t('searchPlaceholder') : t('noUsers'))
                  ),
                  h('div', { className: 'dshMy-userForm' },
                    h('div', { className: 'dshMy-modalTitle' },
                      userMode === 'create' ? t('newUser') : (userMode === 'password' ? t('changePwd') : t('grant'))
                    ),
                    userMode === 'grant'
                      ? null
                      : h('label', { className: 'dshMy-field' },
                          h('span', null, t('account') + ' — ' + t('accountHint')),
                          h('input', {
                            className: 'dshMy-input', value: userForm.account, placeholder: 'app@%',
                            disabled: userMode === 'password',
                            onChange: (e) => setUserForm((f) => ({ ...f, account: e.target.value })),
                          })
                        ),
                    userMode === 'grant'
                      ? h('div', { className: 'dshMy-formRow' },
                          h('input', { className: 'dshMy-input', value: userForm.privileges, placeholder: t('grantHint'), onChange: (e) => setUserForm((f) => ({ ...f, privileges: e.target.value })) }),
                          h('input', { className: 'dshMy-input', value: userForm.database, placeholder: t('grantTarget'), onChange: (e) => setUserForm((f) => ({ ...f, database: e.target.value })) })
                        )
                      : h('label', { className: 'dshMy-field' },
                          h('span', null, t('password')),
                          h('input', { className: 'dshMy-input', type: 'password', value: userForm.password, onChange: (e) => setUserForm((f) => ({ ...f, password: e.target.value })) })
                        ),
                    h('div', { className: 'dshMy-modalActions' },
                      h('button', { type: 'button', className: 'dshMy-btn', onClick: () => setUserMgmtOpen(false) }, t('cancel')),
                      userMode === 'create'
                        ? h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', disabled: busy || !userForm.account.trim(), onClick: () => userAction('/createUser', { account: userForm.account, password: userForm.password }) }, t('createUser'))
                        : (userMode === 'password'
                            ? h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', disabled: busy || !userForm.account, onClick: () => userAction('/changePassword', { account: userForm.account, password: userForm.password }) }, t('changePwd'))
                            : h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', disabled: busy || !userForm.account, onClick: () => userAction('/grantPrivileges', { account: userForm.account, privileges: userForm.privileges, database: userForm.database }) }, t('grant')))
                    )
                  )
                )
              )
            : null,

          // confirmation dialog (topmost, over the management modals)
          confirmDialog
            ? h('div', { className: 'dshMy-modalMask dshMy-confirmMask', onClick: () => setConfirmDialog(null) },
                h('div', { className: 'dshMy-modal dshMy-confirm', onClick: (e) => e.stopPropagation() },
                  h('div', { className: 'dshMy-modalTitle' }, t('confirmTitle')),
                  h('div', { className: 'dshMy-confirmMsg' }, confirmDialog.message),
                  h('div', { className: 'dshMy-modalActions' },
                    h('button', { type: 'button', className: 'dshMy-btn', onClick: () => setConfirmDialog(null) }, t('cancel')),
                    h('button', { type: 'button', className: 'dshMy-btn dshMy-btnPrimary', onClick: () => {
                      const fn = confirmDialog.onConfirm
                      setConfirmDialog(null)
                      if (fn) fn()
                    } }, t('confirmYes'))
                  )
                )
              )
            : null
        )
      )
    }

    function apply(ctx) {
      ctx.effect(() => installStyles(), 'dsh-mysql-client: styles')
      if (ctx.locale !== undefined) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mysql-client: dictionaries')
        t = ctx.locale.bind(NS)
      }
      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist', id: PANEL_ID, order: 27, label: () => t('title'), locale: NS,
      }, SidebarIcon)), 'dsh-mysql-client: sidebar entry')
      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main', key: PANEL_ID, locale: NS,
      }, (props) => h(MysqlPanel, { ctx }))), 'dsh-mysql-client: panel')
    }

    function installStyles() {
      if (typeof document === 'undefined') return () => {}
      const existing = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]')
      if (existing) return () => {}
      const style = document.createElement('style')
      style.dataset.plugin = NS
      style.dataset.pluginCss = STYLE_ID
      style.textContent = `
.dshMy-root{display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:14px 18px 18px;gap:10px;overflow:hidden;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base)}
.dshMy-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex:0 0 auto}
.dshMy-headActions{display:flex;align-items:center;gap:6px}
.dshMy-sideOff .dshMy-cols{grid-template-columns:minmax(0,1fr)}
.dshMy-sideOff .dshMy-cols > .dshMy-col:first-child{display:none}
.dshMy-title{font-size:20px;font-weight:700;line-height:1.3}
.dshMy-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:3px}
.dshMy-back{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;padding:5px 11px;border-radius:8px;cursor:pointer;font-family:inherit;white-space:nowrap}
.dshMy-err{font-size:11px;color:var(--dsw-alias-state-error-primary);flex:0 0 auto}
.dshMy-cols{display:grid;grid-template-columns:minmax(240px,320px) minmax(0,1fr);gap:12px;flex:1 1 auto;min-height:0}
.dshMy-col{display:flex;flex-direction:column;gap:10px;min-height:0;overflow-y:auto}
.dshMy-main{overflow-y:auto}
.dshMy-card{padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;gap:8px}
.dshMy-grow{flex:1 1 auto;min-height:0}
.dshMy-empty{align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);font-size:13px}
.dshMy-cardTitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dshMy-cardToggle{cursor:pointer;display:flex;align-items:center;gap:6px;user-select:none}
.dshMy-cardToggle:hover{color:var(--dsw-alias-label-primary)}
.dshMy-toggleArrow{width:10px;flex:0 0 auto;font-size:10px}
.dshMy-queries{overflow-y:auto}
.dshMy-note{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.dshMy-err{font-size:11px;color:var(--dsw-alias-state-error-primary)}
.dshMy-btn{padding:7px 11px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap}
.dshMy-btn:hover{border-color:var(--dsw-alias-brand-primary)}
.dshMy-btn:disabled{opacity:.45;cursor:not-allowed}
.dshMy-btnPrimary{background:#e48b2b;color:#fff;border-color:transparent;font-weight:600}
.dshMy-del{color:var(--dsw-alias-state-error-primary)}
.dshMy-connList{display:flex;flex-direction:column;gap:6px}
.dshMy-group{display:flex;flex-direction:column;gap:4px}
.dshMy-groupHead{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dshMy-groupHead:hover{color:var(--dsw-alias-label-primary)}
.dshMy-groupArrow{width:10px;flex:0 0 auto}
.dshMy-groupName{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshMy-groupCount{font-weight:500;font-size:10px;opacity:.65;margin-left:1px}
.dshMy-btnGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dshMy-btnGrid .dshMy-btn{width:100%;min-width:0}
.dshMy-infoPanel{margin-top:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);padding:8px 10px}
.dshMy-infoTitle{font-size:11px;font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:6px}
.dshMy-infoGrid{display:grid;grid-template-columns:1fr;gap:3px}
.dshMy-infoRow{display:flex;justify-content:space-between;gap:10px;font-size:11px;line-height:1.5}
.dshMy-infoLabel{color:var(--dsw-alias-label-secondary);flex:0 0 auto}
.dshMy-infoValue{color:var(--dsw-alias-label-primary);text-align:right;word-break:break-all;user-select:text}
.dshMy-ping{font-size:11px;line-height:1.5;font-weight:600;padding:4px 0}
.dshMy-pingOk{color:#2e7d32}
.dshMy-pingFail{color:var(--dsw-alias-state-error-primary)}
.dshMy-lock{font-size:10px;margin-left:2px}
.dshMy-conn{display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);cursor:pointer;font-size:12px;flex-wrap:wrap}
.dshMy-connOn{border-color:#e48b2b;background:var(--dsw-alias-bg-layer-2)}
.dshMy-name{font-weight:600;flex:1 1 auto}
.dshMy-addr{font-size:10px;color:var(--dsw-alias-label-secondary)}
.dshMy-mini{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer;padding:0 3px;font-family:inherit}
.dshMy-form{display:flex;flex-direction:column;gap:7px}
.dshMy-field{display:flex;flex-direction:column;gap:3px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshMy-input,.dshMy-select{padding:6px 9px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;outline:none;font-family:inherit;min-width:0}
.dshMy-input:focus,.dshMy-select:focus{border-color:var(--dsw-alias-brand-primary)}

.dshMy-tabSearch{width:100%;box-sizing:border-box;margin-bottom:5px;font-size:11px;padding:5px 8px}
.dshMy-modalMask{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
.dshMy-modal{width:min(360px,90vw);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:18px;box-shadow:0 8px 30px rgba(0,0,0,.3)}
.dshMy-modalTitle{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:14px}
.dshMy-modal .dshMy-field{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dshMy-modalActions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.dshMy-modalWide{width:min(640px,94vw);max-height:86vh;overflow-y:auto}
.dshMy-confirmMask{z-index:1100}
.dshMy-confirm{width:min(380px,90vw)}
.dshMy-confirmMsg{font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.6;word-break:break-word}
.dshMy-userToolbar{display:flex;justify-content:flex-end;margin-bottom:8px}
.dshMy-listSearch{flex:1 1 auto;min-width:0;font-size:11px;padding:5px 8px}
.dshMy-userToolbar{gap:8px;align-items:center}
.dshMy-userList{max-height:260px;overflow-y:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;margin-bottom:14px}
.dshMy-userRow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshMy-userRow:last-child{border-bottom:none}
.dshMy-userInfo{display:flex;flex-direction:column;gap:2px;min-width:0}
.dshMy-userName{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);word-break:break-all}
.dshMy-userMeta{font-size:10px;color:var(--dsw-alias-state-warning-primary,#c77800)}
.dshMy-userActions{display:flex;gap:5px;flex:0 0 auto}
.dshMy-userForm{border-top:1px solid var(--dsw-alias-border-l2);padding-top:12px}
.dshMy-userForm .dshMy-modalTitle{margin-bottom:10px}
.dshMy-formRow{display:flex;gap:8px;margin-bottom:12px}
.dshMy-formRow .dshMy-input{flex:1 1 0;min-width:0}
.dshMy-tabEdit{flex:1 1 auto;font-size:11px;padding:2px 5px;height:auto;min-width:0}
.dshMy-tabs{display:flex;flex-direction:column;gap:3px;max-height:200px;overflow-y:auto}
.dshMy-tables{max-height:120px;overflow-y:auto}
.dshMy-tab{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);font-size:12px;cursor:pointer}
.dshMy-tabOn{outline:1px solid #e48b2b}
.dshMy-tab span{flex:1 1 auto}
.dshMy-toolbar{display:flex;align-items:center;gap:7px;font-size:12px;flex-wrap:wrap}
.dshMy-sql{flex:0 0 auto;height:130px;width:100%;box-sizing:border-box;resize:vertical;padding:10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:ui-monospace,monospace;font-size:12px;line-height:1.5;outline:none}
.dshMy-sql:focus{border-color:var(--dsw-alias-brand-primary)}
.dshMy-tables{display:flex;gap:5px;flex-wrap:wrap;align-items:center}
.dshMy-chip{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:11px;padding:3px 8px;border-radius:12px;cursor:pointer;font-family:inherit}
.dshMy-tableWrap{flex:1 1 auto;min-height:120px;overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base)}
.dshMy-table{border-collapse:collapse;width:100%;font-size:11.5px;font-family:ui-monospace,monospace}
.dshMy-table th,.dshMy-table td{padding:5px 8px;text-align:left;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis}
.dshMy-table th{position:sticky;top:0;background:var(--dsw-alias-bg-layer-2);font-weight:600;z-index:1}
.dshMy-idx{color:var(--dsw-alias-label-secondary);width:34px}
.dshMy-btnSm{padding:4px 8px;font-size:11px}
.dshMy-resultBar{justify-content:flex-start}
.dshMy-chipWrap{display:inline-flex;align-items:center;gap:2px}
.dshMy-chipStruct{padding:3px 6px;border-radius:8px}
.dshMy-struct{flex:0 0 auto;min-height:180px;max-height:360px;overflow-y:auto}
.dshMy-structList{display:flex;flex-direction:column;gap:3px;max-height:200px;overflow-y:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:4px}
.dshMy-structRow{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);font-size:11.5px;flex-wrap:nowrap;min-width:0}
.dshMy-sf{font-weight:600;min-width:100px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto}
.dshMy-st{color:var(--dsw-alias-label-secondary);flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshMy-sk{flex:0 0 auto;color:var(--dsw-alias-brand-primary);font-size:10px}
.dshMy-structRow .dshMy-btn{flex:0 0 auto}
.dshMy-sk{color:var(--dsw-alias-brand-primary);font-size:10px}
.dshMy-structForm{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;align-items:center;padding-top:6px;border-top:1px solid var(--dsw-alias-border-l1)}
.dshMy-cb{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshMy-cb input{accent-color:var(--dsw-alias-brand-primary)}
@media(max-width:900px){.dshMy-cols{grid-template-columns:1fr;overflow-y:auto}.dshMy-col{overflow:visible}}
`
      document.head.appendChild(style)
      return () => { style.remove() }
    }

    return { inject: ['slots', 'locale', 'layout'], apply }
  },
})
