# 通用代理API使用说明

## 概述

这是一个通用的代理API系统，将所有到 `process.env.NEXT_PUBLIC_TRPC_API_URL` 的请求转发到本地接口。

## 功能特性

- 自动代理所有HTTP请求（GET、POST、PUT、DELETE）
- 转发到环境变量配置的目标服务器
- 保持原始请求头和响应状态码
- 详细的日志记录和错误处理
- 支持所有tRPC procedure
- 智能缓存系统，提高响应速度
- 缓存命中率统计和监控
- 自动清理过期缓存

## 配置

### 环境变量
```bash
# 代理开关 (true/false 或 1/0)
NEXT_PUBLIC_ENABLE_PROXY=true

# 目标API URL
NEXT_PUBLIC_TRPC_API_URL=https://web3-api.magickbase.com/api/trpc

# 缓存开关 (true/false 或 1/0)
NEXT_PUBLIC_ENABLE_CACHE=true

# 缓存TTL (秒)
NEXT_PUBLIC_CACHE_TTL=300
```

### 代理开关
- `NEXT_PUBLIC_ENABLE_PROXY=true` 或 `NEXT_PUBLIC_ENABLE_PROXY=1`: 启用代理
- `NEXT_PUBLIC_ENABLE_PROXY=false` 或 `NEXT_PUBLIC_ENABLE_PROXY=0`: 禁用代理
- 未设置或空值: 禁用代理

### 缓存开关
- `NEXT_PUBLIC_ENABLE_CACHE=true` 或 `NEXT_PUBLIC_ENABLE_CACHE=1`: 启用缓存
- `NEXT_PUBLIC_ENABLE_CACHE=false` 或 `NEXT_PUBLIC_ENABLE_CACHE=0`: 禁用缓存
- 未设置或空值: 禁用缓存

### 缓存TTL
- `NEXT_PUBLIC_CACHE_TTL=300`: 缓存5分钟
- `NEXT_PUBLIC_CACHE_TTL=600`: 缓存10分钟
- 未设置: 默认5分钟

### 默认目标
如果环境变量未设置，默认使用：
```
https://web3-api.magickbase.com/api/trpc
```

## API结构

### 1. 通用代理 (`/api/proxy/[path]`)
处理所有转发请求

**支持的HTTP方法：**
- GET
- POST
- PUT
- DELETE

**路径格式：**
```
/api/proxy/[procedure]
```

例如：
- `/api/proxy/rgbpp.marketCap`
- `/api/proxy/temp.btc.chainInfo`
- `/api/proxy/explorer.addressBase`

### 2. 健康检查 (`/api/proxy/health`)
检查目标服务器的连接状态

### 3. 测试端点 (`/api/proxy/test`)
测试整个代理系统是否正常工作

### 4. 状态检查 (`/api/proxy/status`)
获取详细的代理配置和状态信息

### 5. 缓存管理 (`/api/proxy/cache`)
管理缓存数据
- `GET`: 获取缓存统计和条目信息
- `DELETE`: 清空所有缓存
- `POST`: 执行缓存操作（cleanup/stats）

## 使用方式

### 自动代理
所有tRPC客户端已配置为根据开关自动选择：

```typescript
// frontend/src/configs/trpc.ts
const getTrpcUrl = () => {
  const proxyEnabled = process.env.NEXT_PUBLIC_ENABLE_PROXY
  const isProxyOn = proxyEnabled === 'true' || proxyEnabled === '1'
  
  if (isProxyOn) {
    return '/api/proxy'  // 使用本地代理
  } else {
    return process.env.NEXT_PUBLIC_TRPC_API_URL  // 直接访问目标服务器
  }
}
```

### 手动请求
也可以直接调用代理API：

```bash
# 获取RGBPP市值
GET /api/proxy/rgbpp.marketCap

# 获取BTC链信息
GET /api/proxy/temp.btc.chainInfo

# 带参数的请求
GET /api/proxy/rgbpp.info?assetId=xxx

# POST请求
POST /api/proxy/rgbpp.transactionList
Content-Type: application/json

{
  "assetId": "xxx",
  "page": 1,
  "pageSize": 10
}
```

## 转发机制

### 请求转发
1. 接收客户端请求
2. 构建目标URL：`${NEXT_PUBLIC_TRPC_API_URL}/${path}`
3. 复制所有请求头
4. 转发请求体
5. 发送到目标服务器

### 响应转发
1. 接收目标服务器响应
2. 保持原始状态码
3. 保持原始响应头
4. 缓存响应数据（如果启用）
5. 返回响应数据

### 缓存机制
1. 生成唯一缓存键（基于方法、路径、参数、请求体）
2. 检查缓存是否存在且有效
3. 缓存命中：直接返回缓存数据
4. 缓存未命中：请求目标服务器并缓存结果
5. 自动清理过期缓存

### 错误处理
- 网络错误：返回500状态码和错误详情
- 目标服务器错误：转发原始错误状态码
- 超时：5秒超时设置

## 日志记录

代理会记录以下信息：
- 请求URL和目标URL
- 请求体内容
- 响应状态码
- 错误详情
- 缓存命中/未命中状态
- 缓存设置和清理操作

## 测试

### 健康检查
```bash
GET /api/proxy/health
```

响应示例：
```json
{
  "status": "healthy",
  "target": "https://web3-api.magickbase.com/api/trpc",
  "responseStatus": 200,
  "proxyEndpoint": "/api/proxy"
}
```

### 完整测试
```bash
GET /api/proxy/test
```

响应示例：
```json
{
  "status": "test_completed",
  "health": { ... },
  "testRequest": { ... },
  "targetUrl": "https://web3-api.magickbase.com/api/trpc",
  "proxyEndpoint": "/api/proxy",
  "timestamp": "2024-01-05T10:30:00Z"
}
```

### 缓存管理
```bash
# 获取缓存统计
GET /api/proxy/cache

# 清空所有缓存
DELETE /api/proxy/cache

# 清理过期缓存
POST /api/proxy/cache
{
  "action": "cleanup"
}

# 获取缓存统计
POST /api/proxy/cache
{
  "action": "stats"
}
```

响应示例：
```json
{
  "status": "success",
  "timestamp": "2024-01-05T10:30:00Z",
  "stats": {
    "totalEntries": 25,
    "validEntries": 20,
    "expiredEntries": 5,
    "totalSizeBytes": 15360,
    "totalSizeKB": 15.0
  },
  "entries": [...],
  "totalEntries": 25
}
```

### 状态检查
```bash
GET /api/proxy/status
```

响应示例：
```json
{
  "status": "success",
  "timestamp": "2024-01-05T10:30:00Z",
  "proxy": {
    "enabled": true,
    "endpoint": "/api/proxy",
    "healthEndpoint": "/api/proxy/health",
    "testEndpoint": "/api/proxy/test"
  },
  "target": {
    "url": "https://web3-api.magickbase.com/api/trpc",
    "status": "reachable",
    "response": { "status": 200, "ok": true }
  },
  "environment": {
    "NEXT_PUBLIC_ENABLE_PROXY": "true",
    "NEXT_PUBLIC_TRPC_API_URL": "https://web3-api.magickbase.com/api/trpc"
  },
  "configuration": {
    "currentMode": "proxy",
    "description": "Requests will be proxied through /api/proxy"
  }
}
```

## 优势

1. **透明转发** - 完全透明的代理，不修改任何内容
2. **环境配置** - 通过环境变量灵活配置目标服务器
3. **通用性** - 支持所有HTTP方法和tRPC procedure
4. **可靠性** - 详细的错误处理和日志记录
5. **易于调试** - 完整的请求和响应日志

## 注意事项

1. 确保环境变量 `NEXT_PUBLIC_TRPC_API_URL` 正确设置
2. 使用 `NEXT_PUBLIC_ENABLE_PROXY` 控制代理开关
3. 目标服务器必须支持CORS或允许代理请求
4. 网络连接问题会影响代理功能
5. 建议在生产环境中添加适当的缓存机制

## 快速切换

### 启用代理
```bash
NEXT_PUBLIC_ENABLE_PROXY=true
```

### 禁用代理（直接访问）
```bash
NEXT_PUBLIC_ENABLE_PROXY=false
# 或者删除该环境变量
```

### 查看状态
访问 `/api/proxy/status` 查看当前配置和连接状态

### 缓存管理
访问 `/api/proxy/cache` 查看缓存统计和管理缓存 