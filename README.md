# ClawOps (龙虾管家)

ClawOps 是一个 Web 管理面板，让 OpenClaw 对"小白/非技术用户"更好用、可控、可回滚。

## 项目结构

```
clawops/
├── packages/
│   ├── frontend/     # React + TypeScript + Vite
│   ├── backend/      # Node.js + Express + TypeScript
│   └── shared/       # 共享类型定义
├── clawops.md        # 产品规格文档
└── package.json      # Monorepo 配置
```

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Node.js + Express + TypeScript
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **包管理**: npm workspaces

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

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

## 页面导航

| 页面 | 路径 | 描述 |
|------|------|------|
| Home | `/` | 状态概览与异常处理 |
| Connect | `/connect` | 连接管理与能力探测 |
| Tasks & Runs | `/tasks` | 运行历史与任务管理 |
| Ops | `/ops` | 运维操作（重启/诊断/清理） |
| Config | `/config` | 配置中心与版本管理 |
| Memory | `/memory` | 记忆浏览与搜索 |
| Security | `/security` | 安全评分与审计日志 |

## API 端点

### Capabilities
- `GET /api/capabilities` - 获取网关能力信息

### Runs
- `POST /api/runs` - 创建新运行
- `GET /api/runs` - 获取运行列表
- `GET /api/runs/:id` - 获取单个运行详情
- `POST /api/runs/:id/stop` - 停止运行
- `GET /api/runs/:id/events` - SSE 事件流

### Ops
- `POST /api/ops/self_check` - 执行自检
- `POST /api/ops/restart_gateway` - 重启网关
- `POST /api/ops/cleanup` - 清理（支持 dry-run）
- `GET /api/ops/diagnostics_bundle` - 导出诊断包

### Config
- `GET /api/config/current` - 获取当前配置
- `POST /api/config/preview_diff` - 预览差异
- `POST /api/config/apply` - 应用配置变更
- `POST /api/config/rollback` - 回滚配置
- `GET /api/config/versions` - 获取版本列表

### Memory
- `GET /api/memory` - 获取记忆列表
- `POST /api/memory` - 创建记忆
- `DELETE /api/memory/:id` - 删除记忆
- `POST /api/memory/:id/pin` - 切换置顶状态

### Security
- `GET /api/security/logs` - 获取审计日志
- `POST /api/security/logs` - 创建审计记录
- `GET /api/security/score` - 获取安全评分
- `GET /api/security/sessions` - 获取会话列表
- `DELETE /api/security/sessions/:id` - 终止会话

## 安全特性

- TOTP 双因素认证
- RBAC 权限控制
- 敏感操作二次确认
- Secrets 不落浏览器
- SSRF 防护
- Safe Mode 只读模式

## 许可证

MIT
