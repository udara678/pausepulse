import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Glass3DBackgroundProps {
  breathPhase?: 'INHALE' | 'HOLD' | 'EXHALE';
  isBreathingActive?: boolean;
  theme?: 'dark' | 'light';
}

export const Glass3DBackground: React.FC<Glass3DBackgroundProps> = ({
  breathPhase = 'INHALE',
  isBreathingActive = false,
  theme = 'dark',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 18);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // --- Lighting (Ethereal Lavender & Lilac Speculars) ---
    const ambientLight = new THREE.AmbientLight(0xd8b4fe, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfdf4ff, 3.0);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc084fc, 2.2);
    dirLight2.position.set(-12, -8, 8);
    scene.add(dirLight2);

    const mouseLight = new THREE.PointLight(0xa855f7, 4.0, 25);
    mouseLight.position.set(0, 0, 5);
    scene.add(mouseLight);

    // --- Materials (Translucent Ethereal Glass) ---
    const glassSphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xecdcfc,
      emissive: 0x2e1065,
      emissiveIntensity: 0.15,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.92, // Glass transmission
      ior: 1.48, // Index of refraction
      reflectivity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    const glassDiscMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd8b4fe,
      emissive: 0x3b0764,
      emissiveIntensity: 0.2,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.8,
    });

    // --- 3D Objects Setup (Matching getlayers serene image) ---
    // 1. Primary Hero Glass Sphere (Breathing & Focus Anchor)
    const heroGeometry = new THREE.SphereGeometry(2.8, 48, 48);
    const heroSphere = new THREE.Mesh(heroGeometry, glassSphereMaterial.clone());
    heroSphere.position.set(3.8, -0.6, 1.5);
    scene.add(heroSphere);

    // 2. Floating Secondary Glass Spheres
    interface FloatingItem {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      speed: number;
      offset: number;
      rotSpeedX: number;
      rotSpeedY: number;
    }

    const floatingItems: FloatingItem[] = [];

    // Additional Spheres
    const sphereCoords = [
      { pos: [-4.5, 2.5, -2], size: 1.3, speed: 0.9 },
      { pos: [-2.2, -3.2, 0.5], size: 0.9, speed: 1.2 },
      { pos: [5.8, 3.8, -3], size: 1.1, speed: 0.8 },
      { pos: [-6.5, -0.8, -1], size: 0.7, speed: 1.4 },
      { pos: [1.2, 4.2, -4], size: 0.6, speed: 1.1 },
    ];

    sphereCoords.forEach((cfg, idx) => {
      const geom = new THREE.SphereGeometry(cfg.size, 32, 32);
      const mesh = new THREE.Mesh(geom, glassSphereMaterial);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      scene.add(mesh);
      floatingItems.push({
        mesh,
        basePos: mesh.position.clone(),
        speed: cfg.speed,
        offset: idx * 1.3,
        rotSpeedX: 0.003,
        rotSpeedY: 0.004,
      });
    });

    // 3. Floating 3D Glass Discs / Coins (Exact match to getlayers scene!)
    const discCoords = [
      { pos: [1.8, 3.2, 0], radius: 1.6, thick: 0.18, rotZ: 0.25 },
      { pos: [4.2, 4.5, -1], radius: 1.1, thick: 0.14, rotZ: -0.3 },
      { pos: [-3.8, 0.8, 1], radius: 1.0, thick: 0.12, rotZ: 0.4 },
      { pos: [6.5, 1.2, -2], radius: 0.75, thick: 0.1, rotZ: -0.15 },
    ];

    discCoords.forEach((cfg, idx) => {
      const geom = new THREE.CylinderGeometry(cfg.radius, cfg.radius, cfg.thick, 40);
      const mesh = new THREE.Mesh(geom, glassDiscMaterial);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.x = Math.PI / 2.8;
      mesh.rotation.z = cfg.rotZ;
      scene.add(mesh);
      floatingItems.push({
        mesh,
        basePos: mesh.position.clone(),
        speed: 0.75 + idx * 0.2,
        offset: idx * 2.1,
        rotSpeedX: 0.006,
        rotSpeedY: 0.008,
      });
    });

    // 4. Subtle Sparkling Ethereal Dust Particles
    const particleCount = 65;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 24;
      particlePositions[i + 1] = (Math.random() - 0.5) * 16;
      particlePositions[i + 2] = (Math.random() - 0.5) * 12;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf5d0fe,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Interactive Mouse Parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = x * 1.5;
      mouse.targetY = y * 1.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x * 0.8;
      camera.position.y = mouse.y * 0.6;
      camera.lookAt(0, 0, 0);

      mouseLight.position.x = mouse.x * 6;
      mouseLight.position.y = mouse.y * 5;

      // Float other spheres and discs gently
      floatingItems.forEach((item) => {
        const floatY = Math.sin(elapsed * item.speed + item.offset) * 0.45;
        const floatX = Math.cos(elapsed * (item.speed * 0.7) + item.offset) * 0.25;
        item.mesh.position.y = item.basePos.y + floatY;
        item.mesh.position.x = item.basePos.x + floatX;

        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
      });

      // Hero Sphere Breathing / Ambient Pulse
      let targetHeroScale = 1.0;
      if (isBreathingActive) {
        if (breathPhase === 'INHALE') targetHeroScale = 1.25;
        else if (breathPhase === 'HOLD') targetHeroScale = 1.22;
        else targetHeroScale = 0.88;
      } else {
        targetHeroScale = 1.0 + Math.sin(elapsed * 0.8) * 0.04;
      }

      heroSphere.scale.lerp(new THREE.Vector3(targetHeroScale, targetHeroScale, targetHeroScale), 0.04);
      heroSphere.rotation.y += 0.003;
      heroSphere.rotation.x += 0.002;
      heroSphere.position.y = -0.6 + Math.sin(elapsed * 0.6) * 0.3;

      // Particle rotation
      particles.rotation.y = elapsed * 0.02;
      particles.rotation.x = elapsed * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      heroGeometry.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      glassSphereMaterial.dispose();
      glassDiscMaterial.dispose();
    };
  }, [breathPhase, isBreathingActive]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background:
          theme === 'dark'
            ? 'radial-gradient(ellipse at 70% 30%, rgba(88, 28, 135, 0.45) 0%, rgba(30, 27, 75, 0.65) 45%, rgba(15, 23, 42, 0.95) 100%)'
            : 'radial-gradient(ellipse at 70% 30%, rgba(243, 232, 255, 0.9) 0%, rgba(233, 213, 255, 0.6) 45%, rgba(248, 250, 252, 0.95) 100%)',
      }}
    />
  );
};
