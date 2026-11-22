# DSH MySQL Client

A MySQL client plugin for DeepSeek Harness (DSH). It adds a **MySQL Client** entry to the left sidebar, where you can manage connections, open multiple query tabs, run SQL statements, inspect and edit table structures and indexes, and export results — all from inside the Harness Web UI.

SQL execution runs on the Host through the pure-JavaScript `mysql2` driver, so **no local `mysql` CLI is required**. Connection details are sent per request from the Client and are never persisted on the Host.

## Plugin Info

| Field | Value |
| --- | --- |
| Package | `@oakzhong/dsh-mysql-client` |
| Version | `1.1.1` |
| Entry | `index.js` (Host) · `client.js` (Client) |
| Type | DSH bundle plugin, ES module (`"type": "module"`, private) |
| Description | A MySQL client with connection management, query tabs and SQL execution. |

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Client UI | React (via `window.__ModuleLoader__`) | Sidebar entry and the main React panel. |
| Host runtime | Node.js `child_process.execFile` | Runs the `mysql` CLI for every operation. |
| Database engine | `mysql2` (pure-JavaScript driver, no `mysql` CLI needed) | One pooled connection per host/port/user; results come back as structured rows and fields. |
| Plugin framework | Cordis (`slots`, `locale`, `connection`) | UI injection, i18n dictionaries and HTTP routes. |
| Client storage | `window.localStorage` | Persists connections, active selection and query tabs. |
| Module format | ES Modules | Package entry points declared in `exports`. |

## Features

### Connection Management
- Create, edit and delete saved connections (`name`, `host`, `port`, `user`, `password`).
- Test a connection with `SELECT 1`; refresh the database list (`SHOW DATABASES`).
- **Grouping**: connections are listed under collapsible group headers (count per group); a blank group renders as "Ungrouped"; existing group names are offered for reuse
- **Export / Import**: download connections as JSON (and **passwords are excluded by default**); importing appends entries with regenerated ids and moves any carried password into the credential store
- **Test result** is shown inline — **green for success, red for failure**
- Connections and the active selection are stored in `localStorage` on the Client only.
- **Password storage**: passwords are kept in the DSH credential store (`$DSH_HOME/.credentials.yaml`), never in browser `localStorage`; deleting a connection also deletes its password.

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
Registered under `/api/dsh-mysql-client` via the `connection` service: `test`, `databases`, `tables`, `describe`, `indexes`, `query`. The driver sends statements over the wire; the client sends text and the Host executes it on a pooled connection.

## Directory Structure

```
dsh-mysql-client/
├── index.js              # Host half: routes over mysql2 (no mysql CLI needed)
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
2. No `mysql` CLI is required — the plugin bundles the `mysql2` driver. The target MySQL server must be reachable over the network.
3. Open the **MySQL Client** entry in the left sidebar.
4. Create a connection (host, port, user, password), then click **Test connection**.
5. Refresh databases, click **New query**, choose a database, write SQL and press **⌘/Ctrl+Enter** to run it.
6. To manage a table's structure or indexes, click the gear icon next to a table and switch between the **Columns** and **Indexes** tabs.
