import * as THREE from 'three';

const mat = (color, roughness = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness });

export class DataDrivenOfficeBuilder {
  constructor(scene, collision, data) {
    this.scene = scene;
    this.collision = collision;
    this.data = data;
    this.group = new THREE.Group();
    this.group.name = 'LevelEnvironment';
    this.scene.add(this.group);
    this.objectRoots = new Map();

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

    for (const object of this.data.environment ?? []) {
      this.createObject(object);
    }

    return this.group;
  }

  addLights() {
    const hemi = new THREE.HemisphereLight(
      0xf0eadc,
      0x4b5150,
      1.45,
    );
    this.group.add(hemi);

    const sun = new THREE.DirectionalLight(0xffc58f, 1.9);
    sun.position.set(-9, 13, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    this.group.add(sun);

    const office = new THREE.DirectionalLight(0xdce8e7, 1.25);
    office.position.set(6, 10, -5);
    this.group.add(office);
  }

  material(name = 'wall') {
    return this.materials[name] ?? this.materials.wall;
  }

  registerRoot(root, object) {
    root.name = object.name ?? object.id;
    root.userData.levelObjectId = object.id;
    root.userData.levelObjectType = object.type;
    root.userData.editorSelectable = object.editable !== false;
    this.objectRoots.set(object.id, root);
    return root;
  }

  createRoot(object) {
    const root = new THREE.Group();
    root.position.set(
      object.position?.[0] ?? 0,
      object.position?.[1] ?? 0,
      object.position?.[2] ?? 0,
    );
    root.rotation.y = object.rotation ?? 0;
    this.group.add(root);
    return root;
  }

  localToWorldXZ(localX, localZ, object) {
    const rotation = object.rotation ?? 0;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return [
      object.position[0] + localX * cos + localZ * sin,
      object.position[2] - localX * sin + localZ * cos,
    ];
  }

  addCollider(object, local, size, collision, label) {
    if (!collision) return;

    const [x, z] = this.localToWorldXZ(
      local[0],
      local[2],
      object,
    );

    this.collision.addBox({
      center: [
        x,
        (object.position?.[1] ?? 0) + local[1],
        z,
      ],
      size,
      rotation: object.rotation ?? 0,
      movement: collision.movement ?? true,
      sight: collision.sight ?? true,
      label,
    });
  }

  addPart(
    root,
    object,
    {
      name,
      size,
      local = [0, 0, 0],
      material = 'wall',
      collision = null,
      cast = true,
    },
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      this.material(material),
    );

    mesh.name = name;
    mesh.position.set(...local);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    mesh.userData.levelObjectId = object.id;
    root.add(mesh);

    this.addCollider(
      object,
      local,
      size,
      collision,
      name,
    );

    return mesh;
  }

  createSimpleBox(
    object,
    size,
    material,
    localCenterY = 0,
  ) {
    const root = this.createRoot(object);

    this.addPart(root, object, {
      name: object.id,
      size,
      local: [0, localCenterY, 0],
      material,
      collision:
        object.collision ??
        { movement: true, sight: true },
      cast: object.cast !== false,
    });

    return root;
  }

  createDesk(object) {
    const root = this.createRoot(object);
    const width = object.params?.width ?? 2.2;
    const depth = object.params?.depth ?? 1;
    const partitionHeight =
      object.params?.partitionHeight ?? 1.08;

    this.addPart(root, object, {
      name: `${object.id}:desk`,
      size: [width, 0.72, depth],
      local: [0, 0.38, 0],
      material: 'desk',
      collision: { movement: true, sight: true },
    });

    // Desks are authored as "low cover": they keep their real movement
    // footprint, but get a slightly taller sight-only volume. Standing
    // characters remain visible over it; crouched characters can be fully
    // hidden when the desk lies between observer and target.
    const coverHeight =
      object.params?.coverHeight ?? 1.08;

    this.addCollider(
      object,
      [0, coverHeight * 0.5, 0],
      [width, coverHeight, depth],
      { movement: false, sight: true },
      `${object.id}:low-cover`,
    );

    this.addPart(root, object, {
      name: `${object.id}:partition`,
      size: [width + 0.06, partitionHeight, 0.08],
      local: [0, partitionHeight * 0.5, -depth * 0.47],
      material: 'partition',
      collision: { movement: false, sight: true },
    });

    this.addPart(root, object, {
      name: `${object.id}:monitor`,
      size: [0.66, 0.44, 0.07],
      local: [0, 1.08, -0.14],
      material: 'screen',
      collision: { movement: false, sight: true },
    });

    this.addPart(root, object, {
      name: `${object.id}:chair`,
      size: [0.48, 0.5, 0.48],
      local: [0, 0.27, depth * 0.72],
      material: 'dark',
      collision: null,
    });

    return root;
  }

  createGlassRoom(object) {
    const root = this.createRoot(object);
    const width = object.params?.width ?? 4;
    const depth = object.params?.depth ?? 3.2;
    const doorWidth = object.params?.doorWidth ?? 1.4;
    const height = 2.35;
    const thickness = 0.08;
    const segment = (width - doorWidth) * 0.5;
    const frontZ = depth * 0.5;
    const backZ = -depth * 0.5;
    const offset = doorWidth * 0.5 + segment * 0.5;
    const collision = { movement: true, sight: false };

    const parts = [
      ['left', [thickness, height, depth], [-width * 0.5, height * 0.5, 0]],
      ['right', [thickness, height, depth], [width * 0.5, height * 0.5, 0]],
      ['back', [width, height, thickness], [0, height * 0.5, backZ]],
      ['front-a', [segment, height, thickness], [-offset, height * 0.5, frontZ]],
      ['front-b', [segment, height, thickness], [offset, height * 0.5, frontZ]],
    ];

    for (const [name, size, local] of parts) {
      this.addPart(root, object, {
        name: `${object.id}:${name}`,
        size,
        local,
        material: 'glass',
        collision,
      });
    }

    return root;
  }

  createElevator(object) {
    const root = this.createRoot(object);

    this.addPart(root, object, {
      name: `${object.id}:frame`,
      size: [3.4, 2.7, 0.24],
      local: [0, 1.35, -0.55],
      material: 'dark',
    });

    this.elevatorLeftDoor = this.addPart(root, object, {
      name: `${object.id}:door-left`,
      size: [1.22, 2.35, 0.08],
      local: [-0.62, 1.18, -0.41],
      material: 'elevator',
    });

    this.elevatorRightDoor = this.addPart(root, object, {
      name: `${object.id}:door-right`,
      size: [1.22, 2.35, 0.08],
      local: [0.62, 1.18, -0.41],
      material: 'elevator',
    });

    this.elevatorDoorBaseLeft = -0.62;
    this.elevatorDoorBaseRight = 0.62;

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
    this.extractionGlow.position.y = 0.02;
    root.add(this.extractionGlow);

    return root;
  }

  createObject(object) {
    let root;

    switch (object.type) {
      case 'desk':
        root = this.createDesk(object);
        break;

      case 'tallCover': {
        const width = object.params?.width ?? 1.2;
        const depth = object.params?.depth ?? 0.8;
        const height = object.params?.height ?? 1.82;
        root = this.createSimpleBox(
          object,
          [width, height, depth],
          'cabinet',
          height * 0.5,
        );
        break;
      }

      case 'printer':
        root = this.createSimpleBox(
          object,
          [0.72, 0.95, 0.68],
          'printer',
          0.475,
        );
        break;

      case 'counter': {
        const width = object.params?.width ?? 1.65;
        const depth = object.params?.depth ?? 0.7;
        const height = object.params?.height ?? 0.98;
        root = this.createSimpleBox(
          object,
          [width, height, depth],
          'desk',
          height * 0.5,
        );
        break;
      }

      case 'waterCooler':
        root = this.createSimpleBox(
          object,
          [0.52, 1.32, 0.52],
          'printer',
          0.66,
        );
        break;

      case 'plant': {
        const width = object.params?.width ?? 0.68;
        const height = object.params?.height ?? 1.35;
        root = this.createSimpleBox(
          object,
          [width, height, width],
          'plant',
          height * 0.5,
        );
        break;
      }

      case 'bench': {
        const width = object.params?.width ?? 1.5;
        const height = object.params?.height ?? 0.62;
        const depth = object.params?.depth ?? 0.6;
        root = this.createSimpleBox(
          object,
          [width, height, depth],
          'desk',
          height * 0.5,
        );
        break;
      }

      case 'glassRoom':
        root = this.createGlassRoom(object);
        break;

      case 'elevator':
        root = this.createElevator(object);
        break;

      case 'glassWall':
        root = this.createSimpleBox(
          {
            ...object,
            collision:
              object.collision ??
              { movement: true, sight: false },
          },
          object.size,
          'glass',
        );
        break;

      case 'wall':
        root = this.createSimpleBox(
          {
            ...object,
            collision:
              object.collision ??
              { movement: true, sight: true },
          },
          object.size,
          object.material ?? 'wall',
        );
        break;

      case 'floor':
      case 'zone':
        root = this.createSimpleBox(
          {
            ...object,
            collision:
              object.collision ??
              { movement: false, sight: false },
          },
          object.size,
          object.material ?? 'floor',
        );
        break;

      case 'cultureWall':
        root = this.createSimpleBox(
          {
            ...object,
            collision:
              object.collision ??
              { movement: false, sight: false },
          },
          object.size ?? [4, 1.2, 0.06],
          'warm',
          1.6,
        );
        break;

      case 'box':
      default:
        root = this.createSimpleBox(
          object,
          object.size ?? [1, 1, 1],
          object.material ?? 'wall',
        );
        break;
    }

    if (root) {
      this.registerRoot(root, object);
    }

    return root;
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
      this.elevatorDoorBaseLeft - open * 0.9;

    this.elevatorRightDoor.position.x =
      this.elevatorDoorBaseRight + open * 0.9;
  }

  dispose() {
    this.scene.remove(this.group);

    this.group.traverse(object => {
      object.geometry?.dispose?.();
    });

    for (const material of Object.values(this.materials)) {
      material.dispose?.();
    }

    this.objectRoots.clear();
  }
}
