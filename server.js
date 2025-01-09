import express from 'express';
import { readJsonFile } from './components/readJsonFiles.js';
import { generatePrompt } from './components/generatePrompt.js';
import { updateAgentFiles } from './components/updateAgentFiles.js';
import fetch from 'node-fetch';
import { AI_API_URL, AI_API_KEY } from './config.js';

const app = express();
app.use(express.json());

console.log('Server initialization started...');

async function buildAIRequest() {
  const [agentBase, agentPlans, agentMemory] = await Promise.all([
    readJsonFile('agent-base.json'),
    readJsonFile('agent-plans.json'),
    readJsonFile('agent-memory.json')
  ]);

  return {
    agent: {
      id: agentBase?.agentId,
      currentState: {
        location: agentBase?.status?.location,
        time: new Date().toISOString(),
        energy: agentBase?.status?.energy,
        mood: agentBase?.status?.mood
      }
    },
    context: {
      environment: {
        location: agentBase?.status?.location,
        objects: [],
        people: [],
        events: []
      },
      timeContext: {
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
        dayOfWeek: new Date().getDay(),
        weather: 'sunny'
      }
    },
    plans: {
      currentDailyPlan: {
        schedule: agentPlans?.dailySchedule?.routines || [],
        progress: 0,
        priority: 'normal'
      },
      flexibleTasks: agentPlans?.dailySchedule?.flexibleTasks || []
    },
    memory: {
      recentEvents: agentMemory?.shortTerm?.recentEvents || [],
      temporaryGoals: agentMemory?.shortTerm?.temporaryGoals || [],
      relationships: agentMemory?.longTerm?.relationships || {}
    },
    constraints: {
      mustDo: [],
      cannotDo: [],
      preferences: agentBase?.personality?.preferences || []
    }
  };
}

async function callAIApi(messages) {
  console.log('Calling AI API with messages:', JSON.stringify(messages, null, 2));
  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "glm-4-Flash",
        messages: messages,
        stream: false
      })
    });

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }

    const response = await res.json();
    console.log('AI API response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error calling AI API:', error);
    return null;
  }
}

app.post('/api/decide', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    const requestData = await buildAIRequest();
    const agentBase = await readJsonFile('agent-base.json');
    const prompt = generatePrompt(agentBase, requestData);

    const messages = [{
      role: 'system',
      content: prompt
    }, {
      role: 'user',
      content: JSON.stringify(requestData) + '\n用户输入: ' + req.body.userInput
    }];

    const response = await callAIApi(messages);
    if (!response) {
      throw new Error('Failed to get AI response');
    }

    // 更新agent文件
    await updateAgentFiles(response);
    
    // 重新读取更新后的数据
    const [updatedBase, updatedPlans, updatedMemory] = await Promise.all([
      readJsonFile('agent-base.json'),
      readJsonFile('agent-plans.json'),
      readJsonFile('agent-memory.json')
    ]);

    console.log('Sending response:', response);
    res.json({
      decision: {
        action: response.choices[0].message.content.decision?.action || '无操作',
        target: response.choices[0].message.content.decision?.target || '',
        duration: response.choices[0].message.content.decision?.duration || 0
      },
      reasoning: {
        decisionBasis: response.choices[0].message.content.reasoning?.decisionBasis || "基于当前状态和用户输入进行分析",
        alternativePlans: response.choices[0].message.content.reasoning?.alternativePlans || []
      },
      stateUpdates: {
        energy: updatedBase?.status?.energy || 0,
        mood: updatedBase?.status?.mood || "正常",
        location: updatedBase?.status?.location || "未知"
      },
      reaction: response.choices[0].message.content.reaction || {},
      content: response.choices[0].message.content // 添加content字段
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

const port = 3000;
app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  
  try {
    const [agentBase, agentPlans] = await Promise.all([
      readJsonFile('agent-base.json'),
      readJsonFile('agent-plans.json')
    ]);
    
    console.log('Agent initialized:', agentBase?.name);
    console.log('Agent status:', agentBase?.status);
    console.log('Daily routines:', agentPlans?.dailySchedule?.routines);
  } catch (error) {
    console.error('Error reading agent data:', error);
  }
});