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
      s2: [0, 0, 0.25],
      s3: [0, 0, -3.8],
    },

    encounters: {
      a: {
        name: '离开工位',
        purpose: '从安全工位观察组长与经理，再从桌子两侧离开。',
      },
      b: {
        name: '团队办公区',
        purpose: '第一组双环。左侧低掩体，右侧开放视线，中央是短而暴露的切线。',
      },
      c: {
        name: '管理层走廊',
        purpose: '第二组双环。老板办公室与会议室夹住路径，S3 是最后观察岛。',
      },
      d: {
        name: '电梯前厅',
        purpose: '呼叫电梯后等待，并处理老板临时检查出口的反应事件。',
      },
    },
  },

  navigation: {
    nodes: [
      { id: 'P', position: [0, 0, 6.65] },
      { id: 'PL', position: [-1.65, 0, 6.65] },
      { id: 'PR', position: [1.65, 0, 6.65] },
      { id: 'SL', position: [-1.65, 0, 4.65] },
      { id: 'SR', position: [1.65, 0, 4.65] },
      { id: 'S1', position: [0, 0, 4.55] },

      { id: 'S1FL', position: [-1.25, 0, 4.5] },
      { id: 'S1FR', position: [1.25, 0, 4.5] },
      { id: 'C1L', position: [-1.25, 0, 2.7] },
      { id: 'C1R', position: [1.25, 0, 2.7] },
      { id: 'C2', position: [0, 0, 1.35] },

      { id: 'W1', position: [-3.0, 0, 4.25] },
      { id: 'W2', position: [-5.15, 0, 3.25] },
      { id: 'W3', position: [-5.25, 0, 1.15] },
      { id: 'W4A', position: [-5.15, 0, -0.55] },
      { id: 'W4B', position: [-3.0, 0, -0.55] },

      { id: 'WP1', position: [-8.35, 0, 3.2] },
      { id: 'WP', position: [-8.45, 0, 5.85] },

      { id: 'E1', position: [3.0, 0, 4.25] },
      { id: 'E2', position: [5.15, 0, 3.25] },
      { id: 'E3', position: [5.35, 0, 1.05] },
      { id: 'E4', position: [3.15, 0, -0.45] },

      { id: 'TEA1', position: [7.25, 0, 3.45] },
      { id: 'TEA', position: [8.2, 0, 4.15] },

      { id: 'S2', position: [0, 0, 0.25] },
      { id: 'S2FL', position: [-1.3, 0, 0.2] },
      { id: 'S2FR', position: [1.3, 0, 0.2] },
      { id: 'S2L', position: [-1.3, 0, -1.45] },
      { id: 'S2R', position: [1.3, 0, -1.45] },

      { id: 'W5', position: [-4.2, 0, -1.3] },
      { id: 'W6', position: [-3.98, 0, -3.05] },
      { id: 'W6B', position: [-3.98, 0, -4.15] },
      { id: 'W7', position: [-3.2, 0, -4.15] },

      { id: 'BDA', position: [-4.05, 0, -2.15] },
      { id: 'BDB', position: [-5.65, 0, -2.15] },
      { id: 'BD', position: [-6.55, 0, -2.72] },
      { id: 'BI', position: [-6.55, 0, -3.68] },

      { id: 'E5', position: [4.2, 0, -1.3] },
      { id: 'E6', position: [4.0, 0, -3.05] },
      { id: 'E6B', position: [4.0, 0, -4.1] },
      { id: 'E7', position: [3.2, 0, -4.1] },

      { id: 'MDA', position: [4.05, 0, -2.15] },
      { id: 'MDB', position: [5.65, 0, -2.15] },
      { id: 'MD', position: [6.55, 0, -2.68] },
      { id: 'MI', position: [6.55, 0, -3.58] },

      { id: 'C3L', position: [-1.25, 0, -1.95] },
      { id: 'C3R', position: [1.25, 0, -1.95] },
      { id: 'C3', position: [0, 0, -2.45] },
      { id: 'C4', position: [0, 0, -3.25] },

      { id: 'S3', position: [0, 0, -3.8] },
      { id: 'S3FL', position: [-1.45, 0, -3.9] },
      { id: 'S3FR', position: [1.45, 0, -3.9] },
      { id: 'S3L', position: [-1.45, 0, -5.25] },
      { id: 'S3R', position: [1.45, 0, -5.25] },

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
      ['W3', 'W4A'],
      ['W4A', 'W4B'],
      ['W4B', 'S2'],

      ['W2', 'WP1'],
      ['WP1', 'WP'],

      ['S1', 'E1'],
      ['E1', 'E2'],
      ['E2', 'E3'],
      ['E3', 'E4'],
      ['E4', 'S2'],

      ['E2', 'TEA1'],
      ['TEA1', 'TEA'],

      ['S1', 'S1FL'],
      ['S1', 'S1FR'],
      ['S1FL', 'C1L'],
      ['S1FR', 'C1R'],
      ['C1L', 'C2'],
      ['C1R', 'C2'],
      ['C2', 'S2'],

      ['S2', 'S2FL'],
      ['S2FL', 'S2L'],
      ['S2L', 'W5'],
      ['W5', 'W6'],
      ['W6', 'W6B'],
      ['W6B', 'W7'],
      ['W7', 'S3'],

      ['W5', 'BDA'],
      ['BDA', 'BDB'],
      ['BDB', 'BD'],
      ['BD', 'BI'],

      ['S2', 'S2FR'],
      ['S2FR', 'S2R'],
      ['S2R', 'E5'],
      ['E5', 'E6'],
      ['E6', 'E6B'],
      ['E6B', 'E7'],
      ['E7', 'S3'],

      ['E5', 'MDA'],
      ['MDA', 'MDB'],
      ['MDB', 'MD'],
      ['MD', 'MI'],

      ['S2L', 'C3L'],
      ['S2R', 'C3R'],
      ['C3L', 'C3'],
      ['C3R', 'C3'],
      ['C3', 'C4'],
      ['C4', 'S3'],

      ['S3', 'S3FL'],
      ['S3', 'S3FR'],
      ['S3FL', 'S3L'],
      ['S3FR', 'S3R'],
      ['S3L', 'EL'],
      ['S3R', 'ER'],
      ['EL', 'EV'],
      ['ER', 'EV'],
    ],
  },

  routeDesign: {
    firstRing: {
      west: '低掩体较多，距离长，组长主要控制这里。',
      center: '最短，但必须从 S1 文件柜侧面探出，并穿过组长与经理的交叉视野。',
      east: '玻璃与开放空间较多，需要读经理去茶水区/会议室的节奏。',
    },

    secondRing: {
      west: '贴近老板办公室，硬遮挡多，但老板偶尔会出门。',
      center: '绕过 S2 文件柜后直切 S3，距离短、遮挡少。',
      east: '绕会议室，路径较长，但能利用玻璃房边缘切断追逐视线。',
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
          position: [0, 0, -3.8],
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
          position: [-8.45, 0, 5.85],
          action: 'print',
          duration: 2.4,
          facing: [-1, 0, 0],
        },
        {
          position: [-5.25, 0, 1.15],
          action: 'check',
          duration: 2.2,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, 0.25],
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
          position: [0, 0, 1.35],
          action: 'inspect',
          duration: 4.8,
          facing: [0, 0, 1],
        },
        {
          position: [8.2, 0, 4.15],
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
          position: [0, 0, -2.45],
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
          position: [-3.2, 0, -4.15],
          action: 'check',
          duration: 2.0,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, -3.8],
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
