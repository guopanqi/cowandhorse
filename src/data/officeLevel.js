export const officeLevel = {
  bounds: {
    minX: -10.5,
    maxX: 10.5,
    minZ: -8.5,
    maxZ: 8.5,
  },

  // V3 deliberately breaks the old bottom-center -> top-center axis.
  playerSpawn: [-7.35, 0, 6.65],

  prepZone: {
    center: [-7.35, 0, 6.65],
    radius: 1.75,
  },

  extraction: {
    position: [7.25, 0, -7.35],
    radius: 0.95,
    callSeconds: 3.8,
  },

  levelDesign: {
    version: 'M3-V3-diagonal-core',
    safeIslands: {
      start: [-7.35, 0, 6.65],
      s1: [-4.1, 0, 4.8],
      s2: [0, 0, -1.45],
      s3: [5.05, 0, -5.65],
    },
    encounters: {
      a: {
        name: '工位出口',
        purpose: '从左下角工位离开，第一次读组长的打印路线。',
      },
      b: {
        name: '服务核心环',
        purpose: '围绕不透明的储物/服务器核心走西侧格子间、东侧协作区或南北切线。',
      },
      c: {
        name: '管理层夹层',
        purpose: '老板办公室与玻璃会议室形成第二个环，路线在后方重新汇合。',
      },
      d: {
        name: '右上电梯厅',
        purpose: '出口不在视线正前方；呼叫电梯后老板会切入最终大厅。',
      },
    },
  },

  navigation: {
    nodes: [
      // Start pod.
      { id: 'P', position: [-7.35, 0, 6.65] },
      { id: 'PL', position: [-8.8, 0, 6.55] },
      { id: 'PR', position: [-5.9, 0, 6.55] },
      { id: 'S1L', position: [-8.45, 0, 4.85] },
      { id: 'S1R', position: [-5.35, 0, 4.85] },
      { id: 'S1', position: [-4.1, 0, 4.8] },

      // First loop around service core.
      { id: 'W1', position: [-5.8, 0, 3.3] },
      { id: 'W2', position: [-5.8, 0, 1.15] },
      { id: 'W3', position: [-5.2, 0, -0.85] },
      { id: 'W4', position: [-2.7, 0, -1.45] },

      { id: 'E0', position: [-2.4, 0, 4.9] },
      { id: 'E1', position: [2.4, 0, 4.9] },
      { id: 'E2', position: [4.3, 0, 3.2] },
      { id: 'E3', position: [4.35, 0, 1.0] },
      { id: 'E4', position: [3.1, 0, -1.35] },

      { id: 'PRINT', position: [-8.7, 0, 2.2] },
      { id: 'TEA', position: [8.25, 0, 2.55] },

      { id: 'S2W', position: [-1.55, 0, -1.45] },
      { id: 'S2', position: [0, 0, -1.45] },
      { id: 'S2E', position: [1.55, 0, -1.45] },

      // Second loop around executive rooms.
      { id: 'BW0', position: [-2.7, 0, -2.35] },
      { id: 'BW1', position: [-7.4, 0, -2.35] },
      { id: 'BW2', position: [-7.45, 0, -5.65] },
      { id: 'BW3', position: [-3.25, 0, -5.85] },

      { id: 'BD', position: [-4.75, 0, -2.35] },
      { id: 'BI', position: [-4.75, 0, -3.55] },

      { id: 'C0', position: [-1.25, 0, -2.35] },
      { id: 'C1', position: [-1.25, 0, -4.1] },
      { id: 'C2', position: [-1.25, 0, -5.75] },

      { id: 'ME0', position: [2.9, 0, -2.1] },
      { id: 'ME1', position: [5.0, 0, -2.35] },
      { id: 'ME2', position: [5.25, 0, -4.35] },
      { id: 'ME3', position: [5.05, 0, -5.65] },

      { id: 'MD', position: [1.9, 0, -2.25] },
      { id: 'MI', position: [1.9, 0, -3.45] },

      { id: 'BACK0', position: [-1.25, 0, -5.75] },
      { id: 'BACK1', position: [2.0, 0, -5.75] },
      { id: 'S3', position: [5.05, 0, -5.65] },

      // Final lobby bends right toward the elevator.
      { id: 'L1', position: [6.35, 0, -5.95] },
      { id: 'L2', position: [7.25, 0, -6.45] },
      { id: 'EV', position: [7.25, 0, -7.15] },
    ],

    edges: [
      // Start: two exits from the personal workstation.
      ['P', 'PL'],
      ['PL', 'S1L'],
      ['S1L', 'S1'],

      ['P', 'PR'],
      ['PR', 'S1R'],
      ['S1R', 'S1'],

      // First loop west.
      ['S1', 'W1'],
      ['W1', 'W2'],
      ['W2', 'W3'],
      ['W3', 'W4'],
      ['W4', 'S2W'],
      ['S2W', 'S2'],

      // Printing branch gives the team lead an office-shaped loop.
      ['W1', 'PRINT'],
      ['PRINT', 'W2'],

      // First loop east. It crosses below the service core, then wraps its east side.
      ['S1', 'E0'],
      ['E0', 'E1'],
      ['E1', 'E2'],
      ['E2', 'E3'],
      ['E3', 'E4'],
      ['E4', 'S2E'],
      ['S2E', 'S2'],

      ['E2', 'TEA'],
      ['TEA', 'E3'],

      // Short exposed cross-cut between the two sides, north of the service core.
      ['W1', 'E0'],

      // Second loop west, around the boss office.
      ['S2', 'S2W'],
      ['S2W', 'BW0'],
      ['BW0', 'BW1'],
      ['BW1', 'BW2'],
      ['BW2', 'BW3'],
      ['BW3', 'BACK0'],

      ['BW0', 'BD'],
      ['BD', 'BI'],

      // Second loop center, between boss office and meeting room.
      ['S2', 'C0'],
      ['C0', 'C1'],
      ['C1', 'C2'],
      ['C2', 'BACK0'],

      // Second loop east, around meeting room / tea side.
      ['S2', 'S2E'],
      ['S2E', 'ME0'],
      ['ME0', 'ME1'],
      ['ME1', 'ME2'],
      ['ME2', 'ME3'],

      ['ME0', 'MD'],
      ['MD', 'MI'],

      // Recombine behind the rooms.
      ['BACK0', 'BACK1'],
      ['BACK1', 'S3'],
      ['ME3', 'S3'],

      // Final lobby.
      ['S3', 'L1'],
      ['L1', 'L2'],
      ['L2', 'EV'],
    ],
  },

  routeDesign: {
    firstRing: {
      west: '格子间与打印区。低遮挡多、路径更长，组长覆盖频繁。',
      crosscut: '从 S1 沿服务核心南侧横切，最短，但容易进入两名领导的交叉视线。',
      east: '协作区与茶水区。空间更开，经理的停留与转身决定窗口。',
    },
    secondRing: {
      west: '绕老板办公室外墙，距离最长但硬遮挡多；老板出门时风险骤升。',
      center: '老板办公室和会议室之间的窄长通道，最短也最暴露。',
      east: '绕玻璃会议室与茶水侧，路线长但能利用拐角切断追逐。',
    },
  },

  events: {
    extractionCall: {
      npcId: 'boss',
      routine: [
        {
          position: [-4.75, 0, -2.35],
          action: 'walk',
          duration: 0,
        },
        {
          position: [-1.25, 0, -4.1],
          action: 'inspect',
          duration: 1.2,
          facing: [1, 0, 0],
        },
        {
          position: [5.05, 0, -5.65],
          action: 'check',
          duration: 1.4,
          facing: [1, 0, -1],
        },
        {
          position: [7.25, 0, -6.45],
          action: 'inspect',
          duration: 2.8,
          facing: [0, 0, -1],
        },
        {
          position: [-4.75, 0, -2.35],
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
          position: [-8.7, 0, 2.2],
          action: 'print',
          duration: 1.8,
          facing: [-1, 0, 0],
        },
        {
          position: [-5.8, 0, 3.3],
          action: 'read',
          duration: 1.5,
          facing: [1, 0, 0],
        },
        {
          position: [-4.1, 0, 4.8],
          action: 'inspect',
          duration: 4.0,
          facing: [-1, 0, 1],
        },
        {
          position: [-5.8, 0, 1.15],
          action: 'check',
          duration: 2.0,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, -1.45],
          action: 'inspect',
          duration: 2.0,
          facing: [-1, 0, 1],
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
          position: [4.3, 0, 3.2],
          action: 'check',
          duration: 1.5,
          facing: [-1, 0, 0],
        },
        {
          position: [0, 0, -1.45],
          action: 'inspect',
          duration: 4.8,
          facing: [0, 0, 1],
        },
        {
          position: [8.25, 0, 2.55],
          action: 'tea',
          duration: 3.2,
          facing: [1, 0, 0],
        },
        {
          position: [1.9, 0, -3.45],
          action: 'meeting',
          duration: 4.3,
          facing: [0, 0, -1],
        },
        {
          position: [-1.25, 0, -4.1],
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
          position: [-4.75, 0, -3.55],
          action: 'read',
          duration: 8.2,
          facing: [0, 0, -1],
        },
        {
          position: [-4.75, 0, -2.35],
          action: 'inspect',
          duration: 1.5,
          facing: [1, 0, 0],
        },
        {
          position: [-1.25, 0, -4.1],
          action: 'check',
          duration: 2.0,
          facing: [1, 0, 0],
        },
        {
          position: [5.05, 0, -5.65],
          action: 'inspect',
          duration: 2.0,
          facing: [1, 0, -1],
        },
        {
          position: [-4.75, 0, -2.35],
          action: 'walk',
          duration: 0,
        },
      ],
    },
  ],
};
