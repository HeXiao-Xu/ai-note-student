# AI 智能个人笔记整理系统 — 设计规格

## 项目概述

面向大学生的 AI 驱动笔记整理系统，以毕业设计为核心目标。系统围绕三大模块——多模态笔记采集、学生专属学习辅助、个人知识体系构建——提供一站式学习工具。架构以简洁单体为原则，骨架优先逐步扩充。

### 关键决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 项目定位 | 毕业设计为主 | 核心功能演示即可，优先展示 AI 能力 |
| 技术栈 | Go + React + TypeScript | 用户指定 |
| AI 服务 | 云端 LLM API | 调用便捷，无需本地硬件 |
| OCR 方案 | 云端 OCR API | Mathpix(公式) + 百度OCR(通用) |
| 数据库 | PostgreSQL + pgvector | 业务数据 + 向量检索一体化 |
| 部署方式 | Docker Compose 容器化 | 一键启动，展示运维能力 |
| 用户规模 | 少量用户 | 简单注册登录，不考虑并发 |
| 知识图谱 | 关系表 + 前端可视化库(D3/ECharts) | 不引入图数据库，降低复杂度 |
| 开发节奏 | 骨架优先，逐步扩充 | 降低风险，每阶段可交付 |

## 技术栈

### 前端

- React 18 + TypeScript
- Vite 构建
- TailwindCSS 样式
- Zustand 状态管理
- React Router 路由
- TipTap 编辑器（Markdown 富文本）
- D3.js / ECharts（知识图谱可视化）

### 后端

- Go 1.22+
- Gin HTTP 框架
- GORM ORM
- JWT 认证
- WebSocket（AI 任务进度推送）

### 数据层

- PostgreSQL 16 + pgvector 扩展（业务数据 + 向量检索）
- MinIO（文件/图片存储）

### 外部 AI 服务

- LLM：智谱 GLM / 通义千问 / OpenAI（通过 Provider 抽象层切换）
- OCR：百度 OCR（通用文字）+ Mathpix（公式识别）
- Embedding：智谱 Embedding / OpenAI（存入 pgvector）

## 系统架构

```
┌─────────────────────────────────────────┐
│           React SPA (Vite + TS)          │
│  编辑器 / 文件导入 / OCR / 考点标注       │
│  错题本 / 复习计划 / 知识图谱 / 问答      │
└──────────────────┬──────────────────────┘
                   │ REST API + WebSocket
┌──────────────────▼──────────────────────┐
│           Go Server (Gin)                │
│  ┌─────────────────────────────────┐    │
│  │ API 层：路由 / 中间件 / JWT       │    │
│  ├─────────────────────────────────┤    │
│  │ 业务层：笔记/文件/考点/错题/       │    │
│  │        复习/图谱/问答             │    │
│  ├─────────────────────────────────┤    │
│  │ AI 编排层：LLM/OCR/Embedding     │    │
│  │           Prompt 管理             │    │
│  └─────────────────────────────────┘    │
└────┬──────────┬──────────┬──────────────┘
     │          │          │
┌────▼────┐ ┌──▼───┐ ┌───▼──────┐
│PostgreSQL│ │MinIO │ │外部 AI 服务│
│+pgvector │ │      │ │LLM/OCR/  │
│          │ │      │ │Embedding  │
└─────────┘ └──────┘ └──────────┘
```

## 数据模型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| username | string | 用户名 |
| email | string | 邮箱，唯一 |
| password_hash | string | 密码哈希 |
| avatar | string | 头像 URL |
| created_at | timestamp | 创建时间 |

### Course（课程）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| user_id | uint | 外键 → User |
| name | string | 课程名称 |
| description | string | 课程描述 |
| color | string | 标识颜色 |
| sort_order | int | 排序序号 |
| created_at | timestamp | 创建时间 |

### Note（笔记）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| user_id | uint | 外键 → User |
| course_id | uint | 外键 → Course |
| title | string | 笔记标题 |
| content | text | Markdown 内容 |
| tags | jsonb | 标签数组 |
| is_exam_focus | bool | 是否考点速记版 |
| embedding | vector(N) | pgvector 向量，维度随 Embedding 模型配置 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### FileAttachment（文件附件）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| note_id | uint | 外键 → Note |
| file_name | string | 文件名 |
| file_type | string | 文件类型(ppt/pdf/docx/image) |
| file_url | string | MinIO 文件地址 |
| ocr_text | text | OCR 识别结果 |
| created_at | timestamp | 创建时间 |

### ExamPoint（考点）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| note_id | uint | 外键 → Note |
| content | string | 考点内容 |
| frequency | int | 出现频次 |
| source | string | 来源（AI分析/手动标记） |
| exam_years | jsonb | 出现年份列表 |

### WrongQuestion（错题）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| user_id | uint | 外键 → User |
| note_id | uint | 外键 → Note（关联知识点） |
| question | text | 题目内容 |
| answer | text | 正确答案 |
| my_answer | text | 我的答案 |
| error_type | string | 错误类型(计算/概念/审题/其他) |
| image_url | string | 题目图片 |
| mastery | int | 掌握程度(0-5) |

### ReviewPlan（复习计划）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| user_id | uint | 外键 → User |
| note_id | uint | 外键 → Note |
| next_review_at | timestamp | 下次复习时间 |
| interval_days | float | 当前间隔天数 |
| review_count | int | 已复习次数 |
| ease_factor | float | SM-2 难度因子(默认2.5) |

### KnowledgeEntity（知识实体）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| user_id | uint | 外键 → User |
| course_id | uint | 外键 → Course |
| name | string | 实体名称 |
| type | string | 类型(concept/definition/formula/theorem) |
| description | text | 描述 |
| note_ids | jsonb | 关联笔记 ID 列表 |

### KnowledgeRelation（知识关系）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键 |
| source_id | uint | 外键 → KnowledgeEntity |
| target_id | uint | 外键 → KnowledgeEntity |
| type | string | 关系类型(contains/prerequisite/application) |

## API 设计

### 认证 /auth

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 注册 |
| POST | /auth/login | 登录 |
| POST | /auth/refresh | 刷新 Token |

### 课程 /courses

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /courses | 课程列表 |
| POST | /courses | 创建课程 |
| PUT | /courses/:id | 更新课程 |
| DELETE | /courses/:id | 删除课程 |

### 笔记 /notes

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /courses/:id/notes | 课程下笔记列表 |
| POST | /courses/:id/notes | 创建笔记 |
| GET | /notes/:id | 笔记详情 |
| PUT | /notes/:id | 更新笔记 |
| DELETE | /notes/:id | 删除笔记 |
| GET | /notes/search?q= | 全文搜索 |

### 文件 /files

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /notes/:id/files | 上传文件 |
| POST | /files/:id/ocr | 触发 OCR 识别 |
| POST | /files/:id/parse | 解析课件内容 |

### 考点 /exam-points

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /notes/:id/exam-points | 笔记考点列表 |
| POST | /notes/:id/exam-points/analyze | AI 分析考点 |
| POST | /exam-points/generate-quick | 生成速记版 |

### 错题 /wrong-questions

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /wrong-questions | 错题列表（支持筛选） |
| POST | /wrong-questions | 添加错题 |
| PUT | /wrong-questions/:id | 更新错题 |
| POST | /wrong-questions/:id/analyze | AI 分析错误原因 |

### 复习 /reviews

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /reviews/today | 今日待复习 |
| POST | /reviews/:id/answer | 提交复习结果 |
| GET | /reviews/stats | 复习统计 |

### 知识图谱 /knowledge

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /knowledge/entities | 实体列表 |
| POST | /knowledge/entities/extract | AI 提取实体 |
| GET | /knowledge/graph | 图谱数据（节点+边） |
| POST | /knowledge/relations | 添加关系 |
| GET | /knowledge/related/:entityId | 关联推荐 |

### 智能问答 /qa

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /qa/ask | 提问（RAG 检索 + LLM 回答） |
| GET | /qa/history | 问答历史 |

## 前端架构

### 页面路由

**AppLayout**（侧边栏 + 顶栏 + 内容区）：

| 路径 | 页面 | 说明 |
|------|------|------|
| /notes | 笔记列表 | 课程分组 + 笔记卡片 |
| /notes/:id | 笔记编辑 | TipTap 编辑器 + 自动保存 |
| /files | 文件导入 | 拖拽上传 + 解析状态 |
| /exam-points | 考点速记 | 考点列表 + 速记版 |
| /wrong-questions | 错题本 | 错题卡片 + 筛选 |
| /review | 复习计划 | 今日复习 + 统计 |
| /knowledge-graph | 知识图谱 | D3/ECharts 交互图谱 |
| /qa | 智能问答 | 对话式问答面板 |

**AuthLayout**（居中卡片）：

| 路径 | 页面 |
|------|------|
| /login | 登录 |
| /register | 注册 |

### 核心共享组件

- **MarkdownEditor**：TipTap 封装，支持 LaTeX、代码高亮、表格
- **FileUploader**：拖拽上传，支持 PPT/PDF/Word/图片
- **KnowledgeGraph**：D3/ECharts 力导向图，缩放/拖拽/点击详情
- **ReviewCard**：SM-2 复习卡片，正面/背面翻转
- **ChatPanel**：问答对话面板，支持追问
- **SearchBar**：全局搜索，支持语义检索

## AI 服务集成

### Provider 抽象层

```go
type LLMProvider interface {
    Chat(ctx context.Context, messages []Message) (Response, error)
}

type OCRProvider interface {
    Recognize(ctx context.Context, image []byte) (OCRResult, error)
}

type EmbedProvider interface {
    Embed(ctx context.Context, texts []string) ([][]float64, error)
}
```

支持多 Provider 切换（智谱/通义/OpenAI），通过配置文件选择。

### Prompt 管理

- 模板存 YAML 配置文件，运行时加载
- 支持变量插值：`{{note_content}}`、`{{question}}`
- 无需重编译即可调优

模板清单：
- exam_analyze — 考点分析
- error_analyze — 错题归因
- entity_extract — 实体提取
- relation_infer — 关系推断
- qa_answer — RAG 问答
- quick_note — 速记生成

### 调用策略

- 超时控制：30s
- 重试：指数退避，最多 3 次
- Token 用量记录
- 降级：LLM 失败返回缓存结果
- 限流：防止 API 滥用

### 异步处理

耗时 AI 操作（OCR 识别、课件解析、实体批量提取、Embedding 生成）采用异步模式：
- 同步返回 `202 Accepted` + 任务 ID
- WebSocket 推送处理进度
- 前端轮询或监听 WebSocket 更新状态

### 核心 AI 流程

**RAG 问答流程**：
用户提问 → Embedding(query) → pgvector 语义检索 Top-K 笔记片段 → 拼接 Prompt(问题 + 检索上下文) → LLM 生成回答 → 关联到笔记

**考点分析流程**：
导入历年考题 → OCR/解析提取题目 → LLM 分析高频考点 → 关联到对应笔记 → 生成考点标注

**知识图谱构建流程**：
笔记内容 → LLM 提取实体(概念/定义/公式/定理) → LLM 推断实体关系 → 写入 Entity + Relation 表 → 前端渲染图谱

**复习计划流程**：
笔记创建/关联错题 → 初始化 ReviewPlan(interval=1d) → 用户复习评分(0-5) → SM-2 算法计算下次间隔 → 更新 next_review_at

## 项目目录结构

```
ai-note-student/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── config/          # 配置加载
│   │   ├── handler/         # HTTP 处理器
│   │   ├── service/         # 业务逻辑
│   │   ├── repository/      # 数据访问
│   │   ├── model/           # 数据模型
│   │   ├── middleware/      # JWT/日志/限流
│   │   ├── ai/              # AI 编排层
│   │   │   ├── provider/    # LLM/OCR/Embed 接口实现
│   │   │   └── prompt/      # 模板管理
│   │   └── storage/         # MinIO 客户端
│   ├── configs/config.yaml
│   ├── prompts/             # Prompt 模板 YAML
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 共享组件
│   │   ├── stores/          # Zustand 状态
│   │   ├── api/             # API 调用封装
│   │   ├── hooks/           # 自定义 Hooks
│   │   └── types/           # TS 类型定义
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Docker 部署方案

### 容器清单

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| frontend | Nginx + React 静态文件 | 80 | 前端 SPA |
| backend | Go Server | 8080 | API 服务 |
| postgres | PostgreSQL 16 + pgvector | 5432 | 数据库 |
| minio | MinIO | 9000/9001 | 文件存储 |

### 启动命令

```bash
docker compose up -d
```

### 数据持久化

- postgres_data：数据库数据卷
- minio_data：文件存储数据卷

### 开发模式

开发时不使用 Docker，前后端分别热重载：
- 前端：`npm run dev`（Vite dev server）
- 后端：`air`（Go 热重载工具）

## 开发阶段

### Phase 0 — 项目骨架

- Go 项目初始化 + Gin 路由骨架
- React + Vite + TS 脚手架
- Docker Compose 配置
- PostgreSQL + pgvector 初始化 + GORM 迁移
- 用户注册/登录/JWT 认证
- 基础 AppLayout + 前端路由

### Phase 1 — 笔记核心

- Course CRUD
- Note CRUD + TipTap Markdown 编辑器
- 标签系统
- 全文搜索
- 自动保存
- 侧边栏课程导航

### Phase 2 — 文件导入 + OCR

- MinIO 集成
- 文件上传/下载
- PPT/PDF/Word 解析
- OCR API 集成（百度 OCR + Mathpix）
- 公式 → LaTeX 转换
- 导入内容生成笔记

### Phase 3 — 学习辅助（毕设亮点）

- 考点分析 API + LLM 集成
- 考题导入 → 高频考点标注
- 速记版生成
- 错题本 CRUD + 图片上传
- AI 错题归因
- SM-2 复习计划
- 复习统计/学习报告

### Phase 4 — 知识体系

- LLM 实体提取 + 关系推断
- 知识图谱可视化（D3/ECharts）
- 手动添加实体/关系
- Embedding 生成 + pgvector 索引
- RAG 问答流程
- 关联推荐
- 问答历史
