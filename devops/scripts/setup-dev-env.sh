#!/bin/bash
# AI Agent Platform - Development Environment Setup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="ai-agent-platform"
CLUSTER_NAME="ai-agent-dev"

echo "🚀 AI Agent Platform - Development Environment Setup"
echo "======================================================"

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 安装依赖工具
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Docker
    if ! command_exists docker; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker $USER
        echo "✅ Docker installed. Please log out and log back in."
    else
        echo "✅ Docker already installed"
    fi
    
    # Docker Compose
    if ! command_exists docker-compose; then
        echo "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "✅ Docker Compose installed"
    else
        echo "✅ Docker Compose already installed"
    fi
    
    # kubectl
    if ! command_exists kubectl; then
        echo "Installing kubectl..."
        curl -LO "https://dl.k8s/release/$(curl -L -s https://dl.k8s/release/stable.txt)/bin/linux/amd64/kubectl"
        sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
        rm kubectl
        echo "✅ kubectl installed"
    else
        echo "✅ kubectl already installed"
    fi
    
    # Helm
    if ! command_exists helm; then
        echo "Installing Helm..."
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
        echo "✅ Helm installed"
    else
        echo "✅ Helm already installed"
    fi
    
    # kind (Kubernetes in Docker)
    if ! command_exists kind; then
        echo "Installing kind..."
        curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v0.20.0/kind-$(uname)-amd64"
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/kind
        echo "✅ kind installed"
    else
        echo "✅ kind already installed"
    fi
    
    # kustomize
    if ! command_exists kustomize; then
        echo "Installing kustomize..."
        curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
        sudo mv kustomize /usr/local/bin/
        echo "✅ kustomize installed"
    else
        echo "✅ kustomize already installed"
    fi
}

# 创建本地Kubernetes集群
create_kind_cluster() {
    echo "☸️ Creating local Kubernetes cluster with kind..."
    
    # 检查集群是否已存在
    if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
        echo "Cluster ${CLUSTER_NAME} already exists. Deleting..."
        kind delete cluster --name ${CLUSTER_NAME}
    fi
    
    # 创建kind配置文件
    cat > /tmp/kind-config.yaml <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: ${CLUSTER_NAME}
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 8080
        protocol: TCP
      - containerPort: 443
        hostPort: 8443
        protocol: TCP
      - containerPort: 30000
        hostPort: 30000
        protocol: TCP
      - containerPort: 30001
        hostPort: 30001
        protocol: TCP
  - role: worker
    extraPortMappings:
      - containerPort: 30002
        hostPort: 30002
        protocol: TCP
  - role: worker
    extraPortMappings:
      - containerPort: 30003
        hostPort: 30003
        protocol: TCP
EOF
    
    kind create cluster --config /tmp/kind-config.yaml
    
    echo "✅ Kind cluster created successfully"
}

# 安装Ingress Nginx
install_ingress_nginx() {
    echo "🌐 Installing Ingress Nginx..."
    
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    
    echo "⏳ Waiting for Ingress Nginx to be ready..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=180s
    
    echo "✅ Ingress Nginx installed"
}

# 安装监控组件
install_monitoring() {
    echo "📊 Installing monitoring stack..."
    
    # 添加Helm仓库
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # 创建命名空间
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # 安装kube-prometheus-stack
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
      --namespace monitoring \
      --set grafana.enabled=true \
      --set grafana.adminPassword=admin \
      --set prometheus.prometheusSpec.retention=7d \
      --set prometheus.prometheusSpec.storageSpec=null \
      --wait
    
    echo "✅ Monitoring stack installed"
    echo "   Grafana: http://localhost:8080/grafana (admin/admin)"
    echo "   Prometheus: http://localhost:8080/prometheus"
}

# 安装日志收集
install_logging() {
    echo "📝 Installing logging stack..."
    
    kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -
    
    helm upgrade --install loki grafana/loki-stack \
      --namespace logging \
      --set fluent-bit.enabled=true \
      --set promtail.enabled=false \
      --wait
    
    echo "✅ Logging stack installed"
}

# 部署应用
deploy_application() {
    echo "🎯 Deploying AI Agent Platform..."
    
    # 创建命名空间
    kubectl create namespace ai-agent-dev --dry-run=client -o yaml | kubectl apply -f -
    
    # 应用配置
    kubectl apply -k k8s/overlays/development/ 2>/dev/null || {
        echo "Using base k8s manifests..."
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/configmap.yaml -n ai-agent-dev
        kubectl apply -f k8s/secret.yaml -n ai-agent-dev
        kubectl apply -f k8s/frontend-deployment.yaml -n ai-agent-dev
        kubectl apply -f k8s/backend-deployment.yaml -n ai-agent-dev
        kubectl apply -f k8s/engine-deployment.yaml -n ai-agent-dev
        kubectl apply -f k8s/services.yaml -n ai-agent-dev
        kubectl apply -f k8s/ingress.yaml -n ai-agent-dev
    }
    
    echo "⏳ Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n ai-agent-dev || true
    kubectl wait --for=condition=available --timeout=300s deployment/backend-api -n ai-agent-dev || true
    kubectl wait --for=condition=available --timeout=300s deployment/execution-engine -n ai-agent-dev || true
    
    echo "✅ Application deployed"
}

# 端口转发
setup_port_forwarding() {
    echo "🔌 Setting up port forwarding..."
    
    # 后台运行端口转发
    kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 8443:443 --address 0.0.0.0 > /dev/null 2>&1 &
    echo $! > /tmp/k8s-port-forward.pid
    
    echo "✅ Port forwarding configured"
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "======================================================"
    echo "🎉 Development environment is ready!"
    echo "======================================================"
    echo ""
    echo "Access URLs:"
    echo "  🌐 Application:     http://localhost:8080"
    echo "  📊 Grafana:         http://localhost:8080/grafana (admin/admin)"
    echo "  📈 Prometheus:      http://localhost:8080/prometheus"
    echo "  🚨 AlertManager:    http://localhost:8080/alertmanager"
    echo ""
    echo "Useful commands:"
    echo "  kubectl get pods -n ai-agent-dev      # View application pods"
    echo "  kubectl logs -f -n ai-agent-dev deployment/backend-api  # View backend logs"
    echo "  kubectl get events -n ai-agent-dev    # View events"
    echo ""
    echo "To stop port forwarding:"
    echo "  kill \$(cat /tmp/k8s-port-forward.pid)"
    echo ""
    echo "To delete the cluster:"
    echo "  kind delete cluster --name ${CLUSTER_NAME}"
    echo "======================================================"
}

# 主函数
main() {
    case "${1:-all}" in
        deps)
            install_dependencies
            ;;
        cluster)
            create_kind_cluster
            ;;
        ingress)
            install_ingress_nginx
            ;;
        monitoring)
            install_monitoring
            ;;
        logging)
            install_logging
            ;;
        deploy)
            deploy_application
            ;;
        all|*)
            install_dependencies
            create_kind_cluster
            install_ingress_nginx
            install_monitoring
            install_logging
            deploy_application
            setup_port_forwarding
            show_access_info
            ;;
    esac
}

main "$@"
