import { NextRequest, NextResponse } from 'next/server';
import { 
  ExecutionEngine, 
  WorkflowNode, 
  WorkflowEdge,
  NodeType,
  StartNodeExecutor,
  EndNodeExecutor,
  AgentNodeExecutor,
} from '@horos/execution';

/**
 * POST /api/execute
 * 执行工作流
 */
export async function POST(request: NextRequest) {
  console.log('[API /execute] 🚀 收到执行请求');
  
  try {
    const body = await request.json();
    const { nodes, edges } = body as { nodes: any[], edges: any[] };
    
    console.log('[API /execute] 📊 请求数据:', { 
      nodeCount: nodes?.length, 
      edgeCount: edges?.length 
    });
    
    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing nodes or edges' },
        { status: 400 }
      );
    }
    
    // 转换节点格式
    const workflowNodes: WorkflowNode[] = nodes.map(node => ({
      id: node.id,
      type: mapNodeType(node.type),
      data: node.data || {},
      position: node.position,
      inputs: [], // 由 DAG 解析器填充
      outputs: [],
    }));
    
    // 转换边格式
    const workflowEdges: WorkflowEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));
    
    // 创建执行引擎
    console.log('[API /execute] 🔧 创建执行引擎...');
    const engine = new ExecutionEngine();
    
    // 注册执行器
    engine.registerExecutor(NodeType.START, new StartNodeExecutor());
    engine.registerExecutor(NodeType.END, new EndNodeExecutor());
    engine.registerExecutor(NodeType.AGENT, new AgentNodeExecutor());
    console.log('[API /execute] ✅ 执行器注册完成');
    
    // 执行工作流
    console.log('[API /execute] ⚙️ 开始执行...');
    const startTime = Date.now();
    const result = await engine.execute(workflowNodes, workflowEdges);
    const duration = Date.now() - startTime;
    
    console.log('[API /execute] ✅ 执行完成:', { 
      success: result.success, 
      duration: result.duration || duration 
    });
    
    // 转换 Map 为普通对象以便 JSON 序列化
    const serializedResult = {
      success: result.success,
      executionId: result.executionId,
      status: result.status,
      outputs: Object.fromEntries(result.outputs),
      errors: result.errors.map(e => ({
        nodeId: e.nodeId,
        error: e.error.message,
        recoverable: e.recoverable,
      })),
      duration: result.duration || duration,
    };
    
    return NextResponse.json(serializedResult);
    
  } catch (error) {
    console.error('[API /execute] ❌ 执行失败:', error);
    
    return NextResponse.json(
      { 
        error: 'Execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 映射节点类型
 */
function mapNodeType(type: string): NodeType {
  const typeMap: Record<string, NodeType> = {
    'start': NodeType.START,
    'end': NodeType.END,
    'agent': NodeType.AGENT,
    'tool': NodeType.TOOL,
    'condition': NodeType.CONDITION,
    'loop': NodeType.LOOP,
    'delay': NodeType.DELAY,
    'webhook': NodeType.WEBHOOK,
    'code': NodeType.CODE,
  };
  
  return typeMap[type] || NodeType.CODE;
}
