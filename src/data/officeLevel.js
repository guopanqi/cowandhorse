export const officeLevel = {
  bounds: { minX: -10.5, maxX: 10.5, minZ: -8.5, maxZ: 8.5 },
  playerSpawn: [0, 0, 6.4],
  extraction: { position: [0, 0, -7.6], radius: 1.15 },

  blockers: [
    [-10.5, -10.0, -8.5, 8.5],
    [10.0, 10.5, -8.5, 8.5],
    [-10.5, 10.5, -8.5, -8.0],
    [-10.5, 10.5, 8.0, 8.5],

    [-8.8, -4.7, -7.0, -3.7],
    [4.7, 8.8, -7.0, -3.7],

    [-8.7, -5.5, -1.1, 1.1],
    [-3.7, -0.5, -1.1, 1.1],
    [1.2, 4.4, -1.1, 1.1],
    [6.1, 9.0, -1.1, 1.1],

    [-8.7, -5.5, 3.0, 5.0],
    [-3.7, -0.5, 3.0, 5.0],
    [1.2, 4.4, 3.0, 5.0],
    [6.1, 9.0, 3.0, 5.0],

    [-2.1, 2.1, -5.8, -4.5]
  ],

  npcs: [
    {
      id: 'team-lead',
      role: '组长',
      danger: 1,
      penaltyMinutes: 10,
      energyCost: 8,
      speed: 1.65,
      visionDistance: 4.7,
      visionAngle: 62,
      patrol: [
        [-6.0, 0, 2.1], [-4.6, 0, -2.2], [-1.4, 0, -2.2], [-1.4, 0, 1.9]
      ]
    },
    {
      id: 'manager',
      role: '部门经理',
      danger: 2,
      penaltyMinutes: 30,
      energyCost: 18,
      speed: 1.45,
      visionDistance: 5.6,
      visionAngle: 72,
      patrol: [
        [6.8, 0, 2.0], [5.2, 0, -2.2], [2.0, 0, -2.2], [2.0, 0, 2.0]
      ]
    },
    {
      id: 'boss',
      role: '老板',
      danger: 3,
      penaltyMinutes: 120,
      energyCost: 30,
      speed: 1.2,
      visionDistance: 6.2,
      visionAngle: 78,
      activeAfterSeconds: 18,
      patrol: [
        [-6.8, 0, -5.2], [-2.5, 0, -3.1], [2.7, 0, -3.1], [6.8, 0, -5.2]
      ]
    }
  ]
};
