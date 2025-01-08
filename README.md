# Node + Express Service Starter

This is a simple API sample in Node.js with express.js based on [Google Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service).

## Getting Started

Server should run automatically when starting a workspace. To run manually, run:
```sh
npm run dev

核心JSON文件结构：

agent-base.json - 智能体基础信息：
Copy{
  "agentId": "唯一标识",
  "name": "名称",
  "personality": {
    "type": "性格类型",
    "traits": ["性格特征列表"],
    "preferences": ["偏好列表"]
  },
  "status": {
    "energy": "精力值",
    "mood": "心情",
    "location": "当前位置",
    "lastUpdate": "最后更新时间"
  }
}
agent-plans.json - 分层计划系统：
Copy{
  "yearlyPlans": [{
    "title": "计划标题",
    "goals": ["目标列表"],
    "progress": "进度",
    "childPlans": ["月度计划ID列表"]
  }],
  "monthlyPlans": [...],
  "weeklyPlans": [...],
  "dailySchedule": {
    "routines": ["日常活动列表"],
    "flexibleTasks": ["灵活任务列表"],
    "timeBlocks": ["时间块配置"]
  }
}
agent-memory.json - 记忆系统：
Copy{
  "shortTerm": {
    "recentEvents": ["最近事件列表"],
    "currentContext": "当前环境信息",
    "temporaryGoals": ["临时目标列表"]
  },
  "longTerm": {
    "experiences": ["重要经历"],
    "relationships": ["关系网络"],
    "knowledge": ["已获得的知识"]
  }
}
后端设计提示词：
Copy设计目标：
实现一个能够模拟真实个体日常生活的AI智能体系统。系统应该能够展现智能体的自然行为、决策过程和情感变化。

核心功能需求：

1. 时间系统
- 实现24小时的时间循环
- 支持不同时间段的行为权重
- 考虑生理周期（如疲劳度）

2. 决策系统
- 基于当前状态选择合适的行为
- 权衡多个目标的优先级
- 处理突发事件和计划变更

3. 行为系统
- 生成符合性格特征的行为
- 考虑环境和社交因素
- 模拟自然的行为转换

4. 状态管理
- 追踪并更新智能体状态
- 处理状态间的相互影响
- 维护合理的状态变化

技术实现要求：

1. 文件操作
- 实现JSON文件的读写操作
- 保证数据一致性
- 处理并发访问

2. 行为生成
- 使用自然语言生成器
- 考虑上下文连贯性
- 生成符合人设的对话

3. 模拟控制
- 支持时间加速/减速
- 允许暂停和继续
- 提供状态监控接口

4. 接口设计
- 提供行为查询接口
- 支持状态实时更新
- 允许外部干预

注意事项：
1. 保持行为的自然性和连贯性
2. 确保性格特征的一致表现
3. 避免机械化的行为模式
4. 加入适当的随机性
5. 考虑情感对行为的影响

扩展建议：
1. 支持多个智能体互动
2. 实现事件触发机制
3. 加入学习和成长系统
4. 提供行为统计和分析
这个设计提示词概述了系统的主要组成部分和实现要求。你觉得还需要补充或调整哪些方面？我们可以进一步讨论具体的实现细节。 CopyRetryClaude does not have the ability to run the code it generates yet.TM将ai api请求的提示词补充完整，比如说我从一个json文件中获取到计划，我同时根据另一个json文件感知到周围的事物状态，我会将这些信息发送ai api，发送格式有要求，返回的参数也有明确的结构，以方便我更新各类系统。是不是这样的？根据这一点，进一步补充我的设计Edit2 / 2对,让我帮你设计一个完整的AI API交互流程：

输入提示词结构：

Copy{
  "agent": {
    "id": "唯一标识",
    "currentState": {
      "location": "位置",
      "time": "当前时间",
      "energy": "精力值",
      "mood": "心情值"
    }
  },

  "context": {
    "environment": {
      "location": "具体位置描述",
      "objects": ["可交互物品列表"],
      "people": ["在场的其他智能体"],
      "events": ["正在发生的事件"]
    },
    "timeContext": {
      "timeOfDay": "一天中的时段",
      "dayOfWeek": "星期几",
      "weather": "天气状况"
    }
  },

  "plans": {
    "currentDailyPlan": {
      "schedule": ["当前时段计划"],
      "progress": "完成进度",
      "priority": "优先级"
    },
    "flexibleTasks": ["需要处理的灵活任务"]
  },

  "memory": {
    "recentEvents": ["最近发生的事件"],
    "relationships": {
      "person": "关系状态",
      "lastInteraction": "上次互动时间"
    }
  },

  "constraints": {
    "mustDo": ["必须完成的事项"],
    "cannotDo": ["受限制的行为"],
    "preferences": ["行为偏好"]
  }
}

期望的输出结构：

Copy{
  "decision": {
    "action": "选择的行为",
    "target": "行为对象",
    "duration": "预计持续时间",
    "priority": "行为优先级"
  },

  "reasoning": {
    "considerationFactors": ["考虑的因素"],
    "decisionBasis": "决策依据",
    "alternativePlans": ["备选方案"]
  },

  "stateUpdates": {
    "energyChange": "精力值变化",
    "moodChange": "心情值变化",
    "locationChange": "位置变化",
    "newSkills": ["可能获得的技能"]
  },

  "memoryUpdates": {
    "shortTerm": {
      "addEvents": ["需要记录的新事件"],
      "removeEvents": ["可以遗忘的旧事件"]
    },
    "longTerm": {
      "experiences": ["值得长期记住的经验"],
      "relationships": ["关系变化"]
    }
  },

  "planUpdates": {
    "completedTasks": ["已完成的任务"],
    "newTasks": ["新增的任务"],
    "adjustments": ["需要调整的计划"]
  },

  "emotionalResponse": {
    "type": "情绪类型",
    "intensity": "情绪强度",
    "duration": "预计持续时间",
    "triggers": ["触发因素"]
  }
}

示例提示词模板：

Copy你是一个名为 [agent_name] 的智能体。基于以下信息，请做出合理的行为决策：

1. 当前状态：
[输入当前状态信息]

2. 环境信息：
[输入环境感知信息]

3. 计划安排：
[输入计划相关信息]

4. 记忆内容：
[输入记忆相关信息]

5. 行为约束：
[输入约束条件]

请基于你的性格特征和当前情况，决定接下来的行为。需要考虑：
- 计划的优先级
- 当前的精力状态
- 环境因素的影响
- 社交需求
- 个人偏好

请按照指定的JSON格式返回你的决策结果。

API调用流程：

Copy1. 定时触发
- 每个时间单位（如15分钟）触发一次决策
- 特殊事件发生时立即触发

2. 数据准备
- 读取相关JSON文件
- 整合当前状态信息
- 构建输入提示词

3. API调用
- 发送请求到AI服务
- 接收决策结果

4. 结果处理
- 解析返回的JSON
- 更新各个系统状态
- 执行决策行为

5. 状态保存
- 更新相关JSON文件
- 记录行为日志
- 保存状态变化

关键处理建议：

Copy1. 异常处理
- API调用失败的备选方案
- 不合理决策的过滤机制
- 状态更新的回滚机制

2. 行为连续性
- 维护行为上下文
- 确保决策连贯性
- 避免频繁切换

3. 资源管理
- 控制API调用频率
- 优化数据存储
- 管理内存使用

4. 监控和调试
- 记录关键决策点
- 追踪状态变化
- 支持行为回放
这样的设计能够：

保证数据的规范性和一致性
便于处理AI返回的结果
方便进行状态更新和管理
支持系统的可扩展性
```