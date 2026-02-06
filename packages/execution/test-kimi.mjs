/**
 * Kimi 模型测试 - 直接运行
 */
import { LLMService } from './dist/index.js';

async function testKimi() {
  console.log('🌙 测试 Moonshot Kimi 模型\n');

  const service = new LLMService();
  
  console.log('Provider:', service.getProvider().name);
  console.log('模型: kimi-for-coding (默认 - Kimi Code专用模型)');
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
    console.log('\n💡 提示: 如需使用 kimi-coding 模型，请确保有对应权限');
    console.log('   export LLM_MODEL="kimi-coding"');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.message.includes('403') && error.message.includes('Coding')) {
      console.error('\n💡 调试建议:');
      console.error('   1. 确认 Key 已开通 Kimi Code 权限');
      console.error('   2. 在 Roo Code 中抓包查看实际请求头');
      console.error('   3. 或使用标准模型: export LLM_MODEL="kimi-latest"');
    } else if (error.message.includes('401')) {
      console.error('\n💡 API Key 可能无效');
    }
    console.error('\n📋 请检查 Roo Code 中的网络请求，对比以下 curl:');
    console.error('   curl -X POST https://api.kimi.com/coding/v1/chat/completions \\\\');
    console.error('     -H "Authorization: Bearer $LLM_API_KEY" \\\\');
    console.error('     -H "Content-Type: application/json" \\\\');
    console.error('     -d \'{"model":"kimi-for-coding","messages":[{"role":"user","content":"Hello"}]}\'');
  }
}

testKimi();
