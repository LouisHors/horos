/**
 * Kimi 模型测试 - 直接运行
 */
import { LLMService } from './dist/index.js';

async function testKimi() {
  console.log('🌙 测试 Moonshot Kimi 模型\n');

  const service = new LLMService();
  
  console.log('Provider:', service.getProvider().name);
  console.log('模型: kimi-coding (默认)');
  console.log('问题: 什么是工作流编排？\n');
  console.log('🤖 Kimi 回复:\n');

  try {
    const result = await service.chat([
      { 
        role: 'system', 
        content: '你是 Kimi，一个擅长编程和技术的AI助手。请简洁回答。' 
      },
      { 
        role: 'user', 
        content: '什么是工作流编排？用一句话解释。' 
      }
    ]);

    console.log(result.content);
    
    if (result.usage) {
      console.log(`\n📊 Token 使用: ${result.usage.totalTokens} (${result.usage.promptTokens} + ${result.usage.completionTokens})`);
    }
    
    console.log('\n✅ 测试成功！Kimi 运行正常');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.message.includes('401')) {
      console.error('\n💡 提示: API Key 可能无效或已过期');
    }
  }
}

testKimi();
