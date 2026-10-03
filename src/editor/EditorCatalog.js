export const ROUTINE_ACTIONS = [
  'walk',
  'idle',
  'inspect',
  'check',
  'sit',
  'print',
  'tea',
  'read',
  'meeting',
];

export const INTERACTION_TYPES = [
  'fakeWork',
  'hideSpot',
  'distraction',
];

export const PALETTE = [
  {
    title: '空间',
    items: [
      ['desk', '工位'],
      ['tallCover', '高柜'],
      ['wall', '实墙'],
      ['glassWall', '玻璃墙'],
      ['glassRoom', '玻璃房'],
      ['printer', '打印机'],
      ['counter', '柜台'],
      ['waterCooler', '饮水机'],
      ['plant', '盆栽'],
      ['bench', '长椅'],
    ],
  },
  {
    title: '玩法',
    items: [
      ['interaction:fakeWork', '假装工作'],
      ['interaction:hideSpot', '躲藏点'],
      ['interaction:distraction', '诱饵点'],
      ['nav', '导航点'],
      ['routine', 'NPC 行为点'],
    ],
  },
];

export function uniqueId(
  prefix,
  existing,
) {
  let index = 1;
  let id = `${prefix}-${index}`;

  while (existing.has(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }

  return id;
}

export function createEnvironmentObject(
  type,
  position,
  existingIds,
) {
  const id =
    uniqueId(type, existingIds);

  const base = {
    id,
    type,
    position: [
      position.x,
      0,
      position.z,
    ],
    rotation: 0,
  };

  switch (type) {
    case 'desk':
      base.params = {
        width: 2.2,
        depth: 1,
        partitionHeight: 1.08,
      };
      break;

    case 'tallCover':
      base.params = {
        width: 1.2,
        depth: 0.8,
        height: 1.82,
      };
      break;

    case 'wall':
      base.position[1] = 1.2;
      base.size = [3, 2.4, 0.16];
      break;

    case 'glassWall':
      base.position[1] = 1.2;
      base.size = [3, 2.4, 0.1];
      break;

    case 'glassRoom':
      base.params = {
        width: 4,
        depth: 3.2,
        doorWidth: 1.4,
      };
      break;

    case 'counter':
      base.params = {
        width: 1.65,
        depth: 0.7,
        height: 0.98,
      };
      break;

    case 'plant':
      base.params = {
        width: 0.68,
        height: 1.35,
      };
      break;

    case 'bench':
      base.params = {
        width: 1.5,
        height: 0.62,
        depth: 0.6,
      };
      break;

    default:
      break;
  }

  return base;
}
