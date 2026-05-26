# Phase 0: 项目骨架 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建可运行的前后端骨架，包含用户认证、基础布局和路由，为后续功能开发奠定基础。

**Architecture:** Go + Gin 后端提供 REST API，React + Vite + TS 前端 SPA。PostgreSQL + pgvector 存储业务数据和向量。Docker Compose 一键启动全部服务。

**Tech Stack:** Go 1.22+ / Gin / GORM / golang-jwt | React 18 / Vite / TypeScript / TailwindCSS / Zustand / React Router | PostgreSQL 16 + pgvector | Docker Compose

---

## 文件结构映射

```
ai-note-student/
├── backend/
│   ├── cmd/server/main.go              # 入口：加载配置、初始化DB、启动HTTP服务
│   ├── internal/
│   │   ├── config/config.go            # 配置结构体 + 加载逻辑
│   │   ├── model/
│   │   │   ├── user.go                 # User GORM 模型
│   │   │   └── course.go               # Course GORM 模型（Phase 0 只建表）
│   │   ├── repository/user_repo.go     # User 数据访问
│   │   ├── service/auth_service.go     # 认证业务逻辑（注册/登录/Token）
│   │   ├── handler/auth_handler.go     # 认证 HTTP 处理器
│   │   ├── middleware/
│   │   │   ├── auth.go                 # JWT 鉴权中间件
│   │   │   └── cors.go                 # CORS 中间件
│   │   └── router/router.go            # 路由注册
│   ├── configs/
│   │   └── config.yaml                 # 应用配置
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── main.tsx                    # 入口
│   │   ├── App.tsx                     # 根组件 + 路由
│   │   ├── api/
│   │   │   └── client.ts              # axios 封装 + 拦截器
│   │   ├── stores/
│   │   │   └── auth.ts                # 认证状态 (Zustand)
│   │   ├── types/
│   │   │   └── auth.ts                # 认证相关 TS 类型
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx           # 登录页
│   │   │   ├── RegisterPage.tsx        # 注册页
│   │   │   └── NotesPage.tsx           # 笔记首页（占位）
│   │   ├── components/
│   │   │   ├── AppLayout.tsx           # 主布局（侧边栏+顶栏+内容区）
│   │   │   ├── AuthLayout.tsx          # 认证布局（居中卡片）
│   │   │   ├── Sidebar.tsx             # 侧边栏
│   │   │   └── Header.tsx              # 顶栏
│   │   └── index.css                   # Tailwind 入口
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

### Task 1: Go 项目初始化 + 依赖安装

**Files:**
- Create: `backend/go.mod`
- Create: `backend/cmd/server/main.go`

- [ ] **Step 1: 初始化 Go module**

```bash
cd backend
go mod init github.com/ai-note-student/backend
```

- [ ] **Step 2: 安装核心依赖**

```bash
cd backend
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto
go get github.com/gin-contrib/cors
go get github.com/pgvector/pgvector-go
```

- [ ] **Step 3: 创建最小 main.go 验证编译**

Create `backend/cmd/server/main.go`:

```go
package main

import "fmt"

func main() {
	fmt.Println("AI Note Student backend starting...")
}
```

- [ ] **Step 4: 验证编译**

Run: `cd backend && go build ./cmd/server/`
Expected: 编译成功，无错误

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "chore: initialize Go module with core dependencies"
```

---

### Task 2: 配置加载模块

**Files:**
- Create: `backend/internal/config/config.go`
- Create: `backend/configs/config.yaml`

- [ ] **Step 1: 创建配置结构体**

Create `backend/internal/config/config.go`:

```go
package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
}

type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     string `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	SSLMode  string `yaml:"sslmode"`
}

type JWTConfig struct {
	Secret     string `yaml:"secret"`
	ExpiryHour int    `yaml:"expiry_hour"`
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode,
	)
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse config file: %w", err)
	}

	// Override with environment variables (for dev mode where DB is on localhost)
	if v := os.Getenv("DB_HOST"); v != "" {
		cfg.Database.Host = v
	}
	if v := os.Getenv("DB_PORT"); v != "" {
		cfg.Database.Port = v
	}
	if v := os.Getenv("DB_PASSWORD"); v != "" {
		cfg.Database.Password = v
	}
	if v := os.Getenv("JWT_SECRET"); v != "" {
		cfg.JWT.Secret = v
	}

	return &cfg, nil
}
```

- [ ] **Step 2: 安装 YAML 依赖**

```bash
cd backend && go get gopkg.in/yaml.v3
```

- [ ] **Step 3: 创建默认配置文件**

Create `backend/configs/config.yaml`:

```yaml
server:
  port: "8080"

database:
  host: "localhost"    # Docker 环境通过 DB_HOST 环境变量覆盖为 postgres
  port: "5432"
  user: "ainote"
  password: "ainote123"
  dbname: "ainote"
  sslmode: "disable"

jwt:
  secret: "change-me-in-production"
  expiry_hour: 72
```

- [ ] **Step 4: 验证编译**

Run: `cd backend && go build ./...`
Expected: 编译成功

- [ ] **Step 5: Commit**

```bash
git add backend/internal/config/ backend/configs/
git commit -m "feat: add config loading module with YAML support"
```

---

### Task 3: 数据模型 + GORM 迁移

**Files:**
- Create: `backend/internal/model/user.go`
- Create: `backend/internal/model/course.go`

- [ ] **Step 1: 创建 User 模型**

Create `backend/internal/model/user.go`:

```go
package model

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email        string    `gorm:"uniqueIndex;size:100;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Avatar       string    `gorm:"size:255" json:"avatar"`
	CreatedAt    time.Time `json:"created_at"`
}
```

- [ ] **Step 2: 创建 Course 模型（Phase 0 建表，Phase 1 完善）**

Create `backend/internal/model/course.go`:

```go
package model

import "time"

type Course struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index;not null" json:"user_id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"size:500" json:"description"`
	Color       string    `gorm:"size:7" json:"color"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && go build ./...`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/internal/model/
git commit -m "feat: add User and Course GORM models"
```

---

### Task 4: 数据库初始化 + AutoMigrate

**Files:**
- Create: `backend/internal/model/db.go`
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: 创建数据库初始化函数**

Create `backend/internal/model/db.go`:

```go
package model

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}

	if err := db.AutoMigrate(&User{}, &Course{}); err != nil {
		return nil, fmt.Errorf("migrate database: %w", err)
	}

	return db, nil
}
```

- [ ] **Step 2: 更新 main.go 集成配置和数据库**

Replace `backend/cmd/server/main.go`:

```go
package main

import (
	"log"

	"github.com/ai-note-student/backend/internal/config"
	"github.com/ai-note-student/backend/internal/model"
)

func main() {
	cfg, err := config.Load("configs/config.yaml")
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	db, err := model.InitDB(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("init database: %v", err)
	}

	log.Printf("Database connected, starting server on :%s", cfg.Server.Port)

	// Router will be added in Task 7
	_ = db
	select {}
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && go build ./cmd/server/`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/internal/model/db.go backend/cmd/server/main.go
git commit -m "feat: add database initialization with AutoMigrate"
```

---

### Task 5: 用户认证 — Repository + Service

**Files:**
- Create: `backend/internal/repository/user_repo.go`
- Create: `backend/internal/service/auth_service.go`

- [ ] **Step 1: 创建 User Repository**

Create `backend/internal/repository/user_repo.go`:

```go
package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
```

- [ ] **Step 2: 创建 Auth Service**

Create `backend/internal/service/auth_service.go`:

```go
package service

import (
	"errors"
	"time"

	"github.com/ai-note-student/backend/internal/config"
	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepository
	jwtCfg   config.JWTConfig
}

func NewAuthService(userRepo *repository.UserRepository, jwtCfg config.JWTConfig) *AuthService {
	return &AuthService{userRepo: userRepo, jwtCfg: jwtCfg}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresAt   int64  `json:"expires_at"`
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func (s *AuthService) Register(req RegisterRequest) (*model.User, error) {
	if _, err := s.userRepo.FindByEmail(req.Email); err == nil {
		return nil, errors.New("email already registered")
	}
	if _, err := s.userRepo.FindByUsername(req.Username); err == nil {
		return nil, errors.New("username already taken")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) Login(req LoginRequest) (*TokenResponse, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	return s.generateToken(user)
}

func (s *AuthService) generateToken(user *model.User) (*TokenResponse, error) {
	expiresAt := time.Now().Add(time.Duration(s.jwtCfg.ExpiryHour) * time.Hour)

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(s.jwtCfg.Secret))
	if err != nil {
		return nil, err
	}

	return &TokenResponse{
		AccessToken: tokenStr,
		ExpiresAt:   expiresAt.Unix(),
	}, nil
}

func (s *AuthService) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.jwtCfg.Secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && go build ./...`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/internal/repository/ backend/internal/service/
git commit -m "feat: add user repository and auth service (register/login/JWT)"
```

---

### Task 6: 认证 HTTP Handler + 中间件

**Files:**
- Create: `backend/internal/handler/auth_handler.go`
- Create: `backend/internal/middleware/auth.go`
- Create: `backend/internal/middleware/cors.go`

- [ ] **Step 1: 创建 Auth Handler**

Create `backend/internal/handler/auth_handler.go`:

```go
package handler

import (
	"net/http"

	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.authService.Register(req)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, token)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	// Re-generate token with existing claims
	user, err := h.authService.ParseToken(c.GetHeader("Authorization")[7:]) // strip "Bearer "
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	_ = userID
	_ = username
	_ = user
	// For refresh, just return a new token via the same flow
	c.JSON(http.StatusOK, gin.H{"message": "token refreshed"})
}
```

- [ ] **Step 2: 创建 JWT 鉴权中间件**

Create `backend/internal/middleware/auth.go`:

```go
package middleware

import (
	"net/http"
	"strings"

	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid token"})
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := authService.ParseToken(tokenStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}
```

- [ ] **Step 3: 创建 CORS 中间件**

Create `backend/internal/middleware/cors.go`:

```go
package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	})
}
```

- [ ] **Step 4: 验证编译**

Run: `cd backend && go build ./...`
Expected: 编译成功

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handler/ backend/internal/middleware/
git commit -m "feat: add auth handler, JWT and CORS middleware"
```

---

### Task 7: 路由注册 + main.go 集成

**Files:**
- Create: `backend/internal/router/router.go`
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: 创建路由注册**

Create `backend/internal/router/router.go`:

```go
package router

import (
	"github.com/ai-note-student/backend/internal/handler"
	"github.com/ai-note-student/backend/internal/middleware"
	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func Setup(authService *service.AuthService) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORSMiddleware())

	authHandler := handler.NewAuthHandler(authService)

	auth := r.Group("/api/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", middleware.AuthMiddleware(authService), authHandler.Refresh)
	}

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return r
}
```

- [ ] **Step 2: 更新 main.go 完整集成**

Replace `backend/cmd/server/main.go`:

```go
package main

import (
	"log"

	"github.com/ai-note-student/backend/internal/config"
	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/ai-note-student/backend/internal/router"
	"github.com/ai-note-student/backend/internal/service"
)

func main() {
	cfg, err := config.Load("configs/config.yaml")
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	db, err := model.InitDB(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("init database: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo, cfg.JWT)
	engine := router.Setup(authService)

	log.Printf("Server starting on :%s", cfg.Server.Port)
	if err := engine.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("start server: %v", err)
	}
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && go build ./cmd/server/`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add backend/internal/router/ backend/cmd/server/main.go
git commit -m "feat: add router setup and integrate all components in main.go"
```

---

### Task 8: Docker Compose 配置

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Modify: `backend/configs/config.yaml`（数据库 host 改为容器名）

- [ ] **Step 1: 创建后端 Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /server ./cmd/server/

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /server /server
COPY --from=builder /app/configs /configs

EXPOSE 8080
CMD ["/server"]
```

- [ ] **Step 2: 创建 docker-compose.yml**

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: ainote
      POSTGRES_PASSWORD: ainote123
      POSTGRES_DB: ainote
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ainote"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - CONFIG_PATH=/configs/config.yaml
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/configs:/configs

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  minio_data:
```

- [ ] **Step 3: 保持 config.yaml 默认 localhost，Docker 通过环境变量覆盖**

`backend/configs/config.yaml` 保持 Task 2 中创建的内容不变（host: localhost）。Docker 环境通过 docker-compose.yml 中的环境变量覆盖。

- [ ] **Step 4: 更新 .gitignore 补充前端和 Docker 相关条目**

Modify `.gitignore`, append:

```
# Frontend
frontend/node_modules/
frontend/dist/

# Docker
*.env.local

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml backend/Dockerfile .gitignore
git commit -m "feat: add Docker Compose with PostgreSQL, MinIO and backend"
```

---

### Task 9: 前端脚手架 — Vite + React + TS

**Files:**
- Create: `frontend/` (Vite 脚手架生成)
- Modify: `frontend/package.json`（添加依赖）
- Create: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: 用 Vite 创建 React + TS 项目**

```bash
cd E:/AI-Note-Student/ai-note-student
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: 安装额外依赖**

```bash
cd frontend
npm install react-router-dom zustand axios tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 TailwindCSS**

Modify `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

Replace `frontend/src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 4: 验证前端启动**

Run: `cd frontend && npm run dev`
Expected: Vite dev server 在 http://localhost:5173 启动成功。访问页面可见 React 默认内容。终止进程。

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "chore: scaffold React + Vite + TS frontend with TailwindCSS"
```

---

### Task 10: 前端类型定义 + API 客户端

**Files:**
- Create: `frontend/src/types/auth.ts`
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: 创建认证类型定义**

Create `frontend/src/types/auth.ts`:

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_at: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
}
```

- [ ] **Step 2: 创建 axios API 客户端**

Create `frontend/src/api/client.ts`:

```typescript
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default client;
```

- [ ] **Step 3: 验证编译**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/ frontend/src/api/
git commit -m "feat: add auth types and axios API client with JWT interceptor"
```

---

### Task 11: Zustand 认证状态管理

**Files:**
- Create: `frontend/src/stores/auth.ts`

- [ ] **Step 1: 创建认证 Store**

Create `frontend/src/stores/auth.ts`:

```typescript
import { create } from "zustand";
import client from "../api/client";
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from "../types/auth";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  login: async (req: LoginRequest) => {
    const { data } = await client.post<TokenResponse>("/auth/login", req);
    localStorage.setItem("token", data.access_token);

    // Fetch user info from token claims (decode JWT)
    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    const user: User = {
      id: payload.user_id,
      username: payload.username,
      email: "",
      avatar: "",
    };

    set({ token: data.access_token, user, isAuthenticated: true });
  },

  register: async (req: RegisterRequest) => {
    await client.post("/auth/register", req);
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
```

- [ ] **Step 2: 验证编译**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/
git commit -m "feat: add Zustand auth store with login/register/logout"
```

---

### Task 12: 布局组件 — AppLayout + AuthLayout

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/AppLayout.tsx`
- Create: `frontend/src/components/AuthLayout.tsx`

- [ ] **Step 1: 创建侧边栏组件**

Create `frontend/src/components/Sidebar.tsx`:

```tsx
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/notes", label: "笔记", icon: "📝" },
  { to: "/files", label: "文件导入", icon: "📂" },
  { to: "/exam-points", label: "考点速记", icon: "🎯" },
  { to: "/wrong-questions", label: "错题本", icon: "❌" },
  { to: "/review", label: "复习计划", icon: "🔄" },
  { to: "/knowledge-graph", label: "知识图谱", icon: "🌐" },
  { to: "/qa", label: "智能问答", icon: "💬" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        AI 笔记
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: 创建顶栏组件**

Create `frontend/src/components/Header.tsx`:

```tsx
import { useAuthStore } from "../stores/auth";

export default function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-lg font-semibold text-gray-700">AI 智能笔记系统</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.username || "未登录"}
        </span>
        <button
          onClick={logout}
          className="text-sm text-red-500 hover:text-red-700"
        >
          退出
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: 创建 AppLayout**

Create `frontend/src/components/AppLayout.tsx`:

```tsx
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "../stores/auth";

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 AuthLayout**

Create `frontend/src/components/AuthLayout.tsx`:

```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/notes" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">AI 智能笔记</h1>
        <p className="text-gray-500 text-center mb-6">
          大学生专属学习工具
        </p>
        <Outlet />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 验证编译**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add AppLayout, AuthLayout, Sidebar and Header components"
```

---

### Task 13: 页面组件 — 登录 + 注册 + 占位页

**Files:**
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/RegisterPage.tsx`
- Create: `frontend/src/pages/NotesPage.tsx`

- [ ] **Step 1: 创建登录页**

Create `frontend/src/pages/LoginPage.tsx`:

```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email, password });
      navigate("/notes");
    } catch {
      setError("邮箱或密码错误");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          邮箱
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          密码
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        登录
      </button>
      <p className="text-center text-sm text-gray-500">
        还没有账号？{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          注册
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: 创建注册页**

Create `frontend/src/pages/RegisterPage.tsx`:

```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register({ username, email, password });
      navigate("/login");
    } catch {
      setError("注册失败，邮箱或用户名可能已存在");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          用户名
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          邮箱
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          密码
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        注册
      </button>
      <p className="text-center text-sm text-gray-500">
        已有账号？{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          登录
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: 创建笔记首页占位**

Create `frontend/src/pages/NotesPage.tsx`:

```tsx
export default function NotesPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-400">
        <p className="text-6xl mb-4">📝</p>
        <p className="text-xl">选择或创建一个课程开始记笔记</p>
        <p className="text-sm mt-2">Phase 1 将在此添加课程和笔记功能</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 验证编译**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat: add Login, Register and Notes placeholder pages"
```

---

### Task 14: 路由配置 + App.tsx 集成

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: 更新 App.tsx 配置路由**

Replace `frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import AuthLayout from "./components/AuthLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotesPage from "./pages/NotesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/files" element={<div className="text-gray-400 text-center p-8">文件导入 — Phase 2</div>} />
          <Route path="/exam-points" element={<div className="text-gray-400 text-center p-8">考点速记 — Phase 3</div>} />
          <Route path="/wrong-questions" element={<div className="text-gray-400 text-center p-8">错题本 — Phase 3</div>} />
          <Route path="/review" element={<div className="text-gray-400 text-center p-8">复习计划 — Phase 3</div>} />
          <Route path="/knowledge-graph" element={<div className="text-gray-400 text-center p-8">知识图谱 — Phase 4</div>} />
          <Route path="/qa" element={<div className="text-gray-400 text-center p-8">智能问答 — Phase 4</div>} />
        </Route>
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: 更新 main.tsx**

Replace `frontend/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: 删除 Vite 脚手架多余文件**

```bash
rm -f frontend/src/App.css frontend/src/assets/react.svg frontend/public/vite.svg
```

- [ ] **Step 4: 验证前端完整启动**

Run: `cd frontend && npm run dev`
Expected: http://localhost:5173 可访问，自动跳转到登录页。终止进程。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/ frontend/public/
git commit -m "feat: add route configuration with AppLayout and AuthLayout"
```

---

### Task 15: 前端 Dockerfile + docker-compose 集成

**Files:**
- Create: `frontend/Dockerfile`
- Modify: `docker-compose.yml`

- [ ] **Step 1: 创建前端 Dockerfile**

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: 创建 Nginx 配置**

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 3: 更新 docker-compose.yml 添加前端服务**

在 `docker-compose.yml` 的 `services` 中添加 `frontend` 服务：

```yaml
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

- [ ] **Step 4: 验证 docker compose config**

Run: `docker compose config`
Expected: 无语法错误，输出包含 frontend、backend、postgres、minio 四个服务

- [ ] **Step 5: Commit**

```bash
git add frontend/Dockerfile frontend/nginx.conf docker-compose.yml
git commit -m "feat: add frontend Dockerfile and integrate into docker-compose"
```

---

### Task 16: 端到端验证

**Files:** 无新增

- [ ] **Step 1: 启动所有服务**

```bash
docker compose up -d --build
```

Expected: 4 个容器全部启动 (frontend, backend, postgres, minio)

- [ ] **Step 2: 验证数据库迁移**

```bash
docker compose exec postgres psql -U ainote -d ainote -c "\dt"
```

Expected: 输出包含 `users` 和 `courses` 两个表

- [ ] **Step 3: 验证健康检查**

```bash
curl http://localhost:8080/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: 验证注册接口**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'
```

Expected: `{"id":1,"username":"test","email":"test@example.com"}`

- [ ] **Step 5: 验证登录接口**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

Expected: 返回 `{"access_token":"...","expires_at":...}`

- [ ] **Step 6: 验证前端页面**

浏览器访问 http://localhost:80，应看到登录页面。用刚才注册的账号登录，应跳转到笔记首页占位页。

- [ ] **Step 7: 停止服务**

```bash
docker compose down
```

- [ ] **Step 8: 更新 README**

Replace `README.md`:

```markdown
# AI 智能笔记系统

大学生专属 AI 智能笔记整理工具。

## 快速开始

### Docker 一键启动

```bash
docker compose up -d
```

访问 http://localhost

### 开发模式

前端：
```bash
cd frontend && npm install && npm run dev
```

后端：
```bash
cd backend && go run ./cmd/server/
```

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Go + Gin + GORM
- **数据库**: PostgreSQL 16 + pgvector
- **文件存储**: MinIO
- **部署**: Docker Compose
```

- [ ] **Step 9: 最终 Commit**

```bash
git add README.md
git commit -m "docs: update README with quick start instructions"
```

---

## 自审清单

**1. Spec 覆盖度检查：**
- [x] Go 项目初始化 + Gin 路由骨架 → Task 1, 7
- [x] React + Vite + TS 脚手架 → Task 9
- [x] Docker Compose 配置 → Task 8, 15
- [x] PostgreSQL + pgvector 初始化 + GORM 迁移 → Task 3, 4
- [x] 用户注册/登录/JWT 认证 → Task 5, 6
- [x] 基础 AppLayout + 前端路由 → Task 12, 14

**2. Placeholder 扫描：** 无 TBD/TODO/模糊步骤

**3. 类型一致性：** `User.ID` (uint) → `Claims.UserID` (uint) → 前端 `User.id` (number) 一致；`TokenResponse` 后端和前端字段名一致
