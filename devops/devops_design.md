# AI Agent 可视化编排工具 - DevOps 部署运维方案

## 目录

1. [部署架构设计](#1-部署架构设计)
2. [容器化方案](#2-容器化方案)
3. [Kubernetes编排](#3-kubernetes编排)
4. [CI/CD流程](#4-cicd流程)
5. [监控方案](#5-监控方案)
6. [运维手册](#6-运维手册)
7. [配置示例](#7-配置示例)

---

## 1. 部署架构设计

### 1.1 整体部署拓扑图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              外部流量入口层                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        CloudFlare / CDN                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Ingress Controller (Nginx/Traefik)                    │   │
│  │                    - SSL终止 - 路由分发 - 限流防护                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              应用服务层 (Kubernetes)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Frontend      │  │   Backend API   │  │  Execution      │  │  WebSocket  │ │
│  │   (React/Vue)   │  │   (Node.js)     │  │  Engine         │  │  Gateway    │ │
│  │   - 3 Replicas  │  │   - 3 Replicas  │  │  (Python)       │  │  - 2 Replicas│ │
│  │   - Static CDN  │  │   - RESTful API │  │  - 5+ Replicas  │  │  - Real-time │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   LLM Proxy     │  │   Scheduler     │  │   Worker Pool   │                  │
│  │   Service       │  │   Service       │  │   (Celery/RQ)   │                  │
│  │   - 2 Replicas  │  │   - 2 Replicas  │  │   - 3+ Replicas │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              数据存储层                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   PostgreSQL    │  │    Redis        │  │   RabbitMQ/     │  │  MinIO/S3   │ │
│  │   (Primary)     │  │   (Cluster)     │  │   Kafka         │  │  (Object)   │ │
│  │   - Master      │  │   - 3 Nodes     │  │   - 3 Nodes     │  │  - HA Mode  │ │
│  │   - 2 Slaves    │  │   - Sentinel    │  │   - Mirrored    │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                                        │
│  │   Elasticsearch │  │   MongoDB       │                                        │
│  │   (Logs)        │  │   (Optional)    │                                        │
│  │   - 3 Nodes     │  │   - Replica Set │                                        │
│  └─────────────────┘  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              监控告警层                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Prometheus    │  │    Grafana      │  │   AlertManager  │  │   Loki      │ │
│  │   - Metrics     │  │   - Dashboard   │  │   - Alerts      │  │   - Logs    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                                        │
│  │   Jaeger        │  │   Fluentd/      │                                        │ │
│  │   - Tracing     │  │   Fluent Bit    │                                        │ │
│  └─────────────────┘  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 服务拆分策略

| 服务名称 | 功能描述 | 扩展策略 | 资源需求 |
|---------|---------|---------|---------|
| **frontend** | 可视化编辑器前端 | 水平扩展 (3-5副本) | CPU: 100m, Mem: 256Mi |
| **backend-api** | RESTful API服务 | 水平扩展 (3-10副本) | CPU: 500m, Mem: 512Mi |
| **execution-engine** | 工作流执行引擎 | 水平扩展 (5-20副本) | CPU: 1000m, Mem: 1Gi |
| **websocket-gateway** | 实时通信网关 | 水平扩展 (2-5副本) | CPU: 200m, Mem: 256Mi |
| **scheduler** | 任务调度服务 | 水平扩展 (2-3副本) | CPU: 300m, Mem: 512Mi |
| **worker** | 异步任务处理 | 水平扩展 (3-10副本) | CPU: 500m, Mem: 512Mi |
| **llm-proxy** | LLM服务代理 | 水平扩展 (2-3副本) | CPU: 200m, Mem: 256Mi |

### 1.3 负载均衡方案

```yaml
# 负载均衡配置策略
load_balancing:
  ingress:
    controller: nginx-ingress-controller
    ssl_termination: true
    rate_limiting:
      requests_per_second: 100
      burst: 150
  
  service_mesh:
    enabled: true
    tool: istio  # 或 linkerd
    features:
      - traffic_splitting
      - circuit_breaker
      - retry_policy
      - timeout_control
  
  internal_lb:
    backend_api:
      algorithm: round_robin
      health_check: /health
      timeout: 30s
    execution_engine:
      algorithm: least_connections  # 执行引擎使用最少连接
      health_check: /health
      timeout: 60s
```

### 1.4 高可用设计

```
┌─────────────────────────────────────────────────────────────────┐
│                     高可用架构设计                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Zone A     │    │  Zone B     │    │  Zone C     │         │
│  │ (可用区1)   │◄──►│ (可用区2)   │◄──►│ (可用区3)   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  多可用区部署策略：                                               │
│  - Pod 反亲和性：同一服务的Pod分布在不同可用区                      │
│  - 数据库主从：Master在Zone A, Slave分布在Zone B/C                │
│  - Redis Cluster：3主3跨可用区分布                                │
│  - 存储：使用云厂商多可用区存储服务                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**高可用配置要点：**

1. **Pod 反亲和性配置**
```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - ai-agent-platform
          topologyKey: topology.kubernetes.io/zone
```

2. **数据库高可用**
- PostgreSQL: 主从复制 + Patroni自动故障转移
- Redis: Cluster模式 + Sentinel监控
- RabbitMQ: 镜像队列 + 集群部署

3. **服务熔断与降级**
```yaml
circuitBreaker:
  consecutiveErrors: 5
  interval: 30s
  baseEjectionTime: 30s
  maxEjectionPercent: 50
```

---

## 2. 容器化方案

### 2.1 Dockerfile设计

#### 2.1.1 前端 Dockerfile

```dockerfile
# ============================================
# AI Agent Platform - Frontend Dockerfile
# ============================================

# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 安装安全更新
RUN apk upgrade --no-cache

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf 配置：**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api/ {
        proxy_pass http://backend-api:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket代理
    location /ws/ {
        proxy_pass http://websocket-gateway:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### 2.1.2 后端 API Dockerfile

```dockerfile
# ============================================
# AI Agent Platform - Backend API Dockerfile
# ============================================

FROM node:18-alpine

# 安装dumb-init处理信号
RUN apk add --no-cache dumb-init curl

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 切换到非root用户
USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# 使用dumb-init启动
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

#### 2.1.3 执行引擎 Dockerfile

```dockerfile
# ============================================
# AI Agent Platform - Execution Engine Dockerfile
# ============================================

FROM python:3.11-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY --chown=appuser:appuser . .

# 切换到非root用户
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**requirements.txt:**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
redis==5.0.1
pika==1.3.2
httpx==0.25.2
python-json-logger==2.0.7
prometheus-client==0.19.0
```

### 2.2 镜像构建优化

#### 2.2.1 多阶段构建优化

```dockerfile
# 优化后的多阶段构建示例
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### 2.2.2 镜像构建脚本

```bash
#!/bin/bash
# build-images.sh - 镜像构建脚本

set -e

REGISTRY="your-registry.com"
PROJECT="ai-agent-platform"
VERSION=${1:-"latest"}

echo "🔨 开始构建镜像..."
echo "版本: $VERSION"

# 构建前端镜像
echo "📦 构建 frontend 镜像..."
docker build -t $REGISTRY/$PROJECT/frontend:$VERSION \
  -t $REGISTRY/$PROJECT/frontend:latest \
  -f docker/frontend/Dockerfile ./frontend

# 构建后端镜像
echo "📦 构建 backend-api 镜像..."
docker build -t $REGISTRY/$PROJECT/backend-api:$VERSION \
  -t $REGISTRY/$PROJECT/backend-api:latest \
  -f docker/backend/Dockerfile ./backend

# 构建执行引擎镜像
echo "📦 构建 execution-engine 镜像..."
docker build -t $REGISTRY/$PROJECT/execution-engine:$VERSION \
  -t $REGISTRY/$PROJECT/execution-engine:latest \
  -f docker/engine/Dockerfile ./engine

# 推送到镜像仓库
echo "📤 推送镜像到仓库..."
docker push $REGISTRY/$PROJECT/frontend:$VERSION
docker push $REGISTRY/$PROJECT/backend-api:$VERSION
docker push $REGISTRY/$PROJECT/execution-engine:$VERSION

echo "✅ 镜像构建完成!"
```

### 2.3 镜像仓库管理

```yaml
# Harbor 镜像仓库配置
harbor:
  url: https://harbor.your-company.com
  project: ai-agent-platform
  retention_policy:
    keep_last: 10
    keep_tags:
      - "latest"
      - "stable"
      - "v*"
  
  # 镜像扫描
  vulnerability_scanning:
    enabled: true
    scan_on_push: true
    severity_threshold: high
  
  # 镜像签名
  notary:
    enabled: true
    sign_images: true
```

---

## 3. Kubernetes编排

### 3.1 Namespace 规划

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-agent-dev
  labels:
    environment: development
    app.kubernetes.io/name: ai-agent-platform
---
apiVersion: v1
kind: Namespace
metadata:
  name: ai-agent-staging
  labels:
    environment: staging
    app.kubernetes.io/name: ai-agent-platform
---
apiVersion: v1
kind: Namespace
metadata:
  name: ai-agent-prod
  labels:
    environment: production
    app.kubernetes.io/name: ai-agent-platform
```

### 3.2 ConfigMap 配置管理

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-agent-config
  namespace: ai-agent-prod
data:
  # 应用配置
  APP_ENV: "production"
  APP_PORT: "3000"
  LOG_LEVEL: "info"
  
  # 数据库配置
  DB_HOST: "postgresql.ai-agent-prod.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "ai_agent"
  DB_POOL_SIZE: "20"
  
  # Redis配置
  REDIS_HOST: "redis.ai-agent-prod.svc.cluster.local"
  REDIS_PORT: "6379"
  REDIS_DB: "0"
  
  # RabbitMQ配置
  RABBITMQ_HOST: "rabbitmq.ai-agent-prod.svc.cluster.local"
  RABBITMQ_PORT: "5672"
  RABBITMQ_VHOST: "/"
  
  # 执行引擎配置
  ENGINE_WORKERS: "4"
  ENGINE_TIMEOUT: "300"
  MAX_CONCURRENT_JOBS: "100"
  
  # LLM配置
  LLM_TIMEOUT: "60"
  LLM_MAX_RETRIES: "3"
  LLM_RATE_LIMIT: "100"
---
apiVersion: v1
kind: Secret
metadata:
  name: ai-agent-secrets
  namespace: ai-agent-prod
type: Opaque
stringData:
  DB_PASSWORD: "your-secure-password"
  REDIS_PASSWORD: "your-redis-password"
  RABBITMQ_USER: "ai-agent"
  RABBITMQ_PASSWORD: "your-rabbitmq-password"
  JWT_SECRET: "your-jwt-secret-key"
  OPENAI_API_KEY: "sk-your-openai-key"
  ANTHROPIC_API_KEY: "sk-your-anthropic-key"
```

### 3.3 Frontend Deployment

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: ai-agent-prod
  labels:
    app: frontend
    component: ui
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        component: ui
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - frontend
                topologyKey: topology.kubernetes.io/zone
      containers:
        - name: frontend
          image: your-registry.com/ai-agent-platform/frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 80
              name: http
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          securityContext:
            runAsNonRoot: true
            runAsUser: 101
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: ai-agent-prod
  labels:
    app: frontend
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
      name: http
  selector:
    app: frontend
```

### 3.4 Backend API Deployment

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
  namespace: ai-agent-prod
  labels:
    app: backend-api
    component: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
        component: api
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - backend-api
                topologyKey: topology.kubernetes.io/zone
      containers:
        - name: backend-api
          image: your-registry.com/ai-agent-platform/backend-api:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
          envFrom:
            - configMapRef:
                name: ai-agent-config
            - secretRef:
                name: ai-agent-secrets
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: 2000m
              memory: 2Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 30
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: backend-api
  namespace: ai-agent-prod
  labels:
    app: backend-api
spec:
  type: ClusterIP
  ports:
    - port: 3000
      targetPort: 3000
      protocol: TCP
      name: http
  selector:
    app: backend-api
```

### 3.5 Execution Engine Deployment

```yaml
# execution-engine-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: execution-engine
  namespace: ai-agent-prod
  labels:
    app: execution-engine
    component: engine
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: execution-engine
  template:
    metadata:
      labels:
        app: execution-engine
        component: engine
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - execution-engine
                topologyKey: topology.kubernetes.io/zone
      containers:
        - name: execution-engine
          image: your-registry.com/ai-agent-platform/execution-engine:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8000
              name: http
          envFrom:
            - configMapRef:
                name: ai-agent-config
            - secretRef:
                name: ai-agent-secrets
          resources:
            requests:
              cpu: 1000m
              memory: 1Gi
            limits:
              cpu: 4000m
              memory: 4Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
          securityContext:
            runAsNonRoot: true
            runAsUser: 999
            allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: execution-engine
  namespace: ai-agent-prod
  labels:
    app: execution-engine
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
      name: http
  selector:
    app: execution-engine
```

### 3.6 HPA 自动扩缩容

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-api-hpa
  namespace: ai-agent-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: execution-engine-hpa
  namespace: ai-agent-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: execution-engine
  minReplicas: 5
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Pods
      pods:
        metric:
          name: active_jobs
        target:
          type: AverageValue
          averageValue: "10"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Pods
          value: 5
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
        - type: Pods
          value: 2
          periodSeconds: 120
```

### 3.7 持久化存储

```yaml
# storage.yaml
# PostgreSQL PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-data
  namespace: ai-agent-prod
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd  # 使用SSD存储类
  resources:
    requests:
      storage: 100Gi
---
# Redis PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-data
  namespace: ai-agent-prod
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 20Gi
---
# 共享存储（文件上传）
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-storage
  namespace: ai-agent-prod
spec:
  accessModes:
    - ReadWriteMany  # 多Pod读写
  storageClassName: nfs-client  # NFS存储类
  resources:
    requests:
      storage: 500Gi
```

### 3.8 Ingress 配置

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-agent-ingress
  namespace: ai-agent-prod
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
    - hosts:
        - ai-agent.your-company.com
        - api.ai-agent.your-company.com
        - ws.ai-agent.your-company.com
      secretName: ai-agent-tls
  rules:
    - host: ai-agent.your-company.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
    - host: api.ai-agent.your-company.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-api
                port:
                  number: 3000
    - host: ws.ai-agent.your-company.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: websocket-gateway
                port:
                  number: 8080
```

---

## 4. CI/CD流程

### 4.1 整体流程图

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Developer │───►│    Push     │───►│    CI       │───►│   Build &   │
│   Commit    │    │    Code     │    │   Trigger   │    │    Test     │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                  │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│   Deploy    │◄───│   Deploy    │◄───│   Image     │◄───────────┘
│   to Prod   │    │   to Stg    │    │   Push      │
│   (Manual)  │    │  (Auto)     │    │   (Auto)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 4.2 GitHub Actions CI/CD 配置

```yaml
# .github/workflows/ci-cd.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ==================== 测试阶段 ====================
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # ==================== 安全扫描 ====================
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # ==================== 构建阶段 ====================
  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [frontend, backend-api, execution-engine]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=,suffix=,format=short

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # ==================== 部署到开发环境 ====================
  deploy-dev:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment:
      name: development
      url: https://ai-agent-dev.your-company.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name ai-agent-dev-cluster

      - name: Deploy to development
        run: |
          kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }} -n ai-agent-dev
          kubectl set image deployment/backend-api backend-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend-api:${{ github.sha }} -n ai-agent-dev
          kubectl set image deployment/execution-engine execution-engine=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/execution-engine:${{ github.sha }} -n ai-agent-dev
          kubectl rollout status deployment/frontend -n ai-agent-dev --timeout=300s
          kubectl rollout status deployment/backend-api -n ai-agent-dev --timeout=300s
          kubectl rollout status deployment/execution-engine -n ai-agent-dev --timeout=300s

  # ==================== 部署到测试环境 ====================
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://ai-agent-staging.your-company.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name ai-agent-staging-cluster

      - name: Deploy to staging
        run: |
          kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }} -n ai-agent-staging
          kubectl set image deployment/backend-api backend-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend-api:${{ github.sha }} -n ai-agent-staging
          kubectl set image deployment/execution-engine execution-engine=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/execution-engine:${{ github.sha }} -n ai-agent-staging
          kubectl rollout status deployment/frontend -n ai-agent-staging --timeout=300s
          kubectl rollout status deployment/backend-api -n ai-agent-staging --timeout=300s
          kubectl rollout status deployment/execution-engine -n ai-agent-staging --timeout=300s

      - name: Run smoke tests
        run: |
          npm install -g newman
          newman run tests/smoke-tests.json --env-var baseUrl=https://ai-agent-staging.your-company.com

  # ==================== 部署到生产环境 ====================
  deploy-production:
    needs: [build, deploy-staging]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://ai-agent.your-company.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name ai-agent-prod-cluster

      - name: Deploy to production (Canary)
        run: |
          # 金丝雀发布：先部署10%流量
          kubectl set image deployment/frontend-canary frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.ref_name }} -n ai-agent-prod
          kubectl set image deployment/backend-api-canary backend-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend-api:${{ github.ref_name }} -n ai-agent-prod
          sleep 300  # 等待5分钟观察
          
      - name: Verify canary deployment
        run: |
          # 检查错误率
          ERROR_RATE=$(curl -s "https://prometheus/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq '.data.result[0].value[1]')
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "Error rate too high, rolling back..."
            kubectl rollout undo deployment/frontend-canary -n ai-agent-prod
            kubectl rollout undo deployment/backend-api-canary -n ai-agent-prod
            exit 1
          fi

      - name: Full deployment
        run: |
          # 全量部署
          kubectl set image deployment/frontend frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.ref_name }} -n ai-agent-prod
          kubectl set image deployment/backend-api backend-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend-api:${{ github.ref_name }} -n ai-agent-prod
          kubectl set image deployment/execution-engine execution-engine=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/execution-engine:${{ github.ref_name }} -n ai-agent-prod
          kubectl rollout status deployment/frontend -n ai-agent-prod --timeout=300s
          kubectl rollout status deployment/backend-api -n ai-agent-prod --timeout=300s
          kubectl rollout status deployment/execution-engine -n ai-agent-prod --timeout=300s

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Production deployment completed: ${{ github.ref_name }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 4.3 灰度发布策略

```yaml
# canary-deployment.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: backend-api
  namespace: ai-agent-prod
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-api
  service:
    port: 3000
    gateways:
      - istio-gateway
    hosts:
      - api.ai-agent.your-company.com
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m
    webhooks:
      - name: load-test
        url: http://flagger-loadtester.test/
        timeout: 5s
        metadata:
          cmd: "hey -z 1m -q 10 -c 2 http://backend-api:3000/health"
      - name: conformance-test
        type: pre-rollout
        url: http://flagger-loadtester.test/
        timeout: 30s
        metadata:
          type: bash
          cmd: "curl -sf http://backend-api-canary:3000/health"
```

### 4.4 回滚机制

```bash
#!/bin/bash
# rollback.sh - 快速回滚脚本

NAMESPACE=${1:-"ai-agent-prod"}
DEPLOYMENT=${2:-"backend-api"}
REVISION=${3:-""}

echo "🔄 开始回滚 $DEPLOYMENT 在 $NAMESPACE 命名空间..."

if [ -z "$REVISION" ]; then
    # 回滚到上一个版本
    kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE
else
    # 回滚到指定版本
    kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE --to-revision=$REVISION
fi

# 等待回滚完成
echo "⏳ 等待回滚完成..."
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=300s

# 验证回滚结果
if [ $? -eq 0 ]; then
    echo "✅ 回滚成功!"
    # 发送通知
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-type: application/json' \
        -d "{\"text\":\"⚠️ $DEPLOYMENT 已回滚到上一个版本\"}"
else
    echo "❌ 回滚失败!"
    exit 1
fi
```

---

## 5. 监控方案

### 5.1 指标监控 (Prometheus + Grafana)

#### 5.1.1 Prometheus 配置

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: ai-agent-prod
        replica: '{{.ExternalURL}}'

    rule_files:
      - /etc/prometheus/rules/*.yml

    alertmanager_config:
      alertmanagers:
        - static_configs:
            - targets: ['alertmanager:9093']

    scrape_configs:
      # Kubernetes API Server
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
            action: keep
            regex: default;kubernetes;https

      # Kubernetes Nodes
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
          - target_label: __address__
            replacement: kubernetes.default.svc:443
          - source_labels: [__meta_kubernetes_node_name]
            regex: (.+)
            target_label: __metrics_path__
            replacement: /api/v1/nodes/${1}/proxy/metrics

      # Kubernetes Pods
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name

      # 应用自定义指标
      - job_name: 'ai-agent-backend'
        static_configs:
          - targets: ['backend-api.ai-agent-prod.svc.cluster.local:3000']
        metrics_path: /metrics
        scrape_interval: 10s

      - job_name: 'ai-agent-engine'
        static_configs:
          - targets: ['execution-engine.ai-agent-prod.svc.cluster.local:8000']
        metrics_path: /metrics
        scrape_interval: 10s

      # PostgreSQL Exporter
      - job_name: 'postgresql'
        static_configs:
          - targets: ['postgres-exporter.monitoring.svc.cluster.local:9187']

      # Redis Exporter
      - job_name: 'redis'
        static_configs:
          - targets: ['redis-exporter.monitoring.svc.cluster.local:9121']

  # 告警规则
  alert_rules.yml: |
    groups:
      - name: ai-agent-alerts
        rules:
          # 高错误率告警
          - alert: HighErrorRate
            expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "High error rate detected"
              description: "Error rate is above 5% for {{ $labels.service }}"

          # 高延迟告警
          - alert: HighLatency
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High latency detected"
              description: "95th percentile latency is above 2s for {{ $labels.service }}"

          # Pod重启告警
          - alert: PodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total[10m]) > 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Pod is crash looping"
              description: "Pod {{ $labels.pod }} is restarting frequently"

          # 队列积压告警
          - alert: QueueBacklog
            expr: rabbitmq_queue_messages > 1000
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Message queue backlog"
              description: "Queue {{ $labels.queue }} has {{ $value }} messages"

          # 执行引擎任务堆积
          - alert: ExecutionEngineBacklog
            expr: execution_engine_pending_jobs > 50
            for: 3m
            labels:
              severity: warning
            annotations:
              summary: "Execution engine task backlog"
              description: "There are {{ $value }} pending jobs"

          # 数据库连接池告警
          - alert: DatabaseConnectionPoolExhausted
            expr: pg_stat_activity_count > 80
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "Database connection pool near exhaustion"
              description: "{{ $value }} active connections"
```

#### 5.1.2 Grafana Dashboard 配置

```json
{
  "dashboard": {
    "title": "AI Agent Platform - Overview",
    "tags": ["ai-agent", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}} - {{status}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Active Jobs",
        "type": "stat",
        "targets": [
          {
            "expr": "execution_engine_active_jobs",
            "legendFormat": "Active"
          },
          {
            "expr": "execution_engine_pending_jobs",
            "legendFormat": "Pending"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "id": 5,
        "title": "Pod Status",
        "type": "table",
        "targets": [
          {
            "expr": "kube_pod_status_phase{namespace=\"ai-agent-prod\"}",
            "format": "table"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 16}
      },
      {
        "id": 6,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Active Connections"
          },
          {
            "expr": "pg_settings_max_connections",
            "legendFormat": "Max Connections"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 24}
      },
      {
        "id": 7,
        "title": "Redis Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "redis_memory_used_bytes",
            "legendFormat": "Used"
          },
          {
            "expr": "redis_memory_max_bytes",
            "legendFormat": "Max"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 24}
      },
      {
        "id": 8,
        "title": "Message Queue",
        "type": "graph",
        "targets": [
          {
            "expr": "rabbitmq_queue_messages",
            "legendFormat": "{{queue}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 32}
      },
      {
        "id": 9,
        "title": "LLM API Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(llm_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{provider}} - {{model}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 32}
      }
    ]
  }
}
```

### 5.2 日志收集 (Loki + Fluent Bit)

```yaml
# fluent-bit-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020

    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/log/containers/*.log
        Parser            docker
        DB                /var/log/flb_kube.db
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On
        Refresh_Interval  10

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        Keep_Log            Off
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off

    [FILTER]
        Name                nest
        Match               kube.*
        Operation           lift
        Nested_under        kubernetes
        Add_prefix          kubernetes_

    [FILTER]
        Name                modify
        Match               kube.*
        Rename              kubernetes_pod_name pod
        Rename              kubernetes_namespace_name namespace
        Rename              kubernetes_container_name container
        Rename              kubernetes_host node

    [OUTPUT]
        Name            loki
        Match           kube.*
        Host            loki.logging.svc.cluster.local
        Port            3100
        Labels          job=fluent-bit,namespace=$namespace,pod=$pod,container=$container
        Drop_Records    kubernetes_

  parsers.conf: |
    [PARSER]
        Name        docker
        Format      json
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L
        Time_Keep   On
```

### 5.3 链路追踪 (Jaeger)

```yaml
# jaeger-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
        - name: jaeger
          image: jaegertracing/all-in-one:1.45
          ports:
            - containerPort: 16686  # UI
            - containerPort: 14268  # Collector HTTP
            - containerPort: 14250  # Collector gRPC
            - containerPort: 9411   # Zipkin
          env:
            - name: COLLECTOR_OTLP_ENABLED
              value: "true"
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
---
apiVersion: v1
kind: Service
metadata:
  name: jaeger
  namespace: observability
spec:
  type: ClusterIP
  ports:
    - port: 16686
      name: ui
    - port: 14268
      name: collector-http
    - port: 14250
      name: collector-grpc
    - port: 9411
      name: zipkin
  selector:
    app: jaeger
```

### 5.4 告警规则

```yaml
# alertmanager-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'smtp.gmail.com:587'
      smtp_from: 'alerts@your-company.com'
      smtp_auth_username: 'alerts@your-company.com'
      smtp_auth_password: 'your-smtp-password'
      slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

    route:
      receiver: 'default'
      group_by: ['alertname', 'severity']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      routes:
        - match:
            severity: critical
          receiver: 'critical-alerts'
          continue: true
        - match:
            severity: warning
          receiver: 'warning-alerts'

    receivers:
      - name: 'default'
        slack_configs:
          - channel: '#alerts'
            title: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

      - name: 'critical-alerts'
        slack_configs:
          - channel: '#critical-alerts'
            title: '🔴 CRITICAL: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
            send_resolved: true
        email_configs:
          - to: 'oncall@your-company.com'
            subject: '🔴 CRITICAL Alert: {{ .GroupLabels.alertname }}'
            body: |
              {{ range .Alerts }}
              Alert: {{ .Annotations.summary }}
              Description: {{ .Annotations.description }}
              Severity: {{ .Labels.severity }}
              {{ end }}
        pagerduty_configs:
          - service_key: 'your-pagerduty-key'
            severity: critical

      - name: 'warning-alerts'
        slack_configs:
          - channel: '#warnings'
            title: '⚠️ WARNING: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

    inhibit_rules:
      - source_match:
          severity: 'critical'
        target_match:
          severity: 'warning'
        equal: ['alertname']
```

---

## 6. 运维手册

### 6.1 环境搭建步骤

#### 6.1.1 开发环境搭建

```bash
#!/bin/bash
# setup-dev-env.sh

echo "🚀 开始搭建开发环境..."

# 1. 安装依赖工具
echo "📦 安装依赖工具..."
# Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# kubectl
if ! command -v kubectl &> /dev/null; then
    curl -LO "https://dl.k8s/release/$(curl -L -s https://dl.k8s/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
fi

# Helm
if ! command -v helm &> /dev/null; then
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# kind (本地K8s集群)
if ! command -v kind &> /dev/null; then
    curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
    chmod +x ./kind
    sudo mv ./kind /usr/local/bin/kind
fi

# 2. 创建本地K8s集群
echo "☸️ 创建本地K8s集群..."
cat <<EOF | kind create cluster --name ai-agent-dev --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 80
        hostPort: 8080
        protocol: TCP
      - containerPort: 443
        hostPort: 8443
        protocol: TCP
  - role: worker
  - role: worker
EOF

# 3. 安装Ingress Nginx
echo "🌐 安装 Ingress Nginx..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# 4. 安装监控组件
echo "📊 安装监控组件..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.enabled=true

# 5. 部署应用
echo "🎯 部署应用..."
kubectl apply -k k8s/overlays/development/

echo "✅ 开发环境搭建完成!"
echo "访问地址:"
echo "  - 应用: http://localhost:8080"
echo "  - Grafana: http://localhost:8080/grafana"
```

#### 6.1.2 生产环境搭建

```bash
#!/bin/bash
# setup-prod-env.sh

set -e

ENVIRONMENT=${1:-"production"}
CLUSTER_NAME="ai-agent-${ENVIRONMENT}"
REGION="us-west-2"

echo "🚀 开始搭建生产环境: $ENVIRONMENT"

# 1. 创建EKS集群
echo "☸️ 创建EKS集群..."
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --node-type m5.xlarge \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed \
  --asg-access \
  --external-dns-access \
  --full-ecr-access

# 2. 安装核心组件
echo "📦 安装核心组件..."

# Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml

# Cert Manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 等待Cert Manager就绪
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

# 3. 安装监控栈
echo "📊 安装监控栈..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --values helm-values/monitoring-values.yaml

# 4. 安装日志收集
echo "📝 安装日志收集..."
helm install loki grafana/loki-stack \
  --namespace logging --create-namespace \
  --set fluent-bit.enabled=true

# 5. 安装存储类
echo "💾 安装存储类..."
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
EOF

# 6. 部署应用
echo "🎯 部署应用..."
kubectl apply -k k8s/overlays/${ENVIRONMENT}/

echo "✅ 生产环境搭建完成!"
```

### 6.2 日常运维操作

#### 6.2.1 常用运维命令

```bash
#!/bin/bash
# ops-commands.sh - 常用运维命令

NAMESPACE="ai-agent-prod"

# 查看Pod状态
alias pods='kubectl get pods -n $NAMESPACE -o wide'

# 查看服务状态
alias svc='kubectl get svc -n $NAMESPACE'

# 查看Ingress
alias ing='kubectl get ingress -n $NAMESPACE'

# 查看HPA状态
alias hpa='kubectl get hpa -n $NAMESPACE'

# 查看日志
function logs() {
    kubectl logs -n $NAMESPACE -f deployment/$1 --tail=100
}

# 进入Pod
function exec() {
    kubectl exec -it -n $NAMESPACE deployment/$1 -- /bin/sh
}

# 查看资源使用
function top() {
    kubectl top pods -n $NAMESPACE
}

# 查看事件
function events() {
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -20
}

# 扩缩容
function scale() {
    kubectl scale deployment/$1 --replicas=$2 -n $NAMESPACE
}

# 重启服务
function restart() {
    kubectl rollout restart deployment/$1 -n $NAMESPACE
}

# 查看Deployment历史
function history() {
    kubectl rollout history deployment/$1 -n $NAMESPACE
}

# 端口转发
function forward() {
    kubectl port-forward -n $NAMESPACE svc/$1 $2:$2
}
```

#### 6.2.2 备份脚本

```bash
#!/bin/bash
# backup.sh - 数据备份脚本

set -e

BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30
NAMESPACE="ai-agent-prod"

mkdir -p $BACKUP_DIR

echo "🔄 开始备份..."

# 1. 备份PostgreSQL
echo "💾 备份 PostgreSQL..."
kubectl exec -n $NAMESPACE postgresql-0 -- pg_dumpall -U postgres > $BACKUP_DIR/postgresql.sql

# 2. 备份Redis
echo "💾 备份 Redis..."
kubectl exec -n $NAMESPACE redis-0 -- redis-cli BGSAVE
kubectl cp $NAMESPACE/redis-0:/data/dump.rdb $BACKUP_DIR/redis.rdb

# 3. 备份配置文件
echo "💾 备份配置文件..."
kubectl get configmap -n $NAMESPACE -o yaml > $BACKUP_DIR/configmaps.yaml
kubectl get secret -n $NAMESPACE -o yaml > $BACKUP_DIR/secrets.yaml

# 4. 压缩备份
echo "📦 压缩备份..."
tar -czf $BACKUP_DIR.tar.gz -C $(dirname $BACKUP_DIR) $(basename $BACKUP_DIR)
rm -rf $BACKUP_DIR

# 5. 上传到S3
echo "☁️ 上传到S3..."
aws s3 cp $BACKUP_DIR.tar.gz s3://ai-agent-backups/

# 6. 清理旧备份
echo "🧹 清理旧备份..."
find /backup -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
aws s3 ls s3://ai-agent-backups/ | awk '{print $4}' | while read file; do
    aws s3 rm s3://ai-agent-backups/$file
done

echo "✅ 备份完成: $BACKUP_DIR.tar.gz"
```

### 6.3 故障排查指南

#### 6.3.1 Pod启动失败排查

```bash
#!/bin/bash
# troubleshoot-pod.sh

POD_NAME=$1
NAMESPACE=${2:-"ai-agent-prod"}

echo "🔍 排查 Pod: $POD_NAME"

# 1. 查看Pod描述
echo "=== Pod 描述 ==="
kubectl describe pod $POD_NAME -n $NAMESPACE

# 2. 查看Pod日志
echo "=== Pod 日志 ==="
kubectl logs $POD_NAME -n $NAMESPACE --previous 2>/dev/null || kubectl logs $POD_NAME -n $NAMESPACE

# 3. 查看事件
echo "=== 相关事件 ==="
kubectl get events -n $NAMESPACE --field-selector involvedObject.name=$POD_NAME --sort-by='.lastTimestamp'

# 4. 检查资源限制
echo "=== 资源使用 ==="
kubectl top pod $POD_NAME -n $NAMESPACE 2>/dev/null || echo "metrics-server 未安装"

# 5. 检查节点状态
echo "=== 节点状态 ==="
NODE=$(kubectl get pod $POD_NAME -n $NAMESPACE -o jsonpath='{.spec.nodeName}')
kubectl describe node $NODE | grep -A 5 "Conditions"
```

#### 6.3.2 性能问题排查

```bash
#!/bin/bash
# troubleshoot-performance.sh

NAMESPACE="ai-agent-prod"

echo "🔍 性能问题排查"

# 1. 高CPU使用
echo "=== 高CPU使用的Pod ==="
kubectl top pods -n $NAMESPACE --sort-by=cpu | head -10

# 2. 高内存使用
echo "=== 高内存使用的Pod ==="
kubectl top pods -n $NAMESPACE --sort-by=memory | head -10

# 3. 查看HPA状态
echo "=== HPA状态 ==="
kubectl get hpa -n $NAMESPACE

# 4. 查看Pending Pod
echo "=== Pending状态的Pod ==="
kubectl get pods -n $NAMESPACE --field-selector=status.phase=Pending

# 5. 查看节点资源
echo "=== 节点资源 ==="
kubectl top nodes

# 6. 查看事件告警
echo "=== 告警事件 ==="
kubectl get events -n $NAMESPACE --field-selector type=Warning --sort-by='.lastTimestamp' | tail -20
```

#### 6.3.3 网络问题排查

```bash
#!/bin/bash
# troubleshoot-network.sh

NAMESPACE="ai-agent-prod"
SERVICE=$1

echo "🔍 网络问题排查: $SERVICE"

# 1. 检查Service
echo "=== Service状态 ==="
kubectl get svc $SERVICE -n $NAMESPACE -o wide
kubectl describe svc $SERVICE -n $NAMESPACE

# 2. 检查Endpoints
echo "=== Endpoints ==="
kubectl get endpoints $SERVICE -n $NAMESPACE

# 3. 检查Pod标签
echo "=== Pod标签 ==="
kubectl get pods -n $NAMESPACE -l app=$SERVICE --show-labels

# 4. 测试连通性
echo "=== 连通性测试 ==="
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- \
    curl -v http://$SERVICE.$NAMESPACE.svc.cluster.local/health

# 5. 检查Ingress
echo "=== Ingress状态 ==="
kubectl get ingress -n $NAMESPACE
kubectl describe ingress -n $NAMESPACE

# 6. 检查证书
echo "=== 证书状态 ==="
kubectl get certificate -n $NAMESPACE
```

### 6.4 备份恢复方案

```bash
#!/bin/bash
# restore.sh - 数据恢复脚本

set -e

BACKUP_FILE=$1
NAMESPACE="ai-agent-prod"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

echo "🔄 开始恢复: $BACKUP_FILE"

# 1. 从S3下载备份
if [[ $BACKUP_FILE == s3://* ]]; then
    echo "☁️ 从S3下载备份..."
    aws s3 cp $BACKUP_FILE /tmp/restore.tar.gz
    BACKUP_FILE=/tmp/restore.tar.gz
fi

# 2. 解压备份
RESTORE_DIR="/tmp/restore_$(date +%s)"
mkdir -p $RESTORE_DIR
tar -xzf $BACKUP_FILE -C $RESTORE_DIR
BACKUP_DIR=$(ls $RESTORE_DIR)

# 3. 恢复PostgreSQL
echo "💾 恢复 PostgreSQL..."
kubectl cp $RESTORE_DIR/$BACKUP_DIR/postgresql.sql $NAMESPACE/postgresql-0:/tmp/restore.sql
kubectl exec -it -n $NAMESPACE postgresql-0 -- psql -U postgres -f /tmp/restore.sql

# 4. 恢复Redis
echo "💾 恢复 Redis..."
kubectl cp $RESTORE_DIR/$BACKUP_DIR/redis.rdb $NAMESPACE/redis-0:/data/dump.rdb
kubectl exec -it -n $NAMESPACE redis-0 -- redis-cli SHUTDOWN SAVE

# 5. 清理
echo "🧹 清理临时文件..."
rm -rf $RESTORE_DIR /tmp/restore.tar.gz

echo "✅ 恢复完成!"
```

---

## 7. 配置示例

### 7.1 Docker Compose（开发环境）

```yaml
# docker-compose.yaml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
      - REACT_APP_WS_URL=ws://localhost:8081
    depends_on:
      - backend-api
    networks:
      - ai-agent-network

  # 后端API服务
  backend-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgresql
      - DB_PORT=5432
      - DB_NAME=ai_agent
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PORT=5672
      - RABBITMQ_USER=guest
      - RABBITMQ_PASSWORD=guest
      - JWT_SECRET=dev-secret-key
    depends_on:
      - postgresql
      - redis
      - rabbitmq
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - ai-agent-network

  # 执行引擎
  execution-engine:
    build:
      context: ./engine
      dockerfile: Dockerfile
    ports:
      - "8082:8000"
    environment:
      - ENV=development
      - API_URL=http://backend-api:3000
      - REDIS_URL=redis://redis:6379/0
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
      - DB_URL=postgresql://postgres:postgres@postgresql:5432/ai_agent
    depends_on:
      - postgresql
      - redis
      - rabbitmq
      - backend-api
    volumes:
      - ./engine:/app
    networks:
      - ai-agent-network

  # PostgreSQL数据库
  postgresql:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=ai_agent
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - ai-agent-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ai-agent-network

  # RabbitMQ消息队列
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=guest
      - RABBITMQ_DEFAULT_PASS=guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - ai-agent-network

  # MinIO对象存储
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - ai-agent-network

  # 监控 - Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - ai-agent-network

  # 监控 - Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - ai-agent-network

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  minio_data:
  prometheus_data:
  grafana_data:

networks:
  ai-agent-network:
    driver: bridge
```

### 7.2 Kubernetes YAML（生产环境）

```yaml
# k8s/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ai-agent-prod

resources:
  - namespace.yaml
  - configmap.yaml
  - secret.yaml
  - frontend-deployment.yaml
  - backend-deployment.yaml
  - engine-deployment.yaml
  - scheduler-deployment.yaml
  - worker-deployment.yaml
  - websocket-deployment.yaml
  - services.yaml
  - ingress.yaml
  - hpa.yaml
  - storage.yaml

commonLabels:
  app.kubernetes.io/name: ai-agent-platform
  app.kubernetes.io/version: "1.0.0"

images:
  - name: frontend
    newName: your-registry.com/ai-agent-platform/frontend
    newTag: latest
  - name: backend-api
    newName: your-registry.com/ai-agent-platform/backend-api
    newTag: latest
  - name: execution-engine
    newName: your-registry.com/ai-agent-platform/execution-engine
    newTag: latest
```

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ai-agent-prod

resources:
  - ../../base
  - pdb.yaml  # PodDisruptionBudget

patchesStrategicMerge:
  - replicas-patch.yaml
  - resources-patch.yaml

configMapGenerator:
  - name: ai-agent-config
    behavior: merge
    literals:
      - APP_ENV=production
      - LOG_LEVEL=warn

replicas:
  - name: frontend
    count: 5
  - name: backend-api
    count: 5
  - name: execution-engine
    count: 10
```

### 7.3 配置文件模板

```yaml
# config/application.yaml - 应用配置模板
app:
  name: AI Agent Platform
  version: 1.0.0
  environment: ${APP_ENV:development}
  
server:
  port: ${APP_PORT:3000}
  host: ${APP_HOST:0.0.0.0}
  
logging:
  level: ${LOG_LEVEL:info}
  format: json
  output: stdout

database:
  postgresql:
    host: ${DB_HOST:localhost}
    port: ${DB_PORT:5432}
    name: ${DB_NAME:ai_agent}
    user: ${DB_USER:postgres}
    password: ${DB_PASSWORD:}
    pool:
      min: 5
      max: ${DB_POOL_SIZE:20}
    ssl:
      enabled: ${DB_SSL_ENABLED:false}
      
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    db: ${REDIS_DB:0}
    cluster:
      enabled: ${REDIS_CLUSTER_ENABLED:false}
      nodes: ${REDIS_CLUSTER_NODES:}

message_queue:
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    user: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASSWORD:guest}
    vhost: ${RABBITMQ_VHOST:/}
    
  kafka:
    enabled: ${KAFKA_ENABLED:false}
    brokers: ${KAFKA_BROKERS:}
    
execution_engine:
  workers: ${ENGINE_WORKERS:4}
  timeout: ${ENGINE_TIMEOUT:300}
  max_concurrent_jobs: ${MAX_CONCURRENT_JOBS:100}
  queue:
    type: ${QUEUE_TYPE:rabbitmq}
    
llm:
  providers:
    openai:
      api_key: ${OPENAI_API_KEY:}
      base_url: ${OPENAI_BASE_URL:https://api.openai.com/v1}
      timeout: ${LLM_TIMEOUT:60}
      max_retries: ${LLM_MAX_RETRIES:3}
      rate_limit: ${LLM_RATE_LIMIT:100}
      
    anthropic:
      api_key: ${ANTHROPIC_API_KEY:}
      timeout: ${LLM_TIMEOUT:60}
      max_retries: ${LLM_MAX_RETRIES:3}
      
    azure:
      api_key: ${AZURE_OPENAI_API_KEY:}
      endpoint: ${AZURE_OPENAI_ENDPOINT:}
      deployment: ${AZURE_OPENAI_DEPLOYMENT:}

security:
  jwt:
    secret: ${JWT_SECRET:}
    expires_in: 86400
    
  cors:
    origins: ${CORS_ORIGINS:http://localhost:3000}
    
  rate_limit:
    enabled: true
    requests_per_minute: 100

monitoring:
  prometheus:
    enabled: true
    port: 9090
    path: /metrics
    
  tracing:
    enabled: ${TRACING_ENABLED:true}
    endpoint: ${JAEGER_ENDPOINT:http://jaeger:14268/api/traces}
    
  logging:
    level: ${LOG_LEVEL:info}
    format: json
```

---

## 附录

### A. 资源清单

| 环境 | 节点类型 | 节点数 | CPU/节点 | 内存/节点 | 存储 |
|-----|---------|-------|---------|----------|-----|
| 开发 | m5.large | 2 | 2核 | 8GB | 100GB |
| 测试 | m5.xlarge | 3 | 4核 | 16GB | 500GB |
| 生产 | m5.2xlarge | 5-10 | 8核 | 32GB | 2TB+ |

### B. 端口清单

| 服务 | 端口 | 协议 | 说明 |
|-----|-----|-----|-----|
| Frontend | 80/443 | HTTP/HTTPS | Web UI |
| Backend API | 3000 | HTTP | REST API |
| Execution Engine | 8000 | HTTP | 执行引擎 |
| WebSocket | 8080 | WS/WSS | 实时通信 |
| PostgreSQL | 5432 | TCP | 数据库 |
| Redis | 6379 | TCP | 缓存 |
| RabbitMQ | 5672/15672 | TCP/HTTP | 消息队列 |
| Prometheus | 9090 | HTTP | 监控 |
| Grafana | 3000 | HTTP | 仪表盘 |

### C. 依赖版本

| 组件 | 版本 | 说明 |
|-----|-----|-----|
| Kubernetes | 1.28+ | 容器编排 |
| Docker | 24.0+ | 容器运行时 |
| Helm | 3.12+ | 包管理 |
| PostgreSQL | 15+ | 数据库 |
| Redis | 7+ | 缓存 |
| RabbitMQ | 3.12+ | 消息队列 |
| Prometheus | 2.47+ | 监控 |
| Grafana | 10.1+ | 可视化 |

---

*文档版本: 1.0.0*
*最后更新: 2024年*
*作者: DevOps Team*
