export const officeLevel = {
  bounds: { minX: -10.5, maxX: 10.5, minZ: -8.5, maxZ: 8.5 },

  playerSpawn: [0, 0, 6.72],
  prepZone: {
    center: [0, 0, 6.72],
    radius: 1.75,
  },

  extraction: {
    position: [0, 0, -7.55],
    radius: 1.1,
  },

  npcs: [
    {
      id: 'team-lead',
      role: '组长',
      danger: 1,
      penaltyMinutes: 10,
      energyCost: 8,
      minigame: 'logo-bigger',

      speed: 1.45,
      chaseSpeed: 2.8,
      chaseMemory: 2.8,
      visionDistance: 4.8,
      visionAngle: 62,

      routine: [
        {
          position: [-4.65, 0, 2.0],
          action: 'check',
          duration: 2.4,
          facing: [-1, 0, 0],
        },
        {
          position: [-9.1, 0, 2.0],
          action: 'walk',
          duration: 0,
        },
        {
          position: [-9.1, 0, 5.55],
          action: 'print',
          duration: 3.2,
          facing: [0, 0, 1],
        },
        {
          position: [-9.1, 0, 2.0],
          action: 'walk',
          duration: 0,
        },
        {
          position: [-7.1, 0, 1.08],
          action: 'sit',
          duration: 4.4,
          facing: [0, 0, -1],
          ignoreCollision: true,
        },
      ],
    },

    {
      id: 'manager',
      role: '部门经理',
      danger: 2,
      penaltyMinutes: 30,
      energyCost: 18,
      minigame: 'quick-sync',

      speed: 1.35,
      chaseSpeed: 2.65,
      chaseMemory: 3.2,
      visionDistance: 5.6,
      visionAngle: 70,

      routine: [
        {
          position: [5.15, 0, 2.0],
          action: 'inspect',
          duration: 2.8,
          facing: [-1, 0, 0],
        },
        {
          position: [9.15, 0, 2.0],
          action: 'walk',
          duration: 0,
        },
        {
          position: [9.15, 0, 5.75],
          action: 'check',
          duration: 3.0,
          facing: [0, 0, 1],
        },
        {
          position: [9.15, 0, 2.0],
          action: 'walk',
          duration: 0,
        },
        {
          position: [5.05, 0, -2.25],
          action: 'walk',
          duration: 0,
        },
        {
          position: [6.75, 0, -3.25],
          action: 'meeting',
          duration: 4.0,
          facing: [0, 0, -1],
        },
      ],
    },

    {
      id: 'boss',
      role: '老板',
      danger: 3,
      penaltyMinutes: 120,
      energyCost: 30,
      minigame: 'quick-sync',

      speed: 1.15,
      chaseSpeed: 2.45,
      chaseMemory: 3.8,
      visionDistance: 6.2,
      visionAngle: 76,

      routine: [
        {
          position: [-6.75, 0, -4.55],
          action: 'sit',
          duration: 9.0,
          facing: [0, 0, -1],
          ignoreCollision: true,
        },
        {
          position: [-6.75, 0, -3.2],
          action: 'inspect',
          duration: 2.8,
          facing: [0, 0, 1],
        },
        {
          position: [-4.0, 0, -2.8],
          action: 'check',
          duration: 3.4,
          facing: [1, 0, 0],
        },
        {
          position: [0, 0, -2.8],
          action: 'inspect',
          duration: 3.8,
          facing: [0, 0, 1],
        },
        {
          position: [-4.0, 0, -2.8],
          action: 'walk',
          duration: 0,
        },
        {
          position: [-6.75, 0, -3.2],
          action: 'walk',
          duration: 0,
        },
      ],
    },
  ],
};
