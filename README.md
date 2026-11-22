# DSH MySQL Client

A MySQL client plugin for DeepSeek Harness (DSH). It adds a **MySQL Client** entry to the left sidebar, where you can manage connections, open multiple query tabs, run SQL statements, inspect and edit table structures and indexes, and export results — all from inside the Harness Web UI.

SQL execution runs on the Host through the local `mysql` CLI. Connection details are sent per request from the Client and are never persisted on the Host; on the Client they are kept in `localStorage`.

## Plugin Info

| Field | Value |
| --- | --- |
| Package | `@oakzhong/dsh-mysql-client` |
| Version | `1.0.0` |
| Entry | `index.js` (Host) · `client.js` (Client) |
| Type | DSH bundle plugin, ES module (`"type": "module"`, private) |
| Description | A MySQL client with connection management, query tabs and SQL execution. |

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Client UI | React (via `window.__ModuleLoader__`) | Sidebar entry and the main React panel. |
| Host runtime | Node.js `child_process.execFile` | Runs the `mysql` CLI for every operation. |
| Database engine | `mysql` CLI (path via `MYSQL_CLI_PATH`, default `/usr/local/mysql/bin/mysql`) | Executes SQL and returns tabular output. |
| Plugin framework | Cordis (`slots`, `locale`, `connection`) | UI injection, i18n dictionaries and HTTP routes. |
| Client storage | `window.localStorage` | Persists connections, active selection and query tabs. |
| Module format | ES Modules | Package entry points declared in `exports`. |

## Features

### Connection Management
- Create, edit and delete saved connections (`name`, `host`, `port`, `user`, `password`).
- Test a connection with `SELECT 1`; refresh the database list (`SHOW DATABASES`).
- Connections and the active selection are stored in `localStorage` on the Client only.

### Query Tabs & SQL Execution
- Open and close multiple query tabs; each tab keeps its own SQL, database selection and result.
- Run SQL with the **Run** button or **⌘/Ctrl+Enter**.
- Pick a database, browse its tables (`SHOW TABLES`), and click a table to insert a `SELECT * ... LIMIT 100;` template.
- Results render in a scrollable table with row counts and a truncation notice (the Host caps output at 500 rows).

### Table Structure Management
- Inspect table columns (`DESCRIBE`) and index definitions (`SHOW INDEX`).
- Add, modify and drop columns via generated `ALTER TABLE ... ADD/MODIFY/DROP COLUMN` statements.
- Column options include name, type, length, NOT NULL, default, comment, primary key and auto-increment.

### Index Management
- List existing indexes with their columns, type and UNIQUE flag.
- Create indexes (`ADD [UNIQUE] INDEX ... USING <type>`) and drop indexes (`DROP INDEX`).

### Result Export
- Export the current result to CSV (**Export CSV**).
- Export the current result as SQL `INSERT` statements (**Export SQL**).

### Host API
Registered under `/api/dsh-mysql-client` via the `connection` service: `test`, `databases`, `tables`, `describe`, `indexes`, `query`. SQL is passed to the CLI as a single `-e` argument and is never interpreted by a shell.

## Directory Structure

```
dsh-mysql-client/
├── index.js              # Host half: mysql CLI routes
├── client.js             # Client half: sidebar entry + React panel and styles
├── cordis.patch.yml      # DSH bundle patch
├── icon.svg              # Plugin icon
├── locale/
│   ├── zh.json           # Chinese metadata
│   └── en.json           # English metadata
├── package.json
├── README.md             # This document (English)
└── README.zh.md          # Chinese documentation
```

## Installation & Usage

1. Install this bundle plugin into the target DSH profile and reload the Harness Web UI. It is marked to mount immediately.
2. Make sure the `mysql` CLI is available on the Host. The default path is `/usr/local/mysql/bin/mysql`; set the `MYSQL_CLI_PATH` environment variable to override it.
3. Open the **MySQL Client** entry in the left sidebar.
4. Create a connection (host, port, user, password), then click **Test connection**.
5. Refresh databases, click **New query**, choose a database, write SQL and press **⌘/Ctrl+Enter** to run it.
6. To manage a table's structure or indexes, click the gear icon next to a table and switch between the **Columns** and **Indexes** tabs.
