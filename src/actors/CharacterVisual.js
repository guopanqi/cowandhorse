import * as THREE from 'three';

export class CharacterVisual {
  constructor({ color = 0x4d6680, skin = 0xc49a78, danger = 0 } = {}) {
    this.group = new THREE.Group();

    const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x242726, roughness: 0.9 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.88, 0.35), cloth);
    torso.position.y = 1.15;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.43, 0.38), skinMat);
    head.position.y = 1.82;

    const legs = [
      [-0.17, 0.48],
      [0.17, 0.48]
    ];
    for (const [x, y] of legs) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.2), dark);
      leg.position.set(x, y, 0);
      this.group.add(leg);
    }

    this.group.add(torso, head);

    if (danger > 0) {
      const tie = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.42, 0.035),
        new THREE.MeshStandardMaterial({ color: danger === 3 ? 0xb9332d : 0x313433 })
      );
      tie.position.set(0, 1.17, 0.195);
      this.group.add(tie);
    }

    this.group.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }

  setPosition(position) {
    this.group.position.copy(position);
  }

  setFacing(direction) {
    if (Math.abs(direction.x) + Math.abs(direction.z) < 0.001) return;
    this.group.rotation.y = Math.atan2(direction.x, direction.z);
  }
}
