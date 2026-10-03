export const officeLevel = {
  bounds: {
    minX: -10.5,
    maxX: 10.5,
    minZ: -8.5,
    maxZ: 8.5,
  },

  playerSpawn: [0, 0, 6.65],

  prepZone: {
    center: [0, 0, 6.65],
    radius: 1.75,
  },

  extraction: {
    position: [0, 0, -7.45],
    radius: 0.95,
    callSeconds: 3.8,
  },

  levelDesign: {
    safeIslands: {
      start: [0, 0, 6.65],
      s1: [0, 0, 4.55],
      s2: [0, 0, -0.1],
      s3: [0, 0, -4.0],
    },

    encounters: {
      a: {
        name: '离开工位',
        purpose: '观察组长和经理的初始交叉视线，再从桌子两侧离开。',
      },
      b: {
        name: '团队办公区',
        purpose: '第一组双环。左侧靠低掩体，右侧读经理节奏，中央是短而暴露的切线。',
      },
      c: {
        name: '管理层走廊',
        purpose: '第二组双环。老板办公室与会议室夹住中段，S3 是最后观察岛。',
      },
      d: {
        name: '电梯前厅',
        purpose: '呼叫电梯后等待，老板临时离开日程检查出口。',
      },
    },
  },

  navigation: {
    nodes: [
      { id: 'P', position: [0, 0, 6.65] },
      { id: 'PL', position: [-1.55, 0, 6.35] },
      { id: 'PR', position: [1.55, 0, 6.35] },
      { id: 'SL', position: [-1.55, 0, 4.65] },
      { id: 'SR', position: [1.55, 0, 4.65] },
      { id: 'S1', position: [0, 0, 4.55] },

      { id: 'C1L', position: [-1.0, 0, 3.05] },
      { id: 'C1R', position: [1.0, 0, 3.05] },
      { id: 'C2', position: [0, 0, 1.55] },

      { id: 'W1', position: [-3.0, 0, 4.25] },
      { id: 'W2', position: [-5.15, 0, 3.25] },
      { id: 'W3', position: [-5.35, 0, 1.2] },
      { id: 'W4', position: [-3.15, 0, -0.1] },

      { id: 'WP1', position: [-7.4, 0, 4.15] },
      { id: 'WP', position: [-8.7, 0, 5.7] },

      { id: 'E1', position: [3.0, 0, 4.25] },
      { id: 'E2', position: [5.15, 0, 3.25] },
      { id: 'E3', position: [5.35, 0, 1.05] },
      { id: 'E4', position: [3.15, 0, -0.1] },

      { id: 'TEA1', position: [7.25, 0, 3.7] },
      { id: 'TEA', position: [8.35, 0, 4.55] },

      { id: 'S2', position: [0, 0, -0.1] },
      { id: 'S2L', position: [-1.25, 0, -1.25] },
      { id: 'S2R', position: [1.25, 0, -1.25] },

      { id: 'W5', position: [-3.05, 0, -1.65] },
      { id: 'W6', position: [-4.75, 0, -2.65] },
      { id: 'W7', position: [-3.55, 0, -3.85] },

      { id: 'BD', position: [-6.55, 0, -2.72] },
      { id: 'BI', position: [-6.55, 0, -3.68] },

      { id: 'E5', position: [3.05, 0, -1.65] },
      { id: 'E6', position: [4.75, 0, -2.65] },
      { id: 'E7', position: [3.55, 0, -3.85] },

      { id: 'MD', position: [6.55, 0, -2.68] },
      { id: 'MI', position: [6.55, 0, -3.58] },

      { id: 'C3', position: [0, 0, -2.35] },
      { id: 'C4', position: [0, 0, -3.25] },

      { id: 'S3', position: [0, 0, -4.0] },
      { id: 'S3L', position: [-1.35, 0, -5.1] },
      { id: 'S3R', position: [1.35, 0, -5.1] },
      { id: 'EL', position: [-1.35, 0, -6.35] },
      { id: 'ER', position: [1.35, 0, -6.35] },
      { id: 'EV', position: [0, 0, -7.05] },
    ],

    edges: [
      ['P', 'PL'],
      ['PL', 'SL'],
      ['SL', 'S1'],

      ['P', 'PR'],
      ['PR', 'SR'],
      ['SR', 'S1'],

      ['S1', 'W1'],
      ['W1', 'W2'],
      ['W2', 'W3'],
      ['W3', 'W4'],
      ['W4', 'S2'],

      ['W2', 'WP1'],
      ['WP1', 'WP'],

      ['S1', 'E1'],
      ['E1', 'E2'],
      ['E2', 'E3'],
      ['E3', 'E4'],
      ['E4', 'S2'],

      ['E2', 'TEA1'],
      ['TEA1', 'TEA'],

      ['S1', 'C1L'],
      ['S1', 'C1R'],
      ['C1L', 'C2'],
      ['C1R', 'C2'],
      ['C2', 'S2'],

      ['S2', 'S2L'],
      ['S2L', 'W5'],
      ['W5', 'W6'],
      ['W6', 'W7'],
      ['W7', 'S3'],

      ['W6', 'BD'],
      ['BD', 'BI'],

      ['S2', 'S2R'],
      ['S2R', 'E5'],
      ['E5', 'E6'],
      ['E6', 'E7'],
      ['E7', 'S3'],

      ['E6', 'MD'],
      ['MD', 'MI'],

      ['S2L', 'C3'],
      ['S2R', 'C3'],
      ['C3', 'C4'],
      ['C4', 'S3'],

      ['S3', 'S3L'],
      ['S3', 'S3R'],
      ['S3L', 'EL'],
      ['S3R', 'ER'],
      ['EL', 'EV'],
      ['ER', 'EV'],
    ],
  },

  routeDesign: {
    firstRing: {
      west: '低掩体较多，距离长，组长主要控制这里。',
      center: '最短，但组长与经理的视线会交叉。',
      east: '玻璃与开放空间较多，需要读经理去茶水区/会议室的节奏。',
    },

    secondRing: {
      west: '贴近老板办公室，硬遮挡多，但老板偶尔会出门。',
      center: '最直接，也最容易同时进入经理与老板的观察方向。',
      east: '绕会议室，路径较长，但能利用玻璃房边缘和高柜切视线。',
    },
  },

  events: {
    extractionCall: {
      npcId: 'boss',
      routine: [
        {
          position: [-6.55, 0, -2.72],
          action: 'walk',
          duration: 0,
        },
        {
          position: [0, 0, -4.0],
          action: 'inspect',
          duration: 1.2,
          facing: [0, 0, -1],
        },
        {
          position: [0, 0, -6.35],
          action: 'check',
          duration: 2.7,
          facing: [0, 0, -1],
        },
        {
          position: [-6.55, 0, -2.72],
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

      speed: 1.5,
      chaseSpeed: 2.9,
      chaseMemory: 2.8,
      visionDistance: 5.05,
      visionAngle: 64,

      routine: [
        {
          position: [0, 0, 4.55],
          action: 'inspect',
          duration: 4.4,
          facing: [0, 0, 1],
        },
        {
          position: [-8.7, 0, 5.7],
          action: 'print',
          duration: 2.4,
          facing: [-1, 0, 0],
        },
        {
          position: [-5.35, 0, 1.2],
          action: 'check',
          duration: 2.2,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, -0.1],
          action: 'inspect',
          duration: 2.0,
          facing: [0, 0, 1],
        },
        {
          position: [-5.15, 0, 3.25],
          action: 'read',
          duration: 1.6,
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

      speed: 1.45,
      chaseSpeed: 2.75,
      chaseMemory: 3.2,
      visionDistance: 5.85,
      visionAngle: 72,

      routine: [
        {
          position: [0, 0, 1.55],
          action: 'inspect',
          duration: 4.8,
          facing: [0, 0, 1],
        },
        {
          position: [8.35, 0, 4.55],
          action: 'tea',
          duration: 3.2,
          facing: [1, 0, 0],
        },
        {
          position: [5.15, 0, 3.25],
          action: 'check',
          duration: 1.5,
          facing: [-1, 0, 0],
        },
        {
          position: [6.55, 0, -3.58],
          action: 'meeting',
          duration: 4.4,
          facing: [0, 0, -1],
        },
        {
          position: [0, 0, -2.35],
          action: 'inspect',
          duration: 2.2,
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
      visionDistance: 6.15,
      visionAngle: 76,

      routine: [
        {
          position: [-6.55, 0, -3.68],
          action: 'read',
          duration: 8.2,
          facing: [0, 0, -1],
        },
        {
          position: [-6.55, 0, -2.72],
          action: 'inspect',
          duration: 1.6,
          facing: [1, 0, 0],
        },
        {
          position: [-3.55, 0, -3.85],
          action: 'check',
          duration: 2.0,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, -4.0],
          action: 'inspect',
          duration: 2.2,
          facing: [0, 0, -1],
        },
        {
          position: [-6.55, 0, -2.72],
          action: 'walk',
          duration: 0,
        },
      ],
    },
  ],
};
