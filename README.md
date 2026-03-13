# ClawOps (龙虾管家)

ClawOps 是一个 Web 管理面板，让 OpenClaw 对"小白/非技术用户"更好用、可控、可回滚。

## 目录

- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [详细使用说明](#详细使用说明)
  - [登录系统](#登录系统)
  - [首页概览](#首页概览)
  - [配置管理](#配置管理)
  - [运维操作](#运维操作)
  - [记忆管理](#记忆管理)
  - [安全中心](#安全中心)
- [快捷键](#快捷键)
- [API 文档](#api-文档)
- [Docker 部署](#docker-部署)
- [环境变量](#环境变量)
- [安全特性](#安全特性)
- [常见问题](#常见问题)

---

## 项目结构

```
clawops/
├── packages/
│   ├── frontend/          # React + TypeScript + Vite + TailwindCSS
│   │   └── src/
│   │       ├── components/    # 可复用组件
│   │       ├── pages/         # 页面组件
│   │       ├── stores/        # Zustand 状态管理
│   │       ├── utils/         # API hooks 和工具函数
│   │       └── hooks/         # 自定义 hooks
│   ├── backend/           # Node.js + Express + TypeScript
│   │   └── src/
│   │       ├── controllers/   # 请求处理器
│   │       ├── gateway/       # Gateway 集成
│   │       ├── middleware/    # 中间件
│   │       ├── routes/        # API 路由
│   │       ├── services/      # 业务逻辑
│   │       └── db/            # SQLite 数据库
│   └── shared/            # 共享类型定义
├── config/                # 配置文件目录
├── backups/               # 备份目录
├── data/                  # 数据库目录
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **包管理**: npm workspaces

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (可选，用于容器化部署)

### 安装依赖

```bash
npm install
```

### 初始化配置

```bash
npm run init:config
```

这会创建必要的目录结构并复制环境变量模板。

### 开发模式

```bash
# 同时启动前端和后端
npm run dev

# 或者分别启动
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

### 构建

```bash
npm run build
```

### 生产模式运行

```bash
npm run build
npm run start
```

---

## 详细使用说明

### 登录系统

#### 首次登录

1. 启动服务后访问 `http://localhost:3000`
2. 使用默认凭证登录：
   - **用户名**: `admin`
   - **密码**: `admin123`

⚠️ **重要**: 首次登录后请立即修改密码！

#### TOTP 双因素认证设置

1. 登录后进入 **Security** 页面
2. 点击 **Setup TOTP** 按钮
3. 使用认证器应用（如 Google Authenticator、Authy）扫描二维码
4. 输入 6 位验证码完成设置
5. 下次登录时需要输入 TOTP 验证码

#### 记住设备

登录时勾选 "记住此设备" 可在 7 天内免登录。

---

### 首页概览

首页展示系统整体状态和快速操作入口。

#### 状态卡片

| 卡片 | 含义 | 检查项 |
|------|------|--------|
| **Gateway Status** | 网关健康状态 | 是否可达、版本信息 |
| **Connection** | 连接状态 | 本地/远程连接状态 |
| **Last Check** | 上次自检时间 | 自检是否过期 |

#### 快速操作

- **Run Self-Check**: 执行完整系统自检
- **Export Diagnostics**: 导出诊断包（用于问题排查）
- **Backup Now**: 立即创建配置备份
- **View Logs**: 查看最近日志

#### 最近活动

显示最近 10 条操作记录，包括：
- 配置变更
- 任务执行
- 备份创建
- 安全操作

---

### 配置管理

配置中心管理 OpenClaw 的核心配置文件。

#### 配置文件列表

| 文件 | 用途 |
|------|------|
| **SOUL.md** | 核心身份配置，定义代理的基本行为 |
| **AGENTS.md** | 子代理定义，配置专门的子代理 |
| **USER.md** | 用户偏好设置，个人定制选项 |
| **IDENTITY.md** | 系统身份，系统级配置 |
| **HEARTBEAT.md** | 定时任务，周期性维护任务 |

#### 编辑配置

**Basic Settings 模式**（推荐新手）:
1. 点击 "Basic Settings" 标签
2. 修改表单中的设置项
3. 点击 "Test Availability" 测试
4. 保存更改

**Config Center 专家模式**:
1. 点击 "Config Center (Expert)" 标签
2. 左侧选择要编辑的文件
3. 右侧编辑器中修改内容
4. 点击 "Diff" 预览变更
5. 点击 "保存" 并输入变更原因

#### 版本回滚

1. 点击 "版本历史" 按钮
2. 查看历史版本列表
3. 点击目标版本的 "回滚" 按钮
4. 输入回滚原因确认

#### 安全特性

- 每次保存自动创建备份
- 敏感信息（API key、密码）自动脱敏
- 所有变更记录审计日志
- 支持一键回滚到任意历史版本

---

### 运维操作

Ops 页面提供系统运维功能。

#### 自检功能

点击 **Run Self-Check** 执行系统健康检查：

| 检查项 | 说明 |
|--------|------|
| Connectivity | Gateway 连通性 |
| Capabilities | 功能可用性 |
| Authorization | 认证状态 |
| Resources | 资源使用情况 |

结果状态：
- ✅ **healthy**: 所有检查通过
- ⚠️ **degraded**: 部分功能受限
- ❌ **unhealthy**: 存在严重问题

#### 诊断导出

点击 **Export Diagnostics** 生成诊断包，包含：
- 系统信息（平台、Node 版本、内存）
- Gateway 状态
- 配置状态
- 最近错误
- 优化建议

#### 系统清理

点击 **Cleanup** 执行清理：

1. **Dry Run 模式**（默认）: 仅预览将删除的内容
2. **执行模式**: 实际删除临时文件

清理内容：
- 临时文件
- 过期日志
- 缓存数据

#### Gateway 重启

⚠️ **危险操作**: 点击 **Restart Gateway** 会重启 OpenClaw 服务。

---

### 记忆管理

Memory 页面管理 OpenClaw 的长期记忆。

#### 浏览记忆

默认显示所有记忆，可按来源过滤：

| 来源 | 说明 |
|------|------|
| conversation | 对话中产生的记忆 |
| task | 任务执行结果 |
| web | 网页内容摘要 |
| file | 文件内容记录 |

#### 搜索记忆

1. 在搜索框输入关键词
2. 系统在标题和内容中搜索
3. 可结合来源过滤

#### 管理操作

- **Pin**: 置顶重要记忆，防止被清理
- **Delete**: 删除记忆
- **保留策略**: 设置自动过期天数

#### 统计信息

- 总记忆数
- 置顶数量
- 按来源分布

---

### 安全中心

Security 页面提供安全管理和审计功能。

#### 安全评分

系统根据以下因素计算安全评分：

| 因素 | 权重 |
|------|------|
| TOTP 是否启用 | 25% |
| 会话管理 | 20% |
| 审计日志 | 20% |
| RBAC 配置 | 20% |
| SSRF 防护 | 15% |

评分等级：
- **90-100**: 优秀 (绿色)
- **70-89**: 警告 (黄色)
- **0-69**: 危险 (红色)

#### 会话管理

查看当前所有活跃会话：

| 信息 | 说明 |
|------|------|
| IP 地址 | 登录来源 IP |
| User Agent | 浏览器信息 |
| 创建时间 | 登录时间 |
| 最后活跃 | 最近活动时间 |

操作：
- 点击 **Terminate** 终止指定会话
- 点击 **Terminate Others** 终止其他所有会话

#### 审计日志

查看所有操作记录，支持过滤：

| 过滤条件 | 说明 |
|----------|------|
| Action | 操作类型（login, config_save, rollback...） |
| Actor | 操作者 |
| Status | 成功/失败 |
| Time | 时间范围 |

导出：
- 点击 **Export** 导出 JSON 格式日志

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `⌘/Ctrl + K` | 打开命令面板 |
| `G + H` | 跳转首页 |
| `G + C` | 跳转连接页 |
| `G + T` | 跳转任务页 |
| `G + O` | 跳转运维页 |
| `G + F` | 跳转配置页 |
| `G + M` | 跳转记忆页 |
| `G + S` | 跳转安全页 |

---

## API 文档

### 认证 API

```
POST /api/auth/login
请求体: { username, password, totp_code?, remember_device? }
响应: { success, data: { user, session_id } }

POST /api/auth/logout
响应: { success, data: { message } }

GET /api/auth/me
响应: { success, data: { id, username, role, totp_enabled } }

POST /api/auth/totp/setup
响应: { success, data: { secret, url } }

POST /api/auth/totp/verify
请求体: { secret, code }
响应: { success, data: { message } }

GET /api/auth/sessions
响应: { success, data: [{ id, ip_address, user_agent, ... }] }

DELETE /api/auth/sessions/:id
响应: { success, data: { message } }
```

### 配置 API

```
GET /api/config/list
响应: { success, data: [{ name, path, description, exists, version }] }

GET /api/config/file/:path
响应: { success, data: { content, hash, version, exists } }

POST /api/config/save
请求体: { path, content, reason }
响应: { success, data: { message, version, version_id } }

POST /api/config/backup
请求体: { path }
响应: { success, data: { message, backup_id } }

GET /api/config/versions/:path
响应: { success, data: [{ id, version, hash, created_at }] }

POST /api/config/rollback
请求体: { path, version_id, reason }
响应: { success, data: { message, rolled_back_to } }
```

### 运维 API

```
POST /api/ops/self_check
响应: { success, data: { status, checks, timestamp, duration } }

GET /api/ops/gateway_status
响应: { success, data: { connected, version, uptime, lastChecked } }

POST /api/ops/cleanup
请求体: { dry_run: boolean }
响应: { success, data: { dry_run, items, total_size, message } }

GET /api/ops/diagnostics_bundle
响应: { success, data: { generated_at, system_info, gateway_status, ... } }

POST /api/ops/restart_gateway
响应: { success, data: { message } }
```

### 记忆 API

```
GET /api/memory?source=&pinned=&limit=&offset=
响应: { success, data: [{ id, title, content, source, pinned, ... }] }

GET /api/memory/search?q=query
响应: { success, data: [...] }

POST /api/memory
请求体: { title, content, source, retention_days }
响应: { success, data: { id, title, ... } }

DELETE /api/memory/:id
响应: { success, data: { message } }

POST /api/memory/:id/pin
响应: { success, data: { id, pinned } }
```

### 安全 API

```
GET /api/security/logs?action=&actor_id=&limit=
响应: { success, data: [{ event_id, event_time, action, ... }] }

GET /api/security/score
响应: { success, data: { score, status, checks } }

GET /api/security/sessions
响应: { success, data: [{ id, ip_address, ... }] }

DELETE /api/security/sessions/:id
响应: { success, data: { message } }
```

---

## Docker 部署

### 构建镜像

```bash
docker build -t clawops:latest .
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

服务将在以下端口启动：
- 前端: `http://localhost:3000`
- 后端 API: `http://localhost:3001`

### 数据持久化

Docker Compose 配置了以下卷：

| 卷 | 用途 |
|----|------|
| `clawops-data` | SQLite 数据库 |
| `clawops-config` | 配置文件 |
| `clawops-backups` | 备份文件 |

### 查看日志

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 停止服务

```bash
docker-compose down
```

---

## 环境变量

创建 `.env` 文件配置环境：

```bash
# 复制模板
cp .env.example .env
```

### 可用变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | development | 运行环境 |
| `PORT` | 3001 | 后端端口 |
| `DATABASE_PATH` | ./data/clawops.db | 数据库路径 |
| `CONFIG_DIR` | ./config | 配置文件目录 |
| `BACKUP_DIR` | ./backups | 备份目录 |
| `GATEWAY_URL` | http://localhost:8080 | Gateway 地址 |
| `GATEWAY_TIMEOUT` | 30000 | Gateway 超时(ms) |
| `SESSION_SECRET` | - | 会话密钥(生产必改) |
| `CORS_ORIGIN` | http://localhost:3000 | CORS 允许源 |

---

## 安全特性

### 已实现的安全措施

| 特性 | 状态 | 说明 |
|------|------|------|
| TOTP 双因素认证 | ✅ | 支持 Google Authenticator 等 |
| RBAC 权限控制 | ✅ | admin/operator/viewer 三级 |
| 密码哈希 | ✅ | PBKDF2 + salt |
| 会话管理 | ✅ | HttpOnly Cookie, 过期控制 |
| 审计日志 | ✅ | 所有操作可追溯 |
| CSP | ✅ | 内容安全策略 |
| SSRF 防护 | ✅ | 禁止访问内网地址 |
| 敏感值脱敏 | ✅ | API key, password 自动隐藏 |

### 安全建议

1. **生产环境必须修改默认密码**
2. **启用 TOTP 双因素认证**
3. **定期检查审计日志**
4. **配置 HTTPS**
5. **定期备份数据库**

---

## 常见问题

### Q: 忘记密码怎么办？

A: 目前需要重置数据库或手动修改。生产环境建议配置密码找回功能。

### Q: 配置文件保存失败？

A: 检查以下几点：
1. `CONFIG_DIR` 目录权限
2. 磁盘空间是否充足
3. 文件内容是否符合验证规则

### Q: Gateway 连接失败？

A: 检查以下几点：
1. Gateway 服务是否启动
2. `GATEWAY_URL` 配置是否正确
3. 网络防火墙设置

### Q: 如何备份数据？

A: 备份以下目录：
- `data/` - 数据库
- `config/` - 配置文件
- `backups/` - 历史备份

### Q: 如何升级版本？

A: 
1. 备份数据
2. 拉取最新代码
3. `npm install` 更新依赖
4. `npm run build` 重新构建
5. 重启服务

---

## 许可证

MIT

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 联系方式

- GitHub Issues: [项目 Issues 页面]
- 文档: [Wiki 页面]
