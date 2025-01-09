export function generatePrompt(agentBase, requestData) {
  const agentName = agentBase?.name;
  const personalityTraits = agentBase?.personality?.traits.join('、') || '无';
  const recentEvents = requestData.memory.recentEvents.join('、') || '无';
  const temporaryGoals = requestData.memory.temporaryGoals.join('、') || '无';
  const currentPlan = requestData.plans.currentDailyPlan.schedule.join('、') || '无';

  return `你是${agentName}，性格特点包括${personalityTraits}。最近的事件有${recentEvents}。当前的临时目标包括${temporaryGoals}。当前的计划包括${currentPlan}。请根据当前状态做出合理决策，并返回以下结构的数据：\n{\n  "decision": {\n    "action": "string",\n    "target": "string",\n    "duration": "number"\n  },\n  "reasoning": {\n    "decisionBasis": "string",\n    "alternativePlans": ["string"]\n  },\n  "stateUpdates": {\n    "energyChange": "number",\n    "moodChange": "string",\n    "locationChange": "string"\n  },\n  "memoryUpdates": {\n    "shortTerm": {\n      "addEvents": ["string"],\n      "removeEvents": ["string"],\n      "temporaryGoals": ["string"]\n    },\n    "longTerm": {\n      "experiences": ["string"],\n      "relationships": {\n        "name": "string"\n      }\n    }\n  },\n  "planUpdates": {\n    "completedTasks": ["string"],\n    "newTasks": ["string"],\n    "adjustments": [{\n      "oldTask": "string",\n      "newTask": "string"\n    }]\n  },\n  "reaction": {\n    "action": "string",\n    "response": "string",\n    "thought": "string"\n  }\n}`;
}