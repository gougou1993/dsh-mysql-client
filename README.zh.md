# DSH MySQL 客户端

一个面向 DeepSeek Harness（DSH）的 MySQL 客户端插件。它在左侧侧边栏添加「MySQL 客户端」入口，可以管理连接、打开多个查询标签、执行与解释 SQL、查看/编辑表结构与索引，以及管理数据库和用户——全部在 Harness Web UI 内完成。

SQL 执行在宿主端通过纯 JavaScript 的 `mysql2` 驱动完成，因此**不需要本地安装 `mysql` 命令行工具**，只要目标 MySQL 服务器网络可达即可。密码不会存放在浏览器，而是保存在 DSH 凭证库中。

## 插件信息

| 字段 | 值 |
| --- | --- |
| 包名 | `@oakzhong/dsh-mysql-client` |
| 版本 | `1.2.1` |
| 入口 | `index.js`（宿主）· `client.js`（客户端） |
| 类型 | DSH bundle 插件，ES 模块（`"type": "module"`、`"private": false`、公开发布） |
| 侧边栏入口 | MySQL 客户端（左侧） |
| 描述 | 具备连接管理、查询标签与 SQL 执行能力的 MySQL 客户端。 |

## 技术栈

| 层 | 技术 | 作用 |
| --- | --- | --- |
| 客户端 UI | React（通过 `window.__ModuleLoader__`） | 侧边栏入口与主面板。 |
| 宿主运行时 | Node.js | 通过 `mysql2` 驱动在连接池上执行所有操作，无 `mysql` CLI 依赖。 |
| 数据库驱动 | `mysql2`（纯 JavaScript） | 按「主机/端口/用户/库 + 密码指纹」维护连接池，返回结构化行与字段。 |
| 凭证 | DSH `credentials` 服务 | 密码以引用形式存放在 `$DSH_HOME/.credentials.yaml`，仅在宿主端解析。 |
| 插件框架 | Cordis（`slots`、`locale`、`connection`、`credentials`） | UI 注入、国际化字典与 HTTP 路由。 |
| 客户端存储 | `window.localStorage` | 仅保存非敏感 UI 状态：连接（不含密码）、当前选择、查询标签。 |
| 模块格式 | ES Modules | 入口在 `exports` 中声明。 |

## 功能

### 1. 连接管理
- 新增、编辑、删除连接（`name`、`host`、`port`、`user`、`password`）。
- **分组**：连接按可折叠分组展示，标题内联显示 `(数量)`；空分组归为「未分组」；已有分组名可复用。
- **导出 / 导入**：导出连接为 JSON（不含密码）；导入时重新生成 id 避免冲突，携带的密码会转入凭证库。
- **测试连接**（`SELECT 1`），结果以绿色/红色横幅内联显示。
- **可折叠表单**：点击新建/编辑连接的标题栏（▸/▾）展开或收起表单。
- **凭证安全**：密码只存于 DSH 凭证库，绝不写入浏览器 `localStorage`；删除连接时同步清除凭证。

### 2. 服务器信息
- 点击「服务器信息」，通过 `SHOW VARIABLES` / `SHOW GLOBAL STATUS` 获取实时状态。
- 展示：MySQL 版本、版本说明、主机名、端口、用户、操作系统、架构、数据目录、字符集、可读化的运行时间、累计/当前/最大连接数、已执行查询数、慢查询数。
- 点击「收起信息」折叠；切换连接自动清空。

### 3. 查询标签与 SQL 执行
- 多个查询标签，各自保存 SQL、所选数据库和结果。
- **重命名**：双击标签或点 ✎，回车/Esc 完成。
- **搜索**：搜索框按名称实时过滤标签，条目多时列表可滚动。
- 通过「执行」或 **⌘/Ctrl+Enter** 运行 SQL。
- **EXPLAIN**：点「EXPLAIN 分析」自动为 SQL 加 `EXPLAIN` 前缀并展示执行计划（已有前缀不会重复添加）。
- 选择数据库、浏览数据表，点击表名插入 `SELECT * FROM ... LIMIT 100;` 模板。
- 结果以可滚动表格展示，带行数统计与截断提示（宿主端最多返回 500 行）。

### 4. 表结构与索引
- 查看列（`DESCRIBE`）与索引（`SHOW INDEX`）。
- 通过生成的 `ALTER TABLE` 语句新增、修改、删除列；列选项含名称、类型、长度、非空、默认值、备注、主键、自增。
- 创建（`ADD [UNIQUE] INDEX ... USING <type>`）与删除（`DROP INDEX`）索引。

### 5. 结果导出
- 将当前结果导出为 **CSV**。
- 将当前结果导出为 SQL **INSERT** 语句。

### 6. 数据库管理
- 点击「数据库管理」打开面板，列出所有数据库。
- 新建数据库：填写名称并选择字符集（utf8mb4 / utf8 / latin1 / gbk）。名称严格校验（仅字母、数字、下划线，最长 64 字符）并在宿主端反引号转义以防注入；创建后自动在当前查询标签选中新库。
- 删除数据库需应用内确认；系统库（`information_schema`、`mysql`、`performance_schema`、`sys`）受保护禁止删除；删除后清除查询标签中对该库的选择。
- 列表带搜索框，可实时过滤。

### 7. 用户管理
- 点击「用户管理」打开面板，列出 `mysql.user` 中的账户（含锁定/密码过期状态）。
- 新建用户（`CREATE USER`）、删除用户（`DROP USER`）、修改密码（`ALTER USER`）、授权（`GRANT`，可指定权限与数据库范围，留空=全部库）。
- 账户格式为 `用户名@主机`（如 `app@%`、`app@localhost`），裸用户名默认主机 `%`。
- 列表带搜索框；删除用户需应用内确认。
- 所有用户名/主机/库名均转义以防注入；当前连接账户需具备相应管理权限。

### UI 说明
- 连接按钮区（2 列等宽）：新建连接 · 测试连接 · 服务器信息 · 刷新库 · 数据库管理 · 用户管理 · 导出 · 导入（导入导出置后）。
- 破坏性操作（删除库、删除用户）使用应用内确认弹窗，而非浏览器原生 `confirm`。

## Host API

所有路由通过 `connection` 服务注册在 `/api/dsh-mysql-client` 下。客户端每次请求携带连接信息与文本，宿主在连接池上执行。

| 分组 | 路由 |
| --- | --- |
| 连接 | `test`、`info` |
| 数据库 | `databases`、`createDatabase`、`dropDatabase` |
| 数据表 | `tables`、`describe`、`indexes` |
| SQL | `query`、`explain` |
| 用户 | `users`、`createUser`、`dropUser`、`changePassword`、`grantPrivileges` |
| 凭证 | `secret_set`、`secret_clear`、`secret_has` |

## 目录结构

```
dsh-mysql-client/
├── index.js              # 宿主端：mysql2 路由、连接池、凭证解析
├── client.js             # 客户端：侧边栏入口、React 面板与样式
├── cordis.patch.yml      # DSH bundle patch
├── icon.svg / icon.png   # 插件图标
├── locale/               # zh.json / en.json 元数据
├── package.json
├── README.md             # 本文档（英文）
└── README.zh.md          # 中文文档
```

## 安装与使用

1. 将本 bundle 安装到目标 DSH profile 并刷新 Harness Web UI（会立即挂载）。
2. 无需 `mysql` CLI —— 已内置 `mysql2` 驱动；目标 MySQL 服务器需网络可达。
3. 在左侧侧边栏打开「MySQL 客户端」。
4. 新建连接（主机、端口、用户、密码），点「测试连接」验证。
5. 用「数据库管理」/「用户管理」做管理操作，或选库后点「新建查询」，写 SQL 并按 **⌘/Ctrl+Enter** 执行。
6. 要编辑表结构或索引，点击表旁的齿轮图标，在「字段」和「索引」标签间切换。
- 左侧栏可整体收起/展开：点击标题区的 «/» 按钮，收起后右侧查询区占满宽度。
