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
      zoneA: mat(0x77756d, 1),
      zoneB: mat(0x70746f, 1),
      zoneC: mat(0x6b7271, 1),

      wall: mat(0xd8d1c4, 0.9),
      dark: mat(0x343736, 0.9),
      desk: mat(0xa38d70, 0.9),
      partition: mat(0x87918e, 0.95),
      cabinet: mat(0x56615f, 0.92),
      printer: mat(0xc8c6bc, 0.88),

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
    };
  }

  build() {
    this.addLights();
    this.addFloor();
    this.addBoundaryWalls();

    this.addStartArea();
    this.addFirstRing();
    this.addSecondRing();
    this.addExecutiveRooms();
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
      'StartZoneFloor',
      [18.5, 0.015, 4.0],
      [0, 0.001, 5.6],
      this.materials.zoneA,
      { cast: false },
    );

    this.box(
      'TeamZoneFloor',
      [18.5, 0.016, 6.6],
      [0, 0.002, 0.6],
      this.materials.zoneB,
      { cast: false },
    );

    this.box(
      'ExecutiveZoneFloor',
      [18.5, 0.017, 5.7],
      [0, 0.003, -5.1],
      this.materials.zoneC,
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
    rotation = 0,
  ) {
    const desk = new THREE.Group();
    desk.position.set(x, 0, z);
    desk.rotation.y = rotation;
    this.group.add(desk);

    const addPart = (
      partName,
      size,
      local,
      material,
      {
        collider = null,
        cast = true,
      } = {},
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        material,
      );

      mesh.name = partName;
      mesh.position.set(...local);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      desk.add(mesh);

      if (collider) {
        mesh.updateMatrixWorld(true);

        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();

        mesh.matrixWorld.decompose(
          worldPosition,
          worldQuaternion,
          worldScale,
        );

        // Current whitebox desks remain axis-aligned in practice.
        // Keep the API rotation-ready while collision is box-based.
        this.collision.addBox({
          center: [worldPosition.x, worldPosition.y, worldPosition.z],
          size,
          movement: collider.movement ?? true,
          sight: collider.sight ?? true,
          label: partName,
        });
      }

      return mesh;
    };

    addPart(
      name,
      [width, 0.72, depth],
      [0, 0.38, 0],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    addPart(
      `${name}Partition`,
      [width + 0.06, partitionHeight, 0.08],
      [0, partitionHeight * 0.5, -depth * 0.47],
      this.materials.partition,
      { collider: { movement: false, sight: true } },
    );

    addPart(
      `${name}Monitor`,
      [0.66, 0.44, 0.07],
      [0, 1.08, -0.14],
      this.materials.screen,
      { collider: { movement: false, sight: true } },
    );

    addPart(
      `${name}Chair`,
      [0.48, 0.5, 0.48],
      [0, 0.27, depth * 0.72],
      this.materials.dark,
      { collider: null },
    );
  }

  addTallCover(name, x, z, width = 1.2, depth = 0.8) {
    this.box(
      name,
      [width, 1.82, depth],
      [x, 0.91, z],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );
  }

  addStartArea() {
    // Spawn is behind the desk. The player must leave around the left or
    // right edge, so the first ten seconds are naturally an observation beat.
    this.addDesk('PlayerDesk', 0, 5.72, 2.35, 0.95, 1.1);

    // S1: a real sight-line break. The next encounter is not visible all at once.
    this.addTallCover('S1Files', 0, 3.65, 1.15, 0.8);

    this.addDesk('StartCoworkerWest', -4.8, 5.55, 2.15, 0.95, 1.02);
    this.addDesk('StartCoworkerEast', 4.8, 5.55, 2.15, 0.95, 1.02);

    this.box(
      'WestPrinter',
      [0.72, 0.95, 0.68],
      [-9.25, 0.5, 5.85],
      this.materials.printer,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'TeaCounter',
      [1.65, 0.98, 0.7],
      [8.75, 0.5, 5.15],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'WaterCooler',
      [0.52, 1.32, 0.52],
      [9.15, 0.67, 3.85],
      this.materials.printer,
      { collider: { movement: true, sight: true } },
    );
  }

  addFirstRing() {
    // West arc: cover is frequent and low. Crouching matters.
    this.addDesk('WestA', -6.65, 4.55, 2.2, 1.0, 1.12);
    this.addDesk('WestB', -7.1, 2.0, 2.2, 1.0, 1.12);
    this.addDesk('WestC', -7.0, -0.35, 2.2, 1.0, 1.12);

    // One taller object creates a reliable chase break without sealing the route.
    this.addTallCover('WestTallFiles', -4.0, 0.95, 0.75, 1.45);

    // East arc: fewer opaque objects, so the route feels visually exposed.
    this.addDesk('EastA', 5.9, 4.45, 2.15, 1.0, 1.02);
    this.addDesk('EastB', 7.0, 2.05, 2.2, 1.0, 1.02);

    // S2: the ring recombines here, but another tall file bank hides the next stage.
    this.addTallCover('S2Files', 0, -0.95, 1.35, 0.82);

    // Offset side cover prevents the central shortcut from becoming one empty tunnel.
    this.box(
      'CenterLowWest',
      [1.15, 0.86, 0.7],
      [-1.9, 0.44, 1.65],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'CenterLowEast',
      [1.15, 0.86, 0.7],
      [1.9, 0.44, 0.75],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );
  }

  addSecondRing() {
    // The west side becomes more architectural near management.
    this.addTallCover('WestArchive', -3.0, -2.75, 0.82, 1.6);

    // The east side uses glass + one hard sight break.
    this.addTallCover('EastPrivacy', 3.15, -2.75, 0.82, 1.6);

    // S3: final observation island before the elevator lobby.
    // It deliberately blocks the straight line to the elevator, forcing a left/right reveal.
    this.addTallCover('S3Files', 0, -4.82, 1.75, 0.82);
  }

  addExecutiveRooms() {
    this.addGlassRoom('BossRoom', -6.55, -4.55, 4.05, 3.35);
    this.addGlassRoom('MeetingRoom', 6.55, -4.45, 4.05, 3.25);

    this.box(
      'BossDesk',
      [2.0, 0.72, 0.8],
      [-6.55, 0.38, -4.95],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'BossBookshelf',
      [0.5, 2.0, 1.45],
      [-8.35, 1.0, -4.95],
      this.materials.cabinet,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'MeetingTable',
      [2.1, 0.72, 0.9],
      [6.55, 0.38, -4.55],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
    );
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

  addFinalLobby() {
    // Sparse by design: this is a commitment space, not another cubicle maze.
    this.box(
      'LobbyPlantWest',
      [0.68, 1.35, 0.68],
      [-3.0, 0.68, -6.25],
      this.materials.plant,
      { collider: { movement: true, sight: true } },
    );

    this.box(
      'LobbyBenchEast',
      [1.5, 0.62, 0.6],
      [3.0, 0.32, -6.25],
      this.materials.desk,
      { collider: { movement: true, sight: true } },
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
