import * as THREE from 'three';

const mat = (color, roughness = 0.85) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
  });

export class OfficeBuilder {
  constructor(scene, collision, data) {
    this.scene = scene;
    this.collision = collision;
    this.data = data;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.materials = {
      floor: mat(0x76746c, 0.96),
      carpet: mat(0x646c69, 0.97),
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
      routeWest: mat(0x6f746d, 1),
      routeCenter: mat(0x77756d, 1),
      routeEast: mat(0x6b7474, 1),
    };
  }

  build() {
    this.addLights();
    this.addFloor();
    this.addBoundaryWalls();

    this.addPlayerStation();

    this.addWestCubicleRoute();
    this.addCentralRoute();
    this.addEastMeetingRoute();

    this.addBossOffice();
    this.addExtraction();
    this.addAmbientDetails();

    return this.group;
  }

  addLights() {
    this.scene.add(
      new THREE.HemisphereLight(
        0xf0eadc,
        0x4b5150,
        1.45,
      ),
    );

    const sun = new THREE.DirectionalLight(
      0xffc58f,
      1.9,
    );
    sun.position.set(-9, 13, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    this.scene.add(sun);

    const office = new THREE.DirectionalLight(
      0xdce8e7,
      1.25,
    );
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
        movement:
          collider.movement ?? true,
        sight:
          collider.sight ?? true,
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

    // Subtle zoning makes the three routes readable without UI arrows.
    this.box(
      'WestCarpet',
      [6.4, 0.018, 12.7],
      [-6.2, 0.002, 0.2],
      this.materials.routeWest,
      { cast: false },
    );
    this.box(
      'CenterCarpet',
      [2.7, 0.02, 13.4],
      [0, 0.004, -0.1],
      this.materials.routeCenter,
      { cast: false },
    );
    this.box(
      'EastCarpet',
      [6.4, 0.019, 12.7],
      [6.2, 0.003, 0.2],
      this.materials.routeEast,
      { cast: false },
    );
  }

  addBoundaryWalls() {
    this.box(
      'WallNorth',
      [21, 2.8, 0.22],
      [0, 1.4, -8.15],
      this.materials.wall,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'WallWest',
      [0.22, 2.8, 16.3],
      [-10.15, 1.4, 0],
      this.materials.wall,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'WallEast',
      [0.22, 2.8, 16.3],
      [10.15, 1.4, 0],
      this.materials.wall,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'WindowWall',
      [20.3, 2.55, 0.1],
      [0, 1.3, 8.08],
      this.materials.glass,
      {
        cast: false,
        collider: {
          movement: true,
          sight: false,
        },
      },
    );
  }

  addPlayerStation() {
    this.addDesk(
      'PlayerDesk',
      0,
      5.45,
      2.15,
      1.05,
      1.08,
    );

    this.box(
      'PlayerChair',
      [0.52, 0.48, 0.52],
      [0, 0.27, 6.15],
      this.materials.dark,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );
  }

  addDesk(
    name,
    x,
    z,
    width = 2.55,
    depth = 1.18,
    partitionHeight = 1.08,
  ) {
    this.box(
      name,
      [width, 0.72, depth],
      [x, 0.38, z],
      this.materials.desk,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      `${name}Partition`,
      [width + 0.08, partitionHeight, 0.09],
      [x, partitionHeight * 0.5, z - depth * 0.48],
      this.materials.partition,
      {
        collider: {
          movement: false,
          sight: true,
        },
      },
    );

    this.box(
      `${name}Monitor`,
      [0.72, 0.46, 0.08],
      [x, 1.1, z - 0.18],
      this.materials.screen,
      {
        collider: {
          movement: false,
          sight: true,
        },
      },
    );
  }

  addWestCubicleRoute() {
    // A deliberately staggered chain of low cover.
    // Standing exposes the player's head; crouching lets the player
    // move from one pocket to the next.
    this.addDesk(
      'WestDeskA',
      -3.75,
      4.15,
      2.65,
      1.2,
      1.12,
    );

    this.addDesk(
      'WestDeskB',
      -7.0,
      2.35,
      2.7,
      1.2,
      1.12,
    );

    this.addDesk(
      'WestDeskC',
      -4.4,
      0.25,
      2.65,
      1.2,
      1.12,
    );

    this.addDesk(
      'WestDeskD',
      -7.0,
      -1.7,
      2.7,
      1.2,
      1.12,
    );

    this.addDesk(
      'WestDeskE',
      -4.3,
      -3.55,
      2.55,
      1.2,
      1.12,
    );

    this.box(
      'WestHighCabinet',
      [1.15, 1.75, 2.0],
      [-8.75, 0.88, -3.75],
      this.materials.cabinet,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'WestPrinter',
      [0.92, 0.96, 0.72],
      [-9.1, 0.5, 5.65],
      this.materials.wall,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );
  }

  addCentralRoute() {
    // Fastest line from the player desk to the elevator.
    // Cover exists only as short emergency pockets.
    this.box(
      'CenterLowIslandSouth',
      [1.5, 0.84, 0.68],
      [1.65, 0.43, 2.15],
      this.materials.desk,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'CenterLowIslandNorth',
      [1.6, 0.84, 0.68],
      [-1.65, 0.43, -1.15],
      this.materials.desk,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'CenterPlanter',
      [0.8, 1.28, 0.8],
      [1.85, 0.64, -4.55],
      this.materials.plant,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );
  }

  addEastMeetingRoute() {
    this.addDesk(
      'EastDeskA',
      4.25,
      4.0,
      2.45,
      1.15,
      1.02,
    );

    this.addDesk(
      'EastDeskB',
      7.15,
      3.95,
      2.45,
      1.15,
      1.02,
    );

    this.box(
      'TeaCounter',
      [2.15, 0.98, 0.72],
      [8.75, 0.5, 2.1],
      this.materials.desk,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'WaterCooler',
      [0.55, 1.35, 0.55],
      [9.2, 0.69, 1.15],
      this.materials.wall,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.addGlassRoom(
      'MeetingRoom',
      6.75,
      -4.85,
      4.25,
      3.45,
      'south',
    );

    this.box(
      'MeetingTable',
      [2.35, 0.72, 1.05],
      [6.75, 0.38, -4.85],
      this.materials.desk,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'EastPrivacyCabinet',
      [0.78, 1.85, 2.15],
      [3.85, 0.93, -1.65],
      this.materials.cabinet,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );
  }

  addBossOffice() {
    this.addGlassRoom(
      'BossRoom',
      -6.65,
      -5.05,
      4.2,
      3.4,
      'south',
    );

    this.box(
      'BossDesk',
      [2.1, 0.72, 0.82],
      [-6.65, 0.38, -5.35],
      this.materials.desk,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'BossChair',
      [0.62, 0.58, 0.62],
      [-6.65, 0.3, -4.35],
      this.materials.dark,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );

    this.box(
      'BossBookshelf',
      [0.55, 2.0, 1.7],
      [-8.45, 1.0, -5.4],
      this.materials.cabinet,
      {
        collider: {
          movement: true,
          sight: true,
        },
      },
    );
  }

  addGlassRoom(
    prefix,
    centerX,
    centerZ,
    width,
    depth,
  ) {
    const height = 2.35;
    const y = height * 0.5;
    const thickness = 0.08;

    const doorWidth = 1.15;
    const segment =
      (width - doorWidth) * 0.5;

    const frontZ =
      centerZ + depth * 0.5;
    const backZ =
      centerZ - depth * 0.5;

    const glassCollider = {
      movement: true,
      sight: false,
    };

    this.box(
      `${prefix}Left`,
      [thickness, height, depth],
      [
        centerX - width * 0.5,
        y,
        centerZ,
      ],
      this.materials.glass,
      { collider: glassCollider },
    );

    this.box(
      `${prefix}Right`,
      [thickness, height, depth],
      [
        centerX + width * 0.5,
        y,
        centerZ,
      ],
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

    const offset =
      doorWidth * 0.5 + segment * 0.5;

    this.box(
      `${prefix}FrontA`,
      [segment, height, thickness],
      [
        centerX - offset,
        y,
        frontZ,
      ],
      this.materials.glass,
      { collider: glassCollider },
    );

    this.box(
      `${prefix}FrontB`,
      [segment, height, thickness],
      [
        centerX + offset,
        y,
        frontZ,
      ],
      this.materials.glass,
      { collider: glassCollider },
    );
  }

  addExtraction() {
    const [x, , z] =
      this.data.extraction.position;

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

    this.extractionGlow =
      new THREE.Mesh(
        new THREE.RingGeometry(
          0.68,
          0.78,
          36,
        ),
        new THREE.MeshBasicMaterial({
          color: 0xf1b666,
          transparent: true,
          opacity: 0.48,
          side: THREE.DoubleSide,
        }),
      );

    this.extractionGlow.rotation.x =
      -Math.PI / 2;

    this.extractionGlow.position.set(
      x,
      0.02,
      z,
    );

    this.group.add(
      this.extractionGlow,
    );
  }

  setExtractionState(
    state,
    progress = 0,
  ) {
    if (!this.extractionGlow) {
      return;
    }

    const ready =
      state === 'ready';

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
          ? Math.max(
              0,
              (progress - 0.82) /
                0.18,
            )
          : 0;

    if (
      this.elevatorLeftDoor &&
      this.elevatorRightDoor
    ) {
      this.elevatorLeftDoor.position.x =
        this.elevatorDoorBaseX -
        0.62 -
        open * 0.9;

      this.elevatorRightDoor.position.x =
        this.elevatorDoorBaseX +
        0.62 +
        open * 0.9;
    }
  }

  addAmbientDetails() {
    this.box(
      'CultureWall',
      [4.0, 1.2, 0.06],
      [0, 1.6, -8.0],
      this.materials.warm,
      { cast: false },
    );

    const plantPositions = [
      [-9.0, 6.8],
      [9.0, 6.6],
      [2.9, -6.3],
    ];

    for (const [x, z] of plantPositions) {
      const pot = this.box(
        'PlantPot',
        [0.46, 0.42, 0.46],
        [x, 0.22, z],
        this.materials.dark,
        {
          collider: {
            movement: true,
            sight: true,
          },
        },
      );

      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(
          0.58,
          1.15,
          7,
        ),
        this.materials.plant,
      );

      crown.position.set(
        pot.position.x,
        0.94,
        pot.position.z,
      );
      crown.castShadow = true;
      this.group.add(crown);
    }
  }
}
