import * as THREE from 'three';

export class VisionConeVisual {
  constructor(agent) {
    this.agent = agent;

    const radius = agent.config.visionDistance;
    const halfAngle = THREE.MathUtils.degToRad(agent.config.visionAngle) * 0.5;
    const segments = 28;
    const vertices = [];

    for (let i = 0; i < segments; i++) {
      const a0 = -halfAngle + (i / segments) * halfAngle * 2;
      const a1 = -halfAngle + ((i + 1) / segments) * halfAngle * 2;

      vertices.push(
        0, 0, 0,
        Math.sin(a0) * radius, 0, Math.cos(a0) * radius,
        Math.sin(a1) * radius, 0, Math.cos(a1) * radius,
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );

    this.safeColor = new THREE.Color(0xd4b56c);
    this.alertColor = new THREE.Color(0xd13f35);

    this.material = new THREE.MeshBasicMaterial({
      color: this.safeColor,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = 2;
  }

  update() {
    this.mesh.visible = this.agent.enabled;
    this.mesh.position.copy(this.agent.position);
    this.mesh.position.y = 0.035;
    this.mesh.rotation.y = Math.atan2(
      this.agent.forward.x,
      this.agent.forward.z,
    );

    const hot = this.agent.state === 'chase'
      ? 1
      : THREE.MathUtils.clamp(this.agent.detection, 0, 1);

    this.material.color
      .copy(this.safeColor)
      .lerp(this.alertColor, hot);

    this.material.opacity = 0.09 + hot * 0.2;
  }
}
