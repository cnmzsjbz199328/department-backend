import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = express();
app.use(express.json());

console.log('Server initialization started...');

const AI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const AI_API_KEY = '7a51c6d1bd332df2fd71986db4727432.hxU7u4amBL8TlRFe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

console.log('Data directory:', dataDir);

async function readJsonFile(filename) {
  const filePath = path.join(dataDir, filename);
  console.log(`Reading file: ${filePath}`);
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

async function writeJsonFile(filename, data) {
  const filePath = path.join(dataDir, filename);
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully updated ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

async function updateAgentFiles(aiResponse) {
  try {
    const responseData = aiResponse.choices[0].message.content;
    if (typeof responseData === 'string') {
      try {
        aiResponse.choices[0].message.content = JSON.parse(responseData);
      } catch {
        throw new Error('Invalid JSON response from AI');
      }
    }

    const { stateUpdates, memoryUpdates, planUpdates } = aiResponse.choices[0].message.content;

    // 更新 agent-base.json
    const agentBase = await readJsonFile('agent-base.json');
    if (agentBase && stateUpdates) {
      if (stateUpdates.energyChange) {
        agentBase.status.energy = Math.max(0, Math.min(100, 
          agentBase.status.energy + stateUpdates.energyChange));
      }
      if (stateUpdates.moodChange) {
        agentBase.status.mood = stateUpdates.moodChange;
      }
      if (stateUpdates.locationChange) {
        agentBase.status.location = stateUpdates.locationChange;
      }
      await writeJsonFile('agent-base.json', agentBase);
    }

    // 更新 agent-plans.json
    const agentPlans = await readJsonFile('agent-plans.json');
    if (agentPlans && planUpdates) {
      if (planUpdates.completedTasks) {
        agentPlans.dailySchedule.routines = agentPlans.dailySchedule.routines
          .filter(task => !planUpdates.completedTasks.includes(task));
      }
      if (planUpdates.newTasks) {
        agentPlans.dailySchedule.routines.push(...planUpdates.newTasks);
      }
      if (planUpdates.adjustments) {
        planUpdates.adjustments.forEach(adjustment => {
          const taskIndex = agentPlans.dailySchedule.routines.indexOf(adjustment.oldTask);
          if (taskIndex !== -1) {
            agentPlans.dailySchedule.routines[taskIndex] = adjustment.newTask;
          }
        });
      }
      await writeJsonFile('agent-plans.json', agentPlans);
    }

    // 更新 agent-memory.json
    const agentMemory = await readJsonFile('agent-memory.json');
    if (agentMemory && memoryUpdates) {
      if (memoryUpdates.shortTerm?.addEvents) {
        agentMemory.shortTerm.recentEvents.push(...memoryUpdates.shortTerm.addEvents);
      }
      if (memoryUpdates.shortTerm?.removeEvents) {
        agentMemory.shortTerm.recentEvents = agentMemory.shortTerm.recentEvents
          .filter(event => !memoryUpdates.shortTerm.removeEvents.includes(event));
      }
      if (memoryUpdates.longTerm?.experiences) {
        agentMemory.longTerm.experiences.push(...memoryUpdates.longTerm.experiences);
      }
      if (memoryUpdates.longTerm?.relationships) {
        Object.assign(agentMemory.longTerm.relationships, memoryUpdates.longTerm.relationships);
      }
      await writeJsonFile('agent-memory.json', agentMemory);
    }

    return true;
  } catch (error) {
    console.error('Error updating agent files:', error);
    return false;
  }
}

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
    const messages = [{
      role: 'system',
      content: '你是一个智能体，请根据当前状态做出合理决策'
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
      }
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
