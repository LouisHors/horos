/**
 * 示例：简单 AI Agent 工作流
 * 
 * 此示例演示如何：
 * 1. 创建一个包含 Start -> Agent -> End 的简单工作流
 * 2. 使用 ExecutionEngine 执行工作流
 * 3. Agent 节点调用 OpenAI API 进行对话
 * 
 * 运行前请设置环境变量：
 * export OPENAI_API_KEY="your-api-key"
 * export OPENAI_BASE_URL="https://api.openai.com/v1"  # 可选，用于第三方 API
 */

import {
  ExecutionEngine,
  WorkflowNode,
  WorkflowEdge,
  AgentNodeExecutor,
  NodeType,
} from '@horos/execution';

// 创建工作流节点
const nodes: WorkflowNode[] = [
  {
    id: 'start',
    type: NodeType.START,
    data: {},
    position: { x: 0, y: 0 },
  },
  {
    id: 'agent',
    type: NodeType.AGENT,
    data: {
      label: 'AI Assistant',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      systemPrompt: '你是一个有帮助的AI助手，请简洁地回答用户的问题。',
    },
    position: { x: 200, y: 0 },
  },
  {
    id: 'end',
    type: NodeType.END,
    data: {},
    position: { x: 400, y: 0 },
  },
];

// 创建工作流边
const edges: WorkflowEdge[] = [
  { id: 'e1', source: 'start', target: 'agent' },
  { id: 'e2', source: 'agent', target: 'end' },
];

// 主函数
async function main() {
  console.log('🚀 启动简单 Agent 工作流示例\n');

  // 检查 API Key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 错误：请设置 OPENAI_API_KEY 环境变量');
    console.log('\n示例:');
    console.log('  export OPENAI_API_KEY="sk-your-api-key"');
    process.exit(1);
  }

  // 创建执行引擎
  const engine = new ExecutionEngine();

  // 注册 Agent 执行器
  engine.registerExecutor(NodeType.AGENT, new AgentNodeExecutor());

  // 设置上下文变量（模拟用户输入）
  const context = {
    variables: new Map([['input', '你好，请介绍一下自己']]),
  };

  console.log('💬 用户输入:', context.variables.get('input'));
  console.log('🤖 Agent 配置:', {
    model: 'gpt-4o-mini',
    systemPrompt: nodes[1].data.systemPrompt,
  });
  console.log('\n⏳ 执行中...\n');

  try {
    // 执行工作流
    const result = await engine.execute(nodes, edges);

    if (result.success) {
      console.log('✅ 执行成功！\n');
      
      // 获取 Agent 节点的输出
      const agentOutput = result.results.get('agent') as {
        content: string;
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens: number;
        };
      };

      if (agentOutput) {
        console.log('📝 AI 回复:');
        console.log(agentOutput.content);
        
        if (agentOutput.usage) {
          console.log('\n📊 Token 使用:');
          console.log(`  Prompt: ${agentOutput.usage.promptTokens}`);
          console.log(`  Completion: ${agentOutput.usage.completionTokens}`);
          console.log(`  Total: ${agentOutput.usage.totalTokens}`);
        }
      }

      console.log(`\n⏱️  执行耗时: ${result.duration}ms`);
    } else {
      console.error('❌ 执行失败:', result.errors);
    }
  } catch (error) {
    console.error('❌ 执行异常:', error);
  }
}

// 运行
main();
