export const officeLevel = {
  bounds: {
    minX: -10.5,
    maxX: 10.5,
    minZ: -8.5,
    maxZ: 8.5,
  },

  playerSpawn: [0, 0, 6.85],

  prepZone: {
    center: [0, 0, 6.85],
    radius: 1.75,
  },

  extraction: {
    position: [0, 0, -7.55],
    radius: 1.1,
  },

  routeDesign: {
    west: {
      name: '格子间',
      character: '慢 / 低掩体 / 蹲伏',
    },
    center: {
      name: '主通道',
      character: '最快 / 最暴露 / 看时机冲刺',
    },
    east: {
      name: '会议室',
      character: '中等 / 玻璃视野 / 读经理行为',
    },
  },

  npcs: [
    {
      id: 'team-lead',
      role: '组长',
      danger: 1,

      catchLine: '小杨，这个版本你顺手发一下。',
      penaltyMinutes: 12,
      energyCost: 8,
      minigame: 'version-hunt',

      speed: 1.4,
      chaseSpeed: 2.8,
      chaseMemory: 2.8,
      visionDistance: 4.8,
      visionAngle: 62,

      routine: [
        {
          position: [-6.65, 0, 4.4],
          action: 'check',
          duration: 2.5,
          facing: [0, 0, -1],
        },
        {
          position: [-8.9, 0, 5.65],
          action: 'print',
          duration: 3.0,
          facing: [-1, 0, 0],
        },
        {
          position: [-7.65, 0, 1.65],
          action: 'inspect',
          duration: 2.2,
          facing: [1, 0, 0],
        },
        {
          position: [-5.9, 0, -1.45],
          action: 'read',
          duration: 3.6,
          facing: [0, 0, -1],
        },
        {
          position: [-6.65, 0, 4.4],
          action: 'sit',
          duration: 4.0,
          facing: [0, 0, -1],
          ignoreCollision: true,
        },
      ],
    },

    {
      id: 'manager',
      role: '部门经理',
      danger: 2,

      catchLine: '诶，正好，快速碰一下。',
      penaltyMinutes: 32,
      energyCost: 18,
      minigame: 'quick-sync',

      speed: 1.3,
      chaseSpeed: 2.65,
      chaseMemory: 3.2,
      visionDistance: 5.6,
      visionAngle: 70,

      routine: [
        {
          position: [6.55, 0, 3.85],
          action: 'check',
          duration: 2.4,
          facing: [0, 0, -1],
        },
        {
          position: [8.75, 0, 2.1],
          action: 'tea',
          duration: 4.0,
          facing: [1, 0, 0],
        },
        {
          position: [5.35, 0, 0.45],
          action: 'inspect',
          duration: 2.4,
          facing: [-1, 0, 0],
        },
        {
          position: [6.75, 0, -4.85],
          action: 'meeting',
          duration: 5.0,
          facing: [0, 0, -1],
        },
        {
          position: [8.75, 0, 2.1],
          action: 'tea',
          duration: 2.6,
          facing: [1, 0, 0],
        },
      ],
    },

    {
      id: 'boss',
      role: '老板',
      danger: 3,

      catchLine: '你先别走，我有个想法。',
      penaltyMinutes: 90,
      energyCost: 28,
      minigame: 'quick-sync',

      speed: 1.1,
      chaseSpeed: 2.45,
      chaseMemory: 3.8,
      visionDistance: 6.1,
      visionAngle: 76,

      routine: [
        {
          position: [-6.65, 0, -5.0],
          action: 'read',
          duration: 7.5,
          facing: [0, 0, -1],
          ignoreCollision: true,
        },
        {
          position: [-6.65, 0, -3.15],
          action: 'inspect',
          duration: 2.4,
          facing: [0, 0, 1],
        },
        {
          position: [-2.7, 0, -2.7],
          action: 'check',
          duration: 2.0,
          facing: [1, 0, 0],
        },
        {
          position: [0.15, 0, -2.7],
          action: 'inspect',
          duration: 3.2,
          facing: [0, 0, 1],
        },
        {
          position: [2.9, 0, -2.7],
          action: 'check',
          duration: 2.0,
          facing: [-1, 0, 0],
        },
        {
          position: [-6.65, 0, -3.15],
          action: 'walk',
          duration: 0,
        },
      ],
    },
  ],
};
