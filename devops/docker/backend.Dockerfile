# AI Agent Platform - Backend API Dockerfile
# ============================================

FROM node:18-alpine

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY --chown=nodejs:nodejs package*.json ./

# 安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    USER=nodejs

# 切换到非root用户
USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 暴露端口
EXPOSE 3000

# 使用dumb-init处理信号
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "server.js"]
