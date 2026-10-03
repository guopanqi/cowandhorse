import * as THREE from 'three';

const mat = (color, roughness = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness });

export class OfficeBuilder {
  constructor(scene, collision, data) {
    this.scene = scene;
    this.collision = collision;
    this.data = data;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.materials = {
      floor: mat(0x77736a, 0.96),
      carpet: mat(0x6d716b, 1),
      executiveFloor: mat(0x666d6b, 1),
      wall: mat(0xd7cfc1, 0.9),
      core: mat(0x4e5654, 0.94),
      dark: mat(0x303433, 0.9),
      desk: mat(0xa88e6c, 0.9),
      partition: mat(0x87928e, 0.95),
      cabinet: mat(0x505a58, 0.92),
      printer: mat(0xc9c7bd, 0.88),
      plant: mat(0x647358, 1),
      elevator: mat(0xb8aaa0, 0.55),

      glass: new THREE.MeshStandardMaterial({
        color: 0xa9c5c6,
        transparent: true,
        opacity: 0.17,
        roughness: 0.25,
        depthWrite: false,
      }),

      screen: new THREE.MeshStandardMaterial({
        color: 0x88a9ad,
        emissive: 0x243a3d,
        emissiveIntensity: 1.3,
      }),

      warm: new THREE.MeshStandardMaterial({
        color: 0xe19b5c,
        emissive: 0x743114,
        emissiveIntensity: 0.55,
      }),
    };
  }

  build() {
    this.addLights();
    this.addFloor();
    this.addBoundaryWalls();

    this.addStartPod();
    this.addServiceCore();
    this.addTeamArea();
    this.addCollaborationArea();

    this.addExecutiveRooms();
    this.addBackHall();
    this.addFinalLobby();

    this.addExtraction();
    this.addAmbientDetails();

    return this.group;
  }

  addLights() {
    this.scene.add(
      new THREE.HemisphereLight(0xf0eadc, 0x4b5150, 1.45),
    );

    const sun = new THREE.DirectionalLight(0xffc58f, 1.9);
    sun.position.set(-9, 13, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    this.scene.add(sun);

    const office = new THREE.DirectionalLight(0xdce8e7, 1.25);
    office.position.set(7, 11, -5);
    this.scene.add(office);
  }

  box(
    name,
    size,
    position,
    material,
    {
      cast = true,
      receive = true,
      collider = null,
    } = {},
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      material,
    );

    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    this.group.add(mesh);

    if (collider) {
      this.collision.addBox({
        center: position,
        size,
        movement: collider.movement ?? true,
        sight: collider.sight ?? true,
        label: name,
      });
    }

    return mesh;
  }

  addFloor() {
    this.box(
      'Floor',
      [21, 0.16, 17],
      [0, -0.1, 0],
      this.materials.floor,
      { cast: false },
    );

    this.box(
      'TeamCarpet',
      [10.2, 0.015, 11.3],
      [-4.4, 0.001, 1.7],
      this.materials.carpet,
      { cast: false },
    );

    this.box(
      'ExecutiveCarpet',
      [12.0, 0.016, 6.8],
      [0.8, 0.002, -4.5],
      this.materials.executiveFloor,
      { cast: false },
    );
  }

  addBoundaryWalls() {
    this.box(
      'WallNorth',
      [21, 2.8, 0.22],
      [0, 1.4, -8.15],
      this.materials.wall,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'WallWest',
      [0.22, 2.8, 16.3],
      [-10.15, 1.4, 0],
      this.materials.wall,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'WallEast',
      [0.22, 2.8, 16.3],
      [10.15, 1.4, 0],
      this.materials.wall,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'WindowWall',
      [20.3, 2.55, 0.1],
      [0, 1.3, 8.08],
      this.materials.glass,
      {
        cast: false,
        collider: { movement: true, sight: false },
      },
    );
  }

  addDesk(
    name,
    x,
    z,
    width = 2.2,
    depth = 1.0,
    partitionHeight = 1.08,
  ) {
    this.box(
      name,
      [width, 0.72, depth],
      [x, 0.38, z],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      `${name}Partition`,
      [width + 0.06, partitionHeight, 0.08],
      [x, partitionHeight * 0.5, z - depth * 0.47],
      this.materials.partition,
      { collider: { movement: false, sight: true } },
    );

    this.box(
      `${name}Monitor`,
      [0.66, 0.44, 0.07],
      [x, 1.08, z - 0.14],
      this.materials.screen,
      { collider: { movement: false, sight: true } },
    );

    this.box(
      `${name}Chair`,
      [0.48, 0.5, 0.48],
      [x, 0.27, z + depth * 0.72],
      this.materials.dark,
      { collider: null },
    );
  }

  addTallCover(name, x, z, width = 1.0, depth = 0.8) {
    this.box(
      name,
      [width, 1.9, depth],
      [x, 0.95, z],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );
  }

  addStartPod() {
    // Player starts in the lower-left corner rather than on the global centerline.
    this.addDesk('PlayerDesk', -7.35, 5.72, 2.45, 0.95, 1.12);

    this.addDesk('StartNeighbor', -3.8, 6.1, 2.2, 0.95, 1.02);

    this.addTallCover('StartFiles', -4.8, 3.7, 0.9, 1.2);

    this.box(
      'WestPrinter',
      [0.78, 0.95, 0.7],
      [-9.2, 0.5, 2.2],
      this.materials.printer,
      { collider: { movement: true, sight: true } },
    );
  }

  addServiceCore() {
    // This opaque room is the dominant landmark. It destroys the old
    // full-map sightline and creates the first genuine navigation loop.
    this.box(
      'ServiceCore',
      [3.2, 2.55, 5.15],
      [0, 1.28, 1.8],
      this.materials.core,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'CoreSign',
      [1.7, 0.5, 0.06],
      [-1.61, 1.7, 2.4],
      this.materials.warm,
      { cast: false },
    );

    // The core itself is the S2 landmark. Keep its north edge open enough
    // for both loops to recombine without turning cover into a choke point.
  }

  addTeamArea() {
    // West side: denser, lower cover and stronger cubicle identity.
    this.addDesk('TeamW1', -7.55, 3.95, 2.25, 0.95, 1.12);
    this.addDesk('TeamW2', -4.35, 2.6, 2.2, 0.95, 1.12);
    this.addDesk('TeamW3', -7.5, 0.45, 2.25, 0.95, 1.12);
    this.addDesk('TeamW4', -4.35, -0.35, 2.2, 0.95, 1.12);

    this.addTallCover('WestArchive', -8.65, -0.65, 0.8, 1.5);
  }

  addCollaborationArea() {
    // East side: open and readable from distance, deliberately less opaque.
    this.addDesk('CollabA', 4.6, 4.1, 2.3, 1.0, 1.02);
    this.addDesk('CollabB', 7.15, 1.0, 2.3, 1.0, 1.02);

    this.box(
      'TeaCounter',
      [1.8, 0.98, 0.72],
      [8.7, 0.5, 3.1],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'WaterCooler',
      [0.52, 1.32, 0.52],
      [8.8, 0.67, 1.95],
      this.materials.printer,
      { collider: { movement: true, sight: true } },
    );

    this.addTallCover('EastSoftBreak', 3.25, 0.0, 0.75, 1.4);
  }

  addExecutiveRooms() {
    this.addGlassRoom('BossRoom', -4.75, -4.0, 4.05, 3.2);
    this.addGlassRoom('MeetingRoom', 1.9, -3.9, 3.45, 3.0);

    this.box(
      'BossDesk',
      [1.9, 0.72, 0.8],
      [-4.75, 0.38, -4.25],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'BossBookshelf',
      [0.5, 2.0, 1.45],
      [-6.45, 1.0, -4.35],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'MeetingTable',
      [1.8, 0.72, 0.9],
      [1.9, 0.38, -4.0],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.addTallCover('EastExecutiveFiles', 5.7, -3.1, 0.8, 1.5);
  }

  addGlassRoom(prefix, centerX, centerZ, width, depth) {
    const height = 2.35;
    const y = height * 0.5;
    const thickness = 0.08;
    const doorWidth = 1.4;
    const segment = (width - doorWidth) * 0.5;

    const frontZ = centerZ + depth * 0.5;
    const backZ = centerZ - depth * 0.5;
    const glassCollider = { movement: true, sight: false };

    this.box(
      `${prefix}Left`,
      [thickness, height, depth],
      [centerX - width * 0.5, y, centerZ],
      this.materials.glass,
      { collider: glassCollider },
    );

    this.box(
      `${prefix}Right`,
      [thickness, height, depth],
      [centerX + width * 0.5, y, centerZ],
      this.materials.glass,
      { collider: glassCollider },
    );

    this.box(
      `${prefix}Back`,
      [width, height, thickness],
      [centerX, y, backZ],
      this.materials.glass,
      { collider: glassCollider },
    );

    const offset = doorWidth * 0.5 + segment * 0.5;

    this.box(
      `${prefix}FrontA`,
      [segment, height, thickness],
      [centerX - offset, y, frontZ],
      this.materials.glass,
      { collider: glassCollider },
    );

    this.box(
      `${prefix}FrontB`,
      [segment, height, thickness],
      [centerX + offset, y, frontZ],
      this.materials.glass,
      { collider: glassCollider },
    );
  }

  addBackHall() {
    // Hard cover hides the elevator approach until the executive ring is completed.
    this.addTallCover('BackHallFiles', 3.45, -5.05, 0.9, 1.15);

  }

  addFinalLobby() {
    this.box(
      'LobbyPlant',
      [0.72, 1.4, 0.72],
      [7.95, 0.71, -5.35],
      this.materials.plant,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'LobbyReception',
      [1.45, 0.92, 0.7],
      [6.15, 0.47, -4.8],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );
  }

  addExtraction() {
    const [x, , z] = this.data.extraction.position;

    this.box(
      'ElevatorFrame',
      [3.0, 2.7, 0.24],
      [x, 1.35, -8.0],
      this.materials.dark,
    );

    this.elevatorLeftDoor = this.box(
      'ElevatorDoorLeft',
      [1.05, 2.35, 0.08],
      [x - 0.54, 1.18, -7.86],
      this.materials.elevator,
    );

    this.elevatorRightDoor = this.box(
      'ElevatorDoorRight',
      [1.05, 2.35, 0.08],
      [x + 0.54, 1.18, -7.86],
      this.materials.elevator,
    );

    this.elevatorDoorBaseX = x;

    this.extractionGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.76, 36),
      new THREE.MeshBasicMaterial({
        color: 0xf1b666,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
      }),
    );

    this.extractionGlow.rotation.x = -Math.PI / 2;
    this.extractionGlow.position.set(x, 0.02, z);
    this.group.add(this.extractionGlow);
  }

  setExtractionState(state, progress = 0) {
    if (!this.extractionGlow) return;

    const ready = state === 'ready';

    this.extractionGlow.material.color.setHex(
      ready
        ? 0x77c995
        : state === 'calling'
          ? 0xf4c56d
          : 0xf1b666,
    );

    this.extractionGlow.material.opacity =
      state === 'calling'
        ? 0.48 + progress * 0.42
        : ready
          ? 0.92
          : 0.48;

    const open =
      ready
        ? 1
        : state === 'calling'
          ? Math.max(0, (progress - 0.82) / 0.18)
          : 0;

    this.elevatorLeftDoor.position.x =
      this.elevatorDoorBaseX - 0.54 - open * 0.82;

    this.elevatorRightDoor.position.x =
      this.elevatorDoorBaseX + 0.54 + open * 0.82;
  }

  addAmbientDetails() {
    this.box(
      'CultureWall',
      [3.6, 1.05, 0.06],
      [7.25, 1.55, -8.0],
      this.materials.warm,
      { cast: false },
    );
  }
}
