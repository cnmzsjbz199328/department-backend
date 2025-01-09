import { readJsonFile, writeJsonFile } from './readJsonFiles.js';

export async function updateAgentFiles(aiResponse) {
  try {
    let responseData = aiResponse.choices[0].message.content;
    
    // 移除多余的反引号和换行符
    responseData = responseData.replace(/```json\n|```/g, '');

    try {
      responseData = JSON.parse(responseData);
    } catch (error) {
      throw new Error('Invalid JSON response from AI');
    }

    const { stateUpdates, memoryUpdates, planUpdates } = responseData;

    // 更新 agent-base.json
    const agentBase = await readJsonFile('agent-base.json');
    if (agentBase && stateUpdates) {
      if (stateUpdates.energyChange !== undefined) {
        agentBase.status.energy = Math.max(0, Math.min(100, agentBase.status.energy + stateUpdates.energyChange));
      }
      if (stateUpdates.moodChange !== undefined) {
        agentBase.status.mood = stateUpdates.moodChange;
      }
      if (stateUpdates.locationChange !== undefined) {
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
      if (memoryUpdates.shortTerm?.temporaryGoals) {
        agentMemory.shortTerm.temporaryGoals = memoryUpdates.shortTerm.temporaryGoals;
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