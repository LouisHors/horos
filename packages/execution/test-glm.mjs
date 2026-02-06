/**
 * GLM-4.7 模型测试 - 智谱AI
 */
import { LLMService } from './dist/index.js';

async function testGLM() {
  console.log('🧠 测试智谱AI GLM-4.7 模型\n');

  const service = new LLMService();
  
  console.log('Provider:', service.getProvider().name);
  console.log('模型: GLM-4.7 (默认)');
  console.log('问题: 什么是工作流编排？\n');
  console.log('🤖 GLM 回复:\n');

  try {
    const result = await service.chat([
      { 
        role: 'system', 
        content: '你是 GLM，一个强大的AI助手。请简洁回答。' 
      },
      { 
        role: 'user', 
        content: '什么是工作流编排？用一句话解释。' 
      }
    ]);

    console.log(result.content);
    
    if (result.usage) {
      console.log(`\n📊 Token 使用: ${result.usage.totalTokens}`);
    }
    
    console.log('\n✅ 测试成功！GLM-4.7 运行正常');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testGLM();
