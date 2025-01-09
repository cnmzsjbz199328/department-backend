import readline from 'readline';
import fetch from 'node-fetch';

console.log('Starting client application...');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_URL = 'http://localhost:3000/api/decide';

async function chatWithAgent() {
  console.log('智能Agent交互系统已启动');
  console.log('输入"exit"退出\n');

  while (true) {
    const input = await new Promise(resolve => {
      rl.question('你: ', resolve);
    });

    console.log('User input received:', input);

    if (input.toLowerCase() === 'exit') {
      break;
    }

    try {
      console.log('Sending request to server...');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInput: input
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Server response:', data);
      console.log('Agent:', data.decision.action);
      console.log('理由:', data.reasoning.decisionBasis);
      console.log('情绪:', data.emotionalResponse?.type || '无情绪'); // 修改此行
      console.log('内容:', data.content); // 添加此行
      console.log();
    } catch (error) {
      console.error('发生错误:', error);
      console.error('Error details:', error.message);
    }
  }

  rl.close();
  console.log('会话结束');
  process.exit(0);
}

chatWithAgent();