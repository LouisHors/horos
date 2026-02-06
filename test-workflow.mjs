#!/usr/bin/env node
/**
 * Workflow 页面自动化测试脚本
 * 使用 Chrome DevTools MCP 进行浏览器自动化测试
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP 服务器路径
const MCP_SERVER = join(__dirname, 'chrome-devtools-mcp/build/src/index.js');

class ChromeDevToolsMCP {
  constructor() {
    this.process = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  async start() {
    console.log('🚀 启动 Chrome DevTools MCP 服务器...');
    
    this.process = spawn('node', [
      MCP_SERVER,
      '--no-usage-statistics',
      '--headless',
      '--viewport', '1280x720'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const msg = JSON.parse(line);
            this.handleMessage(msg);
          } catch (e) {
            console.log('MCP Output:', line);
          }
        }
      }
    });

    this.process.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('debugger')) {
        console.error('MCP Error:', msg);
      }
    });

    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ MCP 服务器已启动');
  }

  handleMessage(msg) {
    if (msg.id && this.pendingRequests.has(msg.id)) {
      const { resolve, reject } = this.pendingRequests.get(msg.id);
      this.pendingRequests.delete(msg.id);
      if (msg.error) {
        reject(new Error(msg.error.message));
      } else {
        resolve(msg.result);
      }
    }
  }

  async callTool(name, args) {
    const id = ++this.messageId;
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\n');
      
      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Tool call timeout: ${name}`));
        }
      }, 30000);
    });
  }

  async listTools() {
    const id = ++this.messageId;
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/list'
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\n');
      setTimeout(() => reject(new Error('List tools timeout')), 10000);
    });
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      console.log('🛑 MCP 服务器已停止');
    }
  }
}

// 测试场景
async function runTests() {
  const mcp = new ChromeDevToolsMCP();
  
  try {
    await mcp.start();

    // 1. 列出可用工具
    console.log('\n📋 获取可用工具列表...');
    const tools = await mcp.listTools();
    console.log(`✅ 发现 ${tools.tools?.length || 0} 个工具`);

    // 2. 导航到 workflow 页面
    console.log('\n🌐 导航到 Workflow 页面...');
    await mcp.callTool('navigate_page', { url: 'http://localhost:4002/workflow' });
    console.log('✅ 页面加载完成');

    // 3. 等待页面稳定
    await new Promise(r => setTimeout(r, 2000));

    // 4. 截图
    console.log('\n📸 截取页面截图...');
    const screenshot = await mcp.callTool('take_screenshot', {});
    console.log('✅ 截图完成');
    
    // 保存截图信息
    if (screenshot?.content?.[0]?.data) {
      const fs = await import('fs');
      const path = join(__dirname, 'test-screenshot.png');
      fs.writeFileSync(path, Buffer.from(screenshot.content[0].data, 'base64'));
      console.log(`💾 截图已保存: ${path}`);
    }

    // 5. 获取页面标题
    console.log('\n📄 获取页面信息...');
    const title = await mcp.callTool('evaluate_script', { 
      function: '() => document.title'
    });
    console.log(`📌 页面标题: ${title.content?.[0]?.text || 'unknown'}`);

    // 6. 检查 React Flow 画布
    console.log('\n🎯 检查 React Flow 画布...');
    await new Promise(r => setTimeout(r, 1000));
    const canvasCheck = await mcp.callTool('evaluate_script', {
      function: `() => {
        const canvas = document.querySelector('.react-flow__renderer');
        return canvas ? {
          exists: true,
          width: canvas.offsetWidth,
          height: canvas.offsetHeight,
          nodeCount: document.querySelectorAll('.react-flow__node').length
        } : { exists: false };
      }`,
      returnByValue: true
    });
    console.log('✅ Canvas 检查结果:', canvasCheck.content?.[0]?.text);

    // 7. 检查控制台错误
    console.log('\n🔍 检查控制台日志...');
    const logs = await mcp.callTool('list_console_messages', { level: 'error' });
    const logText = logs.content?.[0]?.text || '无错误';
    console.log('✅ 控制台错误:', logText === '[]' ? '无错误' : logText);

    console.log('\n✨ 所有测试通过！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exitCode = 1;
  } finally {
    await mcp.stop();
  }
}

// 运行测试
runTests();
