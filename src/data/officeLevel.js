export const officeLevel = {
  bounds: {
    minX: -10.5,
    maxX: 10.5,
    minZ: -8.5,
    maxZ: 8.5,
  },

  playerSpawn: [0, 0, 6.25],

  prepZone: {
    center: [0, 0, 6.25],
    radius: 1.65,
  },

  extraction: {
    position: [0, 0, -7.45],
    radius: 1.0,
    callSeconds: 3.6,
  },

  navigation: {
    nodes: [
      { id: 'S0', position: [0, 0, 6.25] },

      { id: 'C1', position: [0, 0, 4.8] },
      { id: 'C2', position: [0, 0, 3.2] },
      { id: 'C3', position: [0, 0, 1.2] },
      { id: 'C4', position: [0, 0, -1.2] },
      { id: 'C5', position: [0, 0, -3.7] },
      { id: 'C6', position: [0, 0, -5.6] },
      { id: 'C7', position: [0, 0, -6.9] },

      { id: 'W0', position: [-2.6, 0, 5.25] },
      { id: 'W1', position: [-4.9, 0, 5.8] },
      { id: 'WP', position: [-8.55, 0, 5.8] },
      { id: 'W2', position: [-2.6, 0, 3.2] },
      { id: 'W3', position: [-5.0, 0, 3.2] },
      { id: 'W4', position: [-2.6, 0, 1.2] },
      { id: 'W5', position: [-5.0, 0, 1.2] },
      { id: 'W6', position: [-2.6, 0, -1.2] },
      { id: 'W7', position: [-5.0, 0, -1.2] },
      { id: 'W8', position: [-2.6, 0, -3.7] },
      { id: 'W9', position: [-5.0, 0, -3.7] },
      { id: 'W10', position: [-2.6, 0, -5.6] },
      { id: 'BD', position: [-6.55, 0, -2.95] },
      { id: 'BI', position: [-6.55, 0, -3.75] },

      { id: 'E0', position: [2.6, 0, 5.2] },
      { id: 'E1', position: [5.15, 0, 5.2] },
      { id: 'TEA', position: [8.2, 0, 4.2] },
      { id: 'E2', position: [2.6, 0, 3.2] },
      { id: 'E3', position: [5.15, 0, 3.2] },
      { id: 'E4', position: [2.6, 0, 1.2] },
      { id: 'E5', position: [5.15, 0, 1.2] },
      { id: 'E6', position: [2.6, 0, -1.2] },
      { id: 'E7', position: [5.15, 0, -1.2] },
      { id: 'E8', position: [2.6, 0, -3.0] },
      { id: 'MD', position: [6.55, 0, -2.75] },
      { id: 'MI', position: [6.55, 0, -3.65] },
      { id: 'E9', position: [2.6, 0, -5.6] },
    ],

    edges: [
      ['S0', 'C1'],
      ['C1', 'C2'],
      ['C2', 'C3'],
      ['C3', 'C4'],
      ['C4', 'C5'],
      ['C5', 'C6'],
      ['C6', 'C7'],

      ['S0', 'W0'],
      ['W0', 'W1'],
      ['W1', 'WP'],
      ['W0', 'W2'],
      ['W2', 'W3'],
      ['W2', 'W4'],
      ['W4', 'W5'],
      ['W4', 'W6'],
      ['W6', 'W7'],
      ['W6', 'W8'],
      ['W8', 'W9'],
      ['W8', 'W10'],
      ['W9', 'BD'],
      ['BD', 'BI'],
      ['W10', 'C6'],

      ['C1', 'W0'],
      ['C2', 'W2'],
      ['C3', 'W4'],
      ['C4', 'W6'],
      ['C5', 'W8'],

      ['S0', 'E0'],
      ['E0', 'E1'],
      ['E1', 'TEA'],
      ['E0', 'E2'],
      ['E2', 'E3'],
      ['E2', 'E4'],
      ['E4', 'E5'],
      ['E4', 'E6'],
      ['E6', 'E7'],
      ['E6', 'E8'],
      ['E8', 'MD'],
      ['MD', 'MI'],
      ['E8', 'E9'],
      ['E9', 'C6'],

      ['C1', 'E0'],
      ['C2', 'E2'],
      ['C3', 'E4'],
      ['C4', 'E6'],
      ['C5', 'E8'],
    ],
  },

  routeDesign: {
    west: {
      name: '格子间',
      character: '最安全 / 最长 / 低掩体与蹲伏',
    },
    center: {
      name: '主通道',
      character: '最快 / 两条交叉巡查 / 等窗口再冲',
    },
    east: {
      name: '会议室',
      character: '中等距离 / 玻璃视线 / 读经理节奏',
    },
  },

  events: {
    extractionCall: {
      npcId: 'boss',
      routine: [
        {
          position: [-6.55, 0, -2.95],
          action: 'walk',
          duration: 0,
        },
        {
          position: [0, 0, -3.7],
          action: 'inspect',
          duration: 1.1,
          facing: [0, 0, -1],
        },
        {
          position: [0, 0, -5.6],
          action: 'check',
          duration: 2.7,
          facing: [0, 0, -1],
        },
        {
          position: [-6.55, 0, -2.95],
          action: 'walk',
          duration: 0,
        },
      ],
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

      speed: 1.45,
      chaseSpeed: 2.85,
      chaseMemory: 2.8,
      visionDistance: 5.0,
      visionAngle: 64,

      routine: [
        {
          position: [-5.0, 0, 3.2],
          action: 'check',
          duration: 2.1,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, 3.2],
          action: 'inspect',
          duration: 2.0,
          facing: [0, 0, 1],
        },
        {
          position: [-8.55, 0, 5.8],
          action: 'print',
          duration: 2.8,
          facing: [-1, 0, 0],
        },
        {
          position: [0, 0, 1.2],
          action: 'check',
          duration: 1.8,
          facing: [0, 0, -1],
        },
        {
          position: [-5.0, 0, -1.2],
          action: 'read',
          duration: 3.0,
          facing: [1, 0, 0],
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

      speed: 1.35,
      chaseSpeed: 2.7,
      chaseMemory: 3.2,
      visionDistance: 5.8,
      visionAngle: 72,

      routine: [
        {
          position: [5.15, 0, 3.2],
          action: 'check',
          duration: 2.0,
          facing: [-1, 0, 0],
        },
        {
          position: [0, 0, 1.2],
          action: 'inspect',
          duration: 2.2,
          facing: [0, 0, 1],
        },
        {
          position: [8.2, 0, 4.2],
          action: 'tea',
          duration: 3.5,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, -1.2],
          action: 'inspect',
          duration: 2.1,
          facing: [0, 0, -1],
        },
        {
          position: [6.55, 0, -3.65],
          action: 'meeting',
          duration: 4.2,
          facing: [0, 0, -1],
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

      speed: 1.15,
      chaseSpeed: 2.5,
      chaseMemory: 3.8,
      visionDistance: 6.2,
      visionAngle: 78,

      routine: [
        {
          position: [-6.55, 0, -3.75],
          action: 'read',
          duration: 5.8,
          facing: [0, 0, -1],
        },
        {
          position: [-6.55, 0, -2.95],
          action: 'inspect',
          duration: 1.5,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, -3.7],
          action: 'check',
          duration: 2.4,
          facing: [0, 0, 1],
        },
        {
          position: [0, 0, -5.6],
          action: 'inspect',
          duration: 2.2,
          facing: [0, 0, 1],
        },
        {
          position: [-6.55, 0, -2.95],
          action: 'walk',
          duration: 0,
        },
      ],
    },
  ],
};
