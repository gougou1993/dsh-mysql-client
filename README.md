# DSH MySQL Client

A MySQL client plugin for DeepSeek Harness (DSH). It adds a **MySQL Client** entry to the left sidebar: manage connections, open multiple query tabs, run and explain SQL, browse/edit table structures and indexes, and administer databases and users — all inside the Harness Web UI.

SQL execution runs on the Host through the pure-JavaScript `mysql2` driver, so **no local `mysql` CLI is required**. The target MySQL server only needs to be reachable over the network. Passwords are never stored in the browser; they live in the DSH credential store.

## Plugin Info

| Field | Value |
| --- | --- |
| Package | `@oakzhong/dsh-mysql-client` |
| Version | `1.2.4` |
| Entry | `index.js` (Host) · `client.js` (Client) |
| Type | DSH bundle plugin, ES module (`"type": "module"`, `"private": false`, public publish) |
| Sidebar entry | MySQL Client (left sidebar) |
| Description | A MySQL client with connection management, query tabs and SQL execution. |

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Client UI | React (via `window.__ModuleLoader__`) | Sidebar entry and the main React panel. |
| Host runtime | Node.js | Executes every operation through the `mysql2` driver over a connection pool. No `mysql` CLI dependency. |
| Database driver | `mysql2` (pure JavaScript) | One pooled connection per host/port/user/db + password fingerprint; results returned as structured rows and fields. |
| Credentials | DSH `credentials` service | Passwords stored as refs in `$DSH_HOME/.credentials.yaml`, resolved on the Host only. |
| Plugin framework | Cordis (`slots`, `locale`, `connection`, `credentials`) | UI injection, i18n dictionaries and HTTP routes. |
| Client storage | `window.localStorage` | Non-secret UI state only: connections (without passwords), active selection and query tabs. |
| Module format | ES Modules | Package entry points declared in `exports`. |

## Features

### 1. Connection Management
- Create, edit and delete saved connections (`name`, `host`, `port`, `user`, `password`).
- **Grouping**: connections are shown under collapsible group headers with an inline `(count)`; a blank group becomes "Ungrouped"; existing group names are offered for reuse.
- **Export / Import**: export connections as JSON (passwords excluded); importing regenerates ids to avoid collisions and moves any carried password into the credential store.
- **Test connection** (`SELECT 1`) with an inline green/red result banner.
- **Collapsible form**: click the New/Edit connection title bar (▸/▾) to expand or collapse the form.
- **Credential security**: passwords are stored only in the DSH credential store, never in browser `localStorage`; deleting a connection also clears its stored password.

### 2. Server Information
- Click **Server info** to fetch live status via `SHOW VARIABLES` / `SHOW GLOBAL STATUS`.
- Shows MySQL version, edition, hostname, port, user, OS, architecture, data directory, charset, human-readable uptime, total/current/max connections, queries executed and slow queries.
- Click **Hide info** to collapse; switching connections clears the panel.

### 3. Query Tabs & SQL Execution
- Multiple query tabs, each keeping its own SQL, database selection and result.
- **Rename**: double-click a tab or click ✎; Enter/Esc to finish.
- **Search**: a search box filters query tabs by name in real time; the list scrolls when crowded.
- Run SQL with **Run** or **⌘/Ctrl+Enter**.
- **EXPLAIN**: click **EXPLAIN** to prefix the SQL with `EXPLAIN` and view its query plan (an existing prefix is not duplicated).
- Pick a database, browse its tables, click a table to insert a `SELECT * FROM ... LIMIT 100;` template.
- Results render in a scrollable table with row counts and a truncation notice (the Host caps output at 500 rows).

### 4. Table Structure & Indexes
- Inspect columns (`DESCRIBE`) and indexes (`SHOW INDEX`).
- Add, modify and drop columns via generated `ALTER TABLE` statements; column options include name, type, length, NOT NULL, default, comment, primary key and auto-increment.
- Create (`ADD [UNIQUE] INDEX ... USING <type>`) and drop (`DROP INDEX`) indexes.

### 5. Result Export
- Export the current result to **CSV**.
- Export the current result as SQL **INSERT** statements.

### 6. Database Management
- Click **Databases** to open a panel listing all databases.
- Create a database: name + charset (utf8mb4 / utf8 / latin1 / gbk). Names are strictly validated (letters, digits, underscores only, max 64 chars) and backtick-escaped on the Host to prevent SQL injection. The new database is auto-selected in the current query tab.
- Drop a database with an in-app confirmation. System databases (`information_schema`, `mysql`, `performance_schema`, `sys`) are protected. Dropping clears that database's selection in query tabs.
- The list has a search box for real-time filtering.

### 7. User Management
- Click **User management** to open a panel listing accounts from `mysql.user` (with locked / password-expired status).
- Create user (`CREATE USER`), drop user (`DROP USER`), change password (`ALTER USER`), and grant (`GRANT` with privileges and an optional database scope; blank = all databases).
- Accounts use the `user@host` format (e.g. `app@%`, `app@localhost`); a bare user defaults to host `%`.
- The list has a search box; dropping a user requires in-app confirmation.
- All user/host/database names are escaped to prevent SQL injection. The connected account needs the corresponding administrative privileges.

### Notes on UI
- Connection button grid (2 columns, equal size): New connection · Test · Server info · Refresh databases · Databases · Users · Export · Import (import/export last).
- Destructive actions (drop database, drop user) use an in-app confirmation dialog rather than the browser native `confirm`.

## Host API

All routes are registered under `/api/dsh-mysql-client` through the `connection` service. Client sends connection details and text per request; the Host executes on a pooled connection.

| Group | Routes |
| --- | --- |
| Connection | `test`, `info` |
| Databases | `databases`, `createDatabase`, `dropDatabase` |
| Tables | `tables`, `describe`, `indexes` |
| SQL | `query`, `explain` |
| Users | `users`, `createUser`, `dropUser`, `changePassword`, `grantPrivileges` |
| Credentials | `secret_set`, `secret_clear`, `secret_has` |

## Directory Structure

```
dsh-mysql-client/
├── index.js              # Host half: mysql2 routes, pooling, credential resolution
├── client.js             # Client half: sidebar entry, React panel and styles
├── cordis.patch.yml      # DSH bundle patch
├── icon.svg / icon.png   # Plugin icons
├── locale/               # zh.json / en.json metadata
├── package.json
├── README.md             # This document (English)
└── README.zh.md          # Chinese documentation
```

## Installation & Usage

1. Install this bundle into the target DSH profile and reload the Harness Web UI (it mounts immediately).
2. No `mysql` CLI is needed — the `mysql2` driver is bundled. The target MySQL server must be reachable over the network.
3. Open **MySQL Client** in the left sidebar.
4. Create a connection (host, port, user, password), then click **Test connection**.
5. Use **Databases** / **User management** for administration, or choose a database, click **New query**, write SQL and press **⌘/Ctrl+Enter** to run it.
6. To edit a table's structure or indexes, click the gear icon next to a table and switch between the **Columns** and **Indexes** tabs.
- The left column can be collapsed/expanded as a whole: click the «/» button in the header; when collapsed the query area fills the width.
