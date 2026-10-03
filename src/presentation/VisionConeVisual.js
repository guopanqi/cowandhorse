import * as THREE from 'three';

export class VisionConeVisual {
  constructor(agent) {
    this.agent = agent;
    const angle = THREE.MathUtils.degToRad(agent.config.visionAngle);
    const radius = agent.config.visionDistance;
    const geometry = new THREE.CircleGeometry(radius, 28, Math.PI * 0.5 - angle * 0.5, angle);
    geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.MeshBasicMaterial({
      color: 0xc99443,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = 2;
  }

  update() {
    this.mesh.visible = this.agent.enabled;
    this.mesh.position.copy(this.agent.position);
    this.mesh.position.y = 0.035;
    this.mesh.rotation.y = Math.atan2(this.agent.forward.x, this.agent.forward.z) - Math.PI / 2;
    const hot = this.agent.detection;
    this.material.opacity = 0.11 + hot * 0.18;
    this.material.color.setHex(hot > 0.55 ? 0xc94c43 : 0xc99443);
  }
}
