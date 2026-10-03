import * as THREE from 'three';

const mat = (color, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });

export class OfficeBuilder {
  constructor(scene, collision, data) {
    this.scene = scene;
    this.collision = collision;
    this.data = data;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.materials = {
      floor: mat(0x77756e, 0.95),
      wall: mat(0xd8d1c4, 0.9),
      dark: mat(0x343736, 0.9),
      desk: mat(0xa38d70, 0.9),
      partition: mat(0x8c9692, 0.95),
      glass: new THREE.MeshStandardMaterial({ color: 0xaac6c9, transparent: true, opacity: 0.22, roughness: 0.25 }),
      screen: new THREE.MeshStandardMaterial({ color: 0x88a9ad, emissive: 0x243a3d, emissiveIntensity: 1.3 }),
      plant: mat(0x65745a, 1),
      elevator: mat(0xb8aaa0, 0.55),
      warm: new THREE.MeshStandardMaterial({ color: 0xe3a066, emissive: 0x7a3518, emissiveIntensity: 0.6 })
    };
  }

  build() {
    this.addLights();
    this.addFloor();
    this.addBoundaryWalls();
    this.addRooms();
    this.addDeskBanks();
    this.addExtraction();
    this.addDetails();

    for (const box of this.data.blockers) this.collision.addBox(...box);
    return this.group;
  }

  addLights() {
    const hemi = new THREE.HemisphereLight(0xf0eadc, 0x4b5150, 1.5);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffc58f, 2.2);
    sun.position.set(-9, 13, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    this.scene.add(sun);

    const office = new THREE.DirectionalLight(0xdce8e7, 1.35);
    office.position.set(6, 10, -5);
    this.scene.add(office);
  }

  box(name, size, position, material, { cast = true, receive = true } = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    this.group.add(mesh);
    return mesh;
  }

  addFloor() {
    this.box('Floor', [21, 0.16, 17], [0, -0.1, 0], this.materials.floor, { cast: false });
  }

  addBoundaryWalls() {
    this.box('WallNorth', [21, 2.8, 0.22], [0, 1.4, -8.15], this.materials.wall);
    this.box('WallWest', [0.22, 2.8, 16.3], [-10.15, 1.4, 0], this.materials.wall);
    this.box('WallEast', [0.22, 2.8, 16.3], [10.15, 1.4, 0], this.materials.wall);

    for (let x = -8; x <= 8; x += 4) {
      const window = this.box('Window', [3.25, 1.5, 0.08], [x, 1.65, 8.02], this.materials.glass, { cast: false });
      window.material = this.materials.glass;
    }
  }

  addRooms() {
    this.box('BossRoom', [4.1, 1.55, 3.3], [-6.75, 0.76, -5.35], this.materials.glass, { cast: false });
    this.box('MeetingRoom', [4.1, 1.55, 3.3], [6.75, 0.76, -5.35], this.materials.glass, { cast: false });

    this.box('BossDesk', [2.1, 0.72, 0.78], [-6.75, 0.38, -5.5], this.materials.desk);
    this.box('MeetingTable', [2.5, 0.72, 1.1], [6.75, 0.38, -5.35], this.materials.desk);
  }

  addDeskBanks() {
    const banks = [
      [-7.1, 0], [-2.1, 0], [2.8, 0], [7.4, 0],
      [-7.1, 4.0], [-2.1, 4.0], [2.8, 4.0], [7.4, 4.0]
    ];

    for (const [x, z] of banks) {
      this.box('Desk', [2.7, 0.72, 1.35], [x, 0.38, z], this.materials.desk);
      this.box('Partition', [2.8, 0.75, 0.08], [x, 1.05, z - 0.62], this.materials.partition);
      this.box('Monitor', [0.75, 0.48, 0.08], [x, 1.12, z - 0.24], this.materials.screen);
      this.box('Chair', [0.52, 0.48, 0.52], [x, 0.27, z + 1.05], this.materials.dark);
    }
  }

  addExtraction() {
    const [x,,z] = this.data.extraction.position;
    this.box('ElevatorFrame', [3.4, 2.7, 0.24], [x, 1.35, -8.0], this.materials.dark);
    const door = this.box('ElevatorDoor', [2.5, 2.35, 0.08], [x, 1.18, -7.86], this.materials.elevator);
    door.userData.extraction = true;

    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.78, 36),
      new THREE.MeshBasicMaterial({ color: 0xf1b666, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, 0.02, z);
    this.group.add(glow);
  }

  addDetails() {
    this.box('Printer', [0.85, 0.95, 0.62], [-9.0, 0.5, 6.3], this.materials.wall);
    this.box('WaterCooler', [0.55, 1.35, 0.55], [9.0, 0.7, 6.4], this.materials.wall);
    this.box('CultureWall', [4.0, 1.2, 0.06], [0, 1.6, -8.0], this.materials.warm, { cast: false });

    const pot = this.box('PlantPot', [0.5, 0.45, 0.5], [8.9, 0.24, -2.4], this.materials.dark);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.25, 7), this.materials.plant);
    crown.position.set(pot.position.x, 1.0, pot.position.z);
    this.group.add(crown);
  }
}
