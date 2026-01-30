#!/bin/bash
# AI Agent Platform - Operations Commands
# 常用运维命令快捷脚本

set -e

# 配置
NAMESPACE="${NAMESPACE:-ai-agent-prod}"
CONTEXT="${CONTEXT:-}"

# 设置kubectl上下文
if [ -n "$CONTEXT" ]; then
    KUBECTL="kubectl --context=$CONTEXT"
else
    KUBECTL="kubectl"
fi

# 添加命名空间参数
K="$KUBECTL -n $NAMESPACE"

# ========== 帮助信息 ==========
show_help() {
    cat <<EOF
AI Agent Platform - Operations Commands

Usage: $0 <command> [options]

Commands:
  status              Show overall system status
  pods                List all pods
  services            List all services
  ingress             List all ingresses
  hpa                 List HPA status
  logs <service>      View logs for a service
  exec <service>      Execute shell in a service pod
  top                 Show resource usage
  events              Show recent events
  scale <svc> <n>     Scale a service to n replicas
  restart <service>   Restart a service
  rollout <service>   Check rollout status
  rollback <service>  Rollback to previous version
  forward <svc> <port> Port forward to a service
  backup              Backup database and configs
  restore <file>      Restore from backup
  clean               Clean up old pods and resources
  
Environment Variables:
  NAMESPACE           Target namespace (default: ai-agent-prod)
  CONTEXT             kubectl context (default: current)

Examples:
  $0 status
  $0 logs backend-api
  $0 exec frontend
  $0 scale execution-engine 10
  $0 restart backend-api
EOF
}

# ========== 状态查看 ==========
cmd_status() {
    echo "📊 System Status - Namespace: $NAMESPACE"
    echo "=========================================="
    
    echo ""
    echo "🟢 Pods:"
    $K get pods -o wide
    
    echo ""
    echo "🌐 Services:"
    $K get svc
    
    echo ""
    echo "📈 HPA:"
    $K get hpa
    
    echo ""
    echo "⬅️  Ingress:"
    $K get ingress
    
    echo ""
    echo "💾 PVC:"
    $K get pvc
}

# ========== Pod操作 ==========
cmd_pods() {
    $K get pods -o wide "$@"
}

cmd_services() {
    $K get svc -o wide "$@"
}

cmd_ingress() {
    $K get ingress "$@"
}

cmd_hpa() {
    $K get hpa "$@"
}

# ========== 日志查看 ==========
cmd_logs() {
    local service=$1
    local lines=${2:-100}
    
    if [ -z "$service" ]; then
        echo "Usage: $0 logs <service> [lines]"
        exit 1
    fi
    
    echo "📜 Logs for $service (last $lines lines):"
    $K logs -f deployment/$service --tail=$lines
}

# ========== 进入容器 ==========
cmd_exec() {
    local service=$1
    local shell=${2:-/bin/sh}
    
    if [ -z "$service" ]; then
        echo "Usage: $0 exec <service> [shell]"
        exit 1
    fi
    
    echo "🔧 Executing $shell in $service..."
    $K exec -it deployment/$service -- $shell
}

# ========== 资源使用 ==========
cmd_top() {
    echo "📊 Resource Usage:"
    echo ""
    echo "Pods:"
    $K top pods
    echo ""
    echo "Nodes:"
    $K top nodes 2>/dev/null || echo "metrics-server not available"
}

# ========== 事件查看 ==========
cmd_events() {
    local lines=${1:-20}
    echo "📅 Recent Events (last $lines):"
    $K get events --sort-by='.lastTimestamp' | tail -$lines
}

# ========== 扩缩容 ==========
cmd_scale() {
    local service=$1
    local replicas=$2
    
    if [ -z "$service" ] || [ -z "$replicas" ]; then
        echo "Usage: $0 scale <service> <replicas>"
        exit 1
    fi
    
    echo "📏 Scaling $service to $replicas replicas..."
    $K scale deployment/$service --replicas=$replicas
    
    echo "⏳ Waiting for rollout..."
    $K rollout status deployment/$service --timeout=300s
    
    echo "✅ Scaled successfully"
}

# ========== 重启服务 ==========
cmd_restart() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo "Usage: $0 restart <service>"
        exit 1
    fi
    
    echo "🔄 Restarting $service..."
    $K rollout restart deployment/$service
    
    echo "⏳ Waiting for rollout..."
    $K rollout status deployment/$service --timeout=300s
    
    echo "✅ Restarted successfully"
}

# ========== 检查部署状态 ==========
cmd_rollout() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo "Usage: $0 rollout <service>"
        exit 1
    fi
    
    echo "📊 Rollout status for $service:"
    $K rollout status deployment/$service
}

# ========== 回滚 ==========
cmd_rollback() {
    local service=$1
    local revision=$2
    
    if [ -z "$service" ]; then
        echo "Usage: $0 rollback <service> [revision]"
        exit 1
    fi
    
    echo "⏮️  Rolling back $service..."
    
    if [ -n "$revision" ]; then
        $K rollout undo deployment/$service --to-revision=$revision
    else
        $K rollout undo deployment/$service
    fi
    
    echo "⏳ Waiting for rollout..."
    $K rollout status deployment/$service --timeout=300s
    
    echo "✅ Rolled back successfully"
}

# ========== 端口转发 ==========
cmd_forward() {
    local service=$1
    local port=$2
    
    if [ -z "$service" ] || [ -z "$port" ]; then
        echo "Usage: $0 forward <service> <port>"
        exit 1
    fi
    
    echo "🔌 Forwarding localhost:$port to $service:$port..."
    echo "Press Ctrl+C to stop"
    $K port-forward svc/$service $port:$port
}

# ========== 备份 ==========
cmd_backup() {
    local backup_dir="/tmp/ai-agent-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p $backup_dir
    
    echo "💾 Starting backup to $backup_dir..."
    
    # 备份数据库
    echo "Backing up PostgreSQL..."
    $K exec postgresql-0 -- pg_dumpall -U postgres > $backup_dir/postgresql.sql 2>/dev/null || {
        echo "⚠️  PostgreSQL backup failed"
    }
    
    # 备份Redis
    echo "Backing up Redis..."
    $K exec redis-master-0 -- redis-cli BGSAVE 2>/dev/null || {
        echo "⚠️  Redis backup failed"
    }
    
    # 备份配置
    echo "Backing up ConfigMaps and Secrets..."
    $K get configmap -o yaml > $backup_dir/configmaps.yaml
    $K get secret -o yaml > $backup_dir/secrets.yaml
    
    # 压缩
    tar -czf $backup_dir.tar.gz -C $(dirname $backup_dir) $(basename $backup_dir)
    rm -rf $backup_dir
    
    echo "✅ Backup completed: $backup_dir.tar.gz"
}

# ========== 恢复 ==========
cmd_restore() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo "Usage: $0 restore <backup-file.tar.gz>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Backup file not found: $backup_file"
        exit 1
    fi
    
    echo "🔄 Starting restore from $backup_file..."
    
    # 解压
    local restore_dir="/tmp/ai-agent-restore-$(date +%s)"
    mkdir -p $restore_dir
    tar -xzf $backup_file -C $restore_dir
    
    # 恢复配置
    echo "Restoring ConfigMaps and Secrets..."
    $K apply -f $restore_dir/*/configmaps.yaml 2>/dev/null || true
    $K apply -f $restore_dir/*/secrets.yaml 2>/dev/null || true
    
    echo "✅ Restore completed"
    echo "⚠️  Database restore must be done manually"
    
    rm -rf $restore_dir
}

# ========== 清理 ==========
cmd_clean() {
    echo "🧹 Cleaning up resources..."
    
    # 删除已完成的Pod
    echo "Removing completed pods..."
    $K delete pods --field-selector=status.phase=Succeeded 2>/dev/null || true
    $K delete pods --field-selector=status.phase=Failed 2>/dev/null || true
    
    # 删除旧的ReplicaSet
    echo "Removing old replica sets..."
    $K get rs | awk '/0\s+0\s+0/{print $1}' | xargs -r $K delete rs 2>/dev/null || true
    
    echo "✅ Cleanup completed"
}

# ========== 主函数 ==========
main() {
    local cmd=$1
    shift || true
    
    case $cmd in
        status) cmd_status "$@" ;;
        pods) cmd_pods "$@" ;;
        services) cmd_services "$@" ;;
        ingress) cmd_ingress "$@" ;;
        hpa) cmd_hpa "$@" ;;
        logs) cmd_logs "$@" ;;
        exec) cmd_exec "$@" ;;
        top) cmd_top "$@" ;;
        events) cmd_events "$@" ;;
        scale) cmd_scale "$@" ;;
        restart) cmd_restart "$@" ;;
        rollout) cmd_rollout "$@" ;;
        rollback) cmd_rollback "$@" ;;
        forward) cmd_forward "$@" ;;
        backup) cmd_backup "$@" ;;
        restore) cmd_restore "$@" ;;
        clean) cmd_clean "$@" ;;
        help|--help|-h) show_help ;;
        *) 
            echo "Unknown command: $cmd"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
