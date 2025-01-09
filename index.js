import readline from 'readline';
import fetch from 'node-fetch';

console.log('Starting client application...');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_URL = 'http://localhost:3000/api/decide';

function extractResponse(data) {
  try {
    // 如果输入已经是对象，直接使用
    if (typeof data === 'object') {
      if (data.content) {
        // 从content中提取JSON字符串
        const jsonStr = data.content
          .replace('```json\n', '')  // 移除开头的 ```json
          .replace('\n```', '')      // 移除结尾的 ```
          .trim();                   // 移除多余空格
        
        // 解析JSON字符串
        const parsedData = JSON.parse(jsonStr);
        return parsedData.reaction.response;
      }
      return null;
    }
    
    // 如果输入是字符串，先解析成对象
    const parsedData = JSON.parse(data);
    if (parsedData.content) {
      const innerJson = parsedData.content
        .replace('```json\n', '')
        .replace('\n```', '')
        .trim();
      
      const innerData = JSON.parse(innerJson);
      return innerData.reaction.response;
    }
    return null;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

async function chatWithAgent() {
  console.log('智能Agent交互系统已启动');
  console.log('输入"exit"退出\n');

  while (true) {
    const input = await new Promise(resolve => {
      rl.question('你: ', resolve);
    });

    if (input.toLowerCase() === 'exit') {
      break;
    }

    try {
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
      //console.log('Server response:', data);
      const reactionResponse = extractResponse(data);
      if (reactionResponse) {
        console.log('回应:', reactionResponse);
      } else {
        console.log('没有反应');
      }
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