import * as THREE from 'three';

export class CharacterVisual {
  constructor({
    color = 0x4d6680,
    skin = 0xc49a78,
    danger = 0,
  } = {}) {
    this.group = new THREE.Group();
    this.body = new THREE.Group();
    this.group.add(this.body);

    const cloth = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: skin,
      roughness: 0.9,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x242726,
      roughness: 0.9,
    });

    this.torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.88, 0.35),
      cloth,
    );
    this.torso.position.y = 1.15;

    this.head = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.43, 0.38),
      skinMat,
    );
    this.head.position.y = 1.82;

    this.leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.78, 0.2),
      dark,
    );
    this.leftLeg.position.set(-0.17, 0.48, 0);

    this.rightLeg = this.leftLeg.clone();
    this.rightLeg.position.x = 0.17;

    this.leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.76, 0.18),
      cloth,
    );
    this.leftArm.position.set(-0.42, 1.15, 0);

    this.rightArm = this.leftArm.clone();
    this.rightArm.position.x = 0.42;

    this.body.add(
      this.torso,
      this.head,
      this.leftLeg,
      this.rightLeg,
      this.leftArm,
      this.rightArm,
    );

    if (danger > 0) {
      this.tie = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.42, 0.035),
        new THREE.MeshStandardMaterial({
          color: danger === 3 ? 0xb9332d : 0x313433,
        }),
      );
      this.tie.position.set(0, 1.17, 0.195);
      this.body.add(this.tie);
    }

    this.group.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    this.pose = 'idle';
  }

  setPosition(position) {
    this.group.position.copy(position);
  }

  setFacing(direction) {
    if (
      Math.abs(direction.x) +
        Math.abs(direction.z) <
      0.001
    ) {
      return;
    }

    this.group.rotation.y = Math.atan2(
      direction.x,
      direction.z,
    );
  }

  setPose(pose = 'idle') {
    if (this.pose === pose) return;
    this.pose = pose;

    this.body.scale.set(1, 1, 1);
    this.body.position.set(0, 0, 0);

    this.head.rotation.set(0, 0, 0);
    this.torso.rotation.set(0, 0, 0);

    this.leftArm.rotation.set(0, 0, 0);
    this.rightArm.rotation.set(0, 0, 0);

    this.leftArm.position.set(-0.42, 1.15, 0);
    this.rightArm.position.set(0.42, 1.15, 0);

    if (pose === 'crouch') {
      this.body.scale.y = 0.67;
      this.body.position.y = 0.01;
      return;
    }

    if (pose === 'sit') {
      this.body.scale.y = 0.78;
      this.body.position.y = -0.03;
      this.leftArm.rotation.x = -0.32;
      this.rightArm.rotation.x = -0.32;
      return;
    }

    if (pose === 'inspect' || pose === 'read') {
      this.head.rotation.x = -0.22;
      this.rightArm.rotation.x = -0.72;
      return;
    }

    if (pose === 'print' || pose === 'tea') {
      this.leftArm.rotation.x = -0.85;
      this.rightArm.rotation.x = -0.85;
      return;
    }

    if (pose === 'tap') {
      this.rightArm.rotation.x = -1.25;
      this.rightArm.rotation.z = -0.28;
      this.rightArm.position.z = 0.12;
      this.head.rotation.x = -0.08;
      return;
    }

    if (pose === 'caught') {
      this.head.rotation.x = 0.1;
      this.leftArm.rotation.x = 0.12;
      this.rightArm.rotation.x = 0.12;
    }
  }
}
