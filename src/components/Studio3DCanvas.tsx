import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function Studio3DCanvas() {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Scene & Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // 4. Procedural Subject (Composite 3-12 parts)
    const mixerGroup = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.2 })
    );
    base.position.y = 0.25;
    mixerGroup.add(base);

    // Motor
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 1.5, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.6 })
    );
    motor.position.y = 1.5;
    mixerGroup.add(motor);

    // Bowl
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 0.8, 1, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.8, side: THREE.DoubleSide })
    );
    bowl.position.y = 0.5;
    mixerGroup.add(bowl);
    
    scene.add(mixerGroup);

    // 5. Lighting
    const keyLight = new THREE.DirectionalLight(0xfff7e6, 2);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);
    scene.add(new THREE.HemisphereLight(0xe0e7ff, 0x0f172a, 1));

    // 6. Animation Loop
    function animate() {
      requestAnimationFrame(animate);
      mixerGroup.rotation.y += 0.005;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={canvasMountRef} className="w-full h-full" />;
}
