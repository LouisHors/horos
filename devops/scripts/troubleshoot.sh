#!/bin/bash
# AI Agent Platform - Troubleshooting Script

set -e

NAMESPACE="${NAMESPACE:-ai-agent-prod}"
K="kubectl -n $NAMESPACE"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========== Pod启动失败排查 ==========
troubleshoot_pod_startup() {
    local pod_name=$1
    
    echo -e "${YELLOW}🔍 Troubleshooting Pod: $pod_name${NC}"
    echo "=========================================="
    
    # 1. 查看Pod描述
    echo -e "\n${GREEN}1. Pod Description:${NC}"
    $K describe pod $pod_name
    
    # 2. 查看Pod日志
    echo -e "\n${GREEN}2. Pod Logs:${NC}"
    $K logs $pod_name --previous 2>/dev/null || $K logs $pod_name
    
    # 3. 查看相关事件
    echo -e "\n${GREEN}3. Related Events:${NC}"
    $K get events --field-selector involvedObject.name=$pod_name --sort-by='.lastTimestamp'
    
    # 4. 检查资源限制
    echo -e "\n${GREEN}4. Resource Usage:${NC}"
    $K top pod $pod_name 2>/dev/null || echo "metrics-server not available"
    
    # 5. 检查节点状态
    echo -e "\n${GREEN}5. Node Status:${NC}"
    local node=$($K get pod $pod_name -o jsonpath='{.spec.nodeName}')
    kubectl describe node $node | grep -A 10 "Conditions"
}

# ========== 性能问题排查 ==========
troubleshoot_performance() {
    echo -e "${YELLOW}🔍 Performance Troubleshooting${NC}"
    echo "=========================================="
    
    # 1. 高CPU使用的Pod
    echo -e "\n${GREEN}1. Top CPU Usage Pods:${NC}"
    $K top pods --sort-by=cpu 2>/dev/null | head -10 || echo "metrics-server not available"
    
    # 2. 高内存使用的Pod
    echo -e "\n${GREEN}2. Top Memory Usage Pods:${NC}"
    $K top pods --sort-by=memory 2>/dev/null | head -10 || echo "metrics-server not available"
    
    # 3. HPA状态
    echo -e "\n${GREEN}3. HPA Status:${NC}"
    $K get hpa
    
    # 4. Pending Pod
    echo -e "\n${GREEN}4. Pending Pods:${NC}"
    $K get pods --field-selector=status.phase=Pending
    
    # 5. 节点资源
    echo -e "\n${GREEN}5. Node Resources:${NC}"
    kubectl top nodes 2>/dev/null || echo "metrics-server not available"
    
    # 6. 事件告警
    echo -e "\n${GREEN}6. Warning Events:${NC}"
    $K get events --field-selector type=Warning --sort-by='.lastTimestamp' | tail -20
}

# ========== 网络问题排查 ==========
troubleshoot_network() {
    local service=$1
    
    echo -e "${YELLOW}🔍 Network Troubleshooting: $service${NC}"
    echo "=========================================="
    
    # 1. 检查Service
    echo -e "\n${GREEN}1. Service Status:${NC}"
    $K get svc $service -o wide
    $K describe svc $service
    
    # 2. 检查Endpoints
    echo -e "\n${GREEN}2. Endpoints:${NC}"
    $K get endpoints $service
    
    # 3. 检查Pod标签
    echo -e "\n${GREEN}3. Pod Labels:${NC}"
    $K get pods -l app=$service --show-labels
    
    # 4. 测试连通性
    echo -e "\n${GREEN}4. Connectivity Test:${NC}"
    $K run -it --rm debug --image=nicolaka/netshoot --restart=Never -- \
        curl -v http://$service.$NAMESPACE.svc.cluster.local/health 2>&1 || true
    
    # 5. 检查Ingress
    echo -e "\n${GREEN}5. Ingress Status:${NC}"
    $K get ingress
    $K describe ingress 2>/dev/null || echo "No ingress found"
    
    # 6. 检查证书
    echo -e "\n${GREEN}6. Certificate Status:${NC}"
    $K get certificate 2>/dev/null || echo "No certificates found"
}

# ========== 数据库问题排查 ==========
troubleshoot_database() {
    echo -e "${YELLOW}🔍 Database Troubleshooting${NC}"
    echo "=========================================="
    
    # 1. PostgreSQL状态
    echo -e "\n${GREEN}1. PostgreSQL Status:${NC}"
    $K get pods -l app=postgresql
    
    # 2. 连接数
    echo -e "\n${GREEN}2. Connection Count:${NC}"
    $K exec postgresql-0 -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "Cannot connect to PostgreSQL"
    
    # 3. 慢查询
    echo -e "\n${GREEN}3. Slow Queries:${NC}"
    $K exec postgresql-0 -- psql -U postgres -c "
        SELECT query, calls, mean_time, total_time 
        FROM pg_stat_statements 
        ORDER BY mean_time DESC 
        LIMIT 10;
    " 2>/dev/null || echo "Cannot query pg_stat_statements"
    
    # 4. Redis状态
    echo -e "\n${GREEN}4. Redis Status:${NC}"
    $K get pods -l app=redis
    
    # 5. Redis内存使用
    echo -e "\n${GREEN}5. Redis Memory Usage:${NC}"
    $K exec redis-master-0 -- redis-cli INFO memory 2>/dev/null || echo "Cannot connect to Redis"
}

# ========== 消息队列排查 ==========
troubleshoot_queue() {
    echo -e "${YELLOW}🔍 Message Queue Troubleshooting${NC}"
    echo "=========================================="
    
    # 1. RabbitMQ状态
    echo -e "\n${GREEN}1. RabbitMQ Status:${NC}"
    $K get pods -l app=rabbitmq
    
    # 2. 队列深度
    echo -e "\n${GREEN}2. Queue Depth:${NC}"
    $K exec rabbitmq-0 -- rabbitmqctl list_queues 2>/dev/null || echo "Cannot connect to RabbitMQ"
    
    # 3. 消费者状态
    echo -e "\n${GREEN}3. Consumer Status:${NC}"
    $K exec rabbitmq-0 -- rabbitmqctl list_consumers 2>/dev/null || echo "Cannot list consumers"
    
    # 4. 连接状态
    echo -e "\n${GREEN}4. Connection Status:${NC}"
    $K exec rabbitmq-0 -- rabbitmqctl list_connections 2>/dev/null || echo "Cannot list connections"
}

# ========== 执行引擎排查 ==========
troubleshoot_engine() {
    echo -e "${YELLOW}🔍 Execution Engine Troubleshooting${NC}"
    echo "=========================================="
    
    # 1. Pod状态
    echo -e "\n${GREEN}1. Engine Pod Status:${NC}"
    $K get pods -l app=execution-engine
    
    # 2. 活跃任务
    echo -e "\n${GREEN}2. Active Jobs:${NC}"
    # 这里需要根据实际指标端点调整
    curl -s http://execution-engine.$NAMESPACE.svc.cluster.local:8000/metrics 2>/dev/null | grep "execution_engine_active_jobs" || echo "Cannot fetch metrics"
    
    # 3. 队列深度
    echo -e "\n${GREEN}3. Queue Depth:${NC}"
    curl -s http://execution-engine.$NAMESPACE.svc.cluster.local:8000/metrics 2>/dev/null | grep "execution_engine_pending_jobs" || echo "Cannot fetch metrics"
    
    # 4. 日志
    echo -e "\n${GREEN}4. Recent Logs:${NC}"
    $K logs -l app=execution-engine --tail=50
}

# ========== 主函数 ==========
show_help() {
    cat <<EOF
AI Agent Platform - Troubleshooting Script

Usage: $0 <command> [options]

Commands:
  pod <pod-name>      Troubleshoot pod startup issues
  performance         Troubleshoot performance issues
  network <service>   Troubleshoot network issues
  database            Troubleshoot database issues
  queue               Troubleshoot message queue issues
  engine              Troubleshoot execution engine issues
  all                 Run all troubleshooting checks

Environment Variables:
  NAMESPACE           Target namespace (default: ai-agent-prod)

Examples:
  $0 pod backend-api-xxx
  $0 performance
  $0 network backend-api
  $0 database
EOF
}

main() {
    local cmd=$1
    shift || true
    
    case $cmd in
        pod)
            troubleshoot_pod_startup "$@"
            ;;
        performance)
            troubleshoot_performance
            ;;
        network)
            troubleshoot_network "$@"
            ;;
        database)
            troubleshoot_database
            ;;
        queue)
            troubleshoot_queue
            ;;
        engine)
            troubleshoot_engine
            ;;
        all)
            troubleshoot_performance
            troubleshoot_database
            troubleshoot_queue
            troubleshoot_engine
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $cmd${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
