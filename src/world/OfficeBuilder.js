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
      floor: mat(0x76746c, 0.96),
      wall: mat(0xd8d1c4, 0.9),
      dark: mat(0x343736, 0.9),
      desk: mat(0xa38d70, 0.9),
      partition: mat(0x87918e, 0.95),
      cabinet: mat(0x5f6867, 0.92),
      glass: new THREE.MeshStandardMaterial({
        color: 0xaac6c9,
        transparent: true,
        opacity: 0.18,
        roughness: 0.25,
        depthWrite: false,
      }),
      screen: new THREE.MeshStandardMaterial({
        color: 0x88a9ad,
        emissive: 0x243a3d,
        emissiveIntensity: 1.3,
      }),
      plant: mat(0x65745a, 1),
      elevator: mat(0xb8aaa0, 0.55),
      warm: new THREE.MeshStandardMaterial({
        color: 0xe3a066,
        emissive: 0x7a3518,
        emissiveIntensity: 0.6,
      }),
      center: mat(0x77756d, 1),
      west: mat(0x6f746d, 1),
      east: mat(0x6b7474, 1),
    };
  }

  build() {
    this.addLights();
    this.addFloor();
    this.addBoundaryWalls();
    this.addPlayerStation();

    this.addWestZone();
    this.addCenterZone();
    this.addEastZone();
    this.addBossOffice();

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
    office.position.set(6, 10, -5);
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
      'CenterAisle',
      [2.5, 0.02, 14.3],
      [0, 0.002, -0.1],
      this.materials.center,
      { cast: false },
    );

    this.box(
      'WestAisle',
      [6.0, 0.018, 13.8],
      [-5.5, 0.003, 0],
      this.materials.west,
      { cast: false },
    );

    this.box(
      'EastAisle',
      [6.0, 0.019, 13.8],
      [5.5, 0.004, 0],
      this.materials.east,
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

  addPlayerStation() {
    this.addDesk('PlayerDesk', 0, 7.05, 2.1, 0.9, 1.05);
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

    // Chairs stay visual-only. They should not collapse the walkable
    // corridor width in this small level.
    this.box(
      `${name}Chair`,
      [0.48, 0.5, 0.48],
      [x, 0.27, z + depth * 0.72],
      this.materials.dark,
      { collider: null },
    );
  }

  addWestZone() {
    // Furniture is staggered, but every navigable gap is at least ~1.3m.
    this.addDesk('WestA', -6.65, 4.55, 2.25, 1.0, 1.12);
    this.addDesk('WestB', -4.15, 2.15, 2.15, 1.0, 1.12);
    this.addDesk('WestC', -7.0, 0.05, 2.2, 1.0, 1.12);
    this.addDesk('WestD', -4.15, -2.2, 2.15, 1.0, 1.12);
    this.addDesk('WestE', -6.7, -4.1, 2.2, 1.0, 1.12);

    this.box(
      'WestPrinter',
      [0.9, 0.95, 0.68],
      [-9.1, 0.5, 5.65],
      this.materials.wall,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'WestSafeCabinet',
      [0.82, 1.9, 1.7],
      [-3.55, 0.95, -4.65],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );
  }

  addCenterZone() {
    // The central aisle remains physically open. Its danger comes from
    // crossing patrols, not invisible collision.
    this.box(
      'CenterCoverSouth',
      [0.85, 1.25, 0.85],
      [1.7, 0.63, 3.85],
      this.materials.plant,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'CenterCoverMid',
      [0.9, 1.65, 0.9],
      [-1.75, 0.83, -0.2],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'CenterCoverNorth',
      [0.9, 1.35, 0.9],
      [1.75, 0.68, -4.6],
      this.materials.plant,
      { collider: { movement: true, sight: true } },
    );
  }

  addEastZone() {
    this.addDesk('EastA', 4.2, 4.2, 2.15, 1.0, 1.04);
    this.addDesk('EastB', 7.0, 2.35, 2.2, 1.0, 1.04);

    this.box(
      'TeaCounter',
      [1.9, 0.96, 0.66],
      [8.7, 0.49, 5.15],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'WaterCooler',
      [0.52, 1.32, 0.52],
      [9.15, 0.67, 3.85],
      this.materials.wall,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'EastPrivacyCabinet',
      [0.8, 1.9, 1.8],
      [3.85, 0.95, -1.95],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );

    this.addGlassRoom('MeetingRoom', 6.55, -4.65, 4.0, 3.25);

    this.box(
      'MeetingTable',
      [2.2, 0.72, 0.95],
      [6.55, 0.38, -4.65],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );
  }

  addBossOffice() {
    this.addGlassRoom('BossRoom', -6.55, -4.85, 4.0, 3.25);

    this.box(
      'BossDesk',
      [2.0, 0.72, 0.8],
      [-6.55, 0.38, -5.05],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'BossBookshelf',
      [0.5, 2.0, 1.5],
      [-8.35, 1.0, -5.2],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );
  }

  addGlassRoom(prefix, centerX, centerZ, width, depth) {
    const height = 2.35;
    const y = height * 0.5;
    const thickness = 0.08;
    const doorWidth = 1.35;
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

  addExtraction() {
    const [x, , z] = this.data.extraction.position;

    this.box(
      'ElevatorFrame',
      [3.4, 2.7, 0.24],
      [x, 1.35, -8.0],
      this.materials.dark,
    );

    this.elevatorLeftDoor = this.box(
      'ElevatorDoorLeft',
      [1.22, 2.35, 0.08],
      [x - 0.62, 1.18, -7.86],
      this.materials.elevator,
    );

    this.elevatorRightDoor = this.box(
      'ElevatorDoorRight',
      [1.22, 2.35, 0.08],
      [x + 0.62, 1.18, -7.86],
      this.materials.elevator,
    );

    this.elevatorDoorBaseX = x;

    this.extractionGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.78, 36),
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
      this.elevatorDoorBaseX - 0.62 - open * 0.9;

    this.elevatorRightDoor.position.x =
      this.elevatorDoorBaseX + 0.62 + open * 0.9;
  }

  addAmbientDetails() {
    this.box(
      'CultureWall',
      [4.0, 1.2, 0.06],
      [0, 1.6, -8.0],
      this.materials.warm,
      { cast: false },
    );
  }
}
