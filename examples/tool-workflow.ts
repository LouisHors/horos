/**
 * 示例：工具工作流
 * 
 * 此示例演示如何使用工具节点：
 * 1. HTTP 请求工具
 * 2. 延迟工具
 * 3. 日志工具
 * 4. 代码执行工具
 */

import {
  ExecutionEngine,
  WorkflowNode,
  WorkflowEdge,
  ToolNodeExecutor,
  NodeType,
} from '@horos/execution';

// 创建工作流节点：Start -> HTTP请求 -> 延迟 -> 日志 -> End
const nodes: WorkflowNode[] = [
  {
    id: 'start',
    type: NodeType.START,
    data: {},
    position: { x: 0, y: 0 },
  },
  {
    id: 'http',
    type: NodeType.TOOL,
    data: {
      label: 'HTTP Request',
      toolType: 'http',
      config: {
        url: 'https://api.github.com/zen',
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      },
    },
    position: { x: 200, y: 0 },
  },
  {
    id: 'delay',
    type: NodeType.TOOL,
    data: {
      label: 'Delay',
      toolType: 'delay',
      config: {
        duration: 1000, // 1秒延迟
      },
    },
    position: { x: 400, y: 0 },
  },
  {
    id: 'log',
    type: NodeType.TOOL,
    data: {
      label: 'Log',
      toolType: 'log',
    },
    position: { x: 600, y: 0 },
  },
  {
    id: 'end',
    type: NodeType.END,
    data: {},
    position: { x: 800, y: 0 },
  },
];

const edges: WorkflowEdge[] = [
  { id: 'e1', source: 'start', target: 'http' },
  { id: 'e2', source: 'http', target: 'delay' },
  { id: 'e3', source: 'delay', target: 'log' },
  { id: 'e4', source: 'log', target: 'end' },
];

async function main() {
  console.log('🔧 工具工作流示例\n');

  const engine = new ExecutionEngine();
  engine.registerExecutor(NodeType.TOOL, new ToolNodeExecutor());

  console.log('工作流步骤:');
  console.log('  1. HTTP GET https://api.github.com/zen');
  console.log('  2. 延迟 1秒');
  console.log('  3. 日志输出');
  console.log('');

  try {
    const result = await engine.execute(nodes, edges);

    if (result.success) {
      console.log('✅ 执行成功！\n');

      // 显示各节点输出
      const httpOutput = result.results.get('http') as { success: boolean; data?: string };
      const delayOutput = result.results.get('delay') as { success: boolean; duration: number };
      const logOutput = result.results.get('log') as { logged: unknown[] };

      if (httpOutput) {
        console.log('🌐 HTTP 结果:', httpOutput.success ? '成功' : '失败');
        if (httpOutput.data) {
          console.log(`  响应: ${httpOutput.data}`);
        }
      }

      if (delayOutput) {
        console.log(`⏱️  延迟: ${delayOutput.duration}ms`);
      }

      if (logOutput) {
        console.log('📝 日志输出节点数:', logOutput.logged.length);
      }

      console.log(`\n⏱️  总耗时: ${result.duration}ms`);
    } else {
      console.error('❌ 执行失败:', result.errors);
    }
  } catch (error) {
    console.error('❌ 执行异常:', error);
  }
}

main();
