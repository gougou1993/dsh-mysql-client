# DSH MySQL 客户端

DeepSeek Harness（DSH）的 MySQL 客户端插件。它在左侧栏新增 **MySQL 客户端** 入口，可在 Harness Web UI 内管理连接、打开多个查询页面、执行 SQL 语句、查看与编辑表结构和索引，并导出结果。

SQL 执行在 Host 端通过本机 `mysql` 命令行完成。连接信息由 Client 按请求传入，Host 端不做持久化；Client 端将连接与查询页保存在 `localStorage`。

## 插件信息

| 字段 | 值 |
| --- | --- |
| 包名 | `@oakzhong/dsh-mysql-client` |
| 版本 | `1.0.0` |
| 入口 | `index.js`（Host）· `client.js`（Client） |
| 类型 | DSH bundle 插件，ES module（`"type": "module"`，private） |
| 描述 | A MySQL client with connection management, query tabs and SQL execution. |

## 技术栈

| 层 | 技术 | 作用 |
| --- | --- | --- |
| Client UI | React（通过 `window.__ModuleLoader__`） | 侧边栏入口与主 React 面板。 |
| Host 运行时 | Node.js `child_process.execFile` | 每次操作调用 `mysql` 命令行。 |
| 数据库引擎 | `mysql` CLI（路径由 `MYSQL_CLI_PATH` 指定，默认 `/usr/local/mysql/bin/mysql`） | 执行 SQL 并返回表格输出。 |
| 插件框架 | Cordis（`slots`、`locale`、`connection`） | UI 注入、国际化词典与 HTTP 路由。 |
| Client 存储 | `window.localStorage` | 保存连接、当前选中连接与查询页。 |
| 模块格式 | ES Modules | `exports` 中声明包入口。 |

## 功能

### 连接管理
- 新建、编辑、删除已保存的连接（`name`、`host`、`port`、`user`、`password`）。
- 通过 `SELECT 1` 测试连接；刷新数据库列表（`SHOW DATABASES`）。
- 连接与当前选中项仅保存在 Client 端 `localStorage`。

### 查询页与 SQL 执行
- 新建并关闭多个查询页；每页各自保存 SQL、所选数据库与结果。
- 通过 **执行** 按钮或 **⌘/Ctrl+Enter** 运行 SQL。
- 选择数据库、浏览其数据表（`SHOW TABLES`），点击表名可插入 `SELECT * ... LIMIT 100;` 模板。
- 结果以可滚动表格展示，含行数统计与截断提示（Host 端最多返回 500 行）。

### 表结构管理
- 查看字段（`DESCRIBE`）与索引定义（`SHOW INDEX`）。
- 通过生成的 `ALTER TABLE ... ADD/MODIFY/DROP COLUMN` 语句增加、修改、删除字段。
- 字段选项包含名称、类型、长度、非空、默认值、备注、主键与自增。

### 索引管理
- 列出已有索引及其字段、类型与 UNIQUE 标志。
- 创建索引（`ADD [UNIQUE] INDEX ... USING <type>`）与删除索引（`DROP INDEX`）。

### 结果导出
- 将当前结果导出为 CSV（**导出 CSV**）。
- 将当前结果导出为 SQL `INSERT` 语句（**导出 SQL**）。

### Host 接口
通过 `connection` 服务注册在 `/api/dsh-mysql-client` 下：`test`、`databases`、`tables`、`describe`、`indexes`、`query`。SQL 作为单个 `-e` 参数传给命令行，不经过 shell 解释。

## 目录结构

```
dsh-mysql-client/
├── index.js              # Host 端：mysql 命令行路由
├── client.js             # Client 端：侧边栏入口 + React 面板与样式
├── cordis.patch.yml      # DSH bundle patch
├── icon.svg              # 插件图标
├── locale/
│   ├── zh.json           # 中文元数据
│   └── en.json           # 英文元数据
├── package.json
├── README.md             # 本文档（英文）
└── README.zh.md          # 中文文档
```

## 安装与使用

1. 将该 bundle 插件安装到目标 DSH profile，并刷新 Harness Web UI。该插件标记为立即挂载。
2. 确保 Host 端存在 `mysql` 命令行工具。默认路径为 `/usr/local/mysql/bin/mysql`；可通过环境变量 `MYSQL_CLI_PATH` 覆盖。
3. 打开左侧栏的 **MySQL 客户端** 入口。
4. 新建连接（地址、端口、用户名、密码），点击 **测试连接**。
5. 刷新数据库，点击 **新建查询**，选择数据库，编写 SQL 后按 **⌘/Ctrl+Enter** 执行。
6. 管理表结构或索引时，点击表名旁的齿轮图标，在 **字段** 与 **索引** 标签间切换。
