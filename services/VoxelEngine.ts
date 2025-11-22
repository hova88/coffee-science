
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { AppState, VoxelData } from '../types';
import { CONFIG } from '../utils/voxelConstants';

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  // Post Processing
  private composer: EffectComposer;
  
  // Instance Mesh for Particles
  private instanceMesh: THREE.InstancedMesh | null = null;
  private randomRotations: Float32Array = new Float32Array(0);
  
  private dummy = new THREE.Object3D();
  
  private targetVoxels: VoxelData[] = []; 
  private morphProgress: number = 1;
  
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private animationId: number = 0;
  private frameCount: number = 0;

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;

    // Init Three.js
    this.scene = new THREE.Scene();
    // Transparent background to let CSS Gradient show through
    this.scene.background = null; 
    
    // Very subtle fog to blend distant particles
    this.scene.fog = new THREE.FogExp2(0x111111, 0.04);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 3, 9); 

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    container.appendChild(this.renderer.domElement);

    // --- POST PROCESSING (ELEGANT GLOW) ---
    const renderScene = new RenderPass(this.scene, this.camera);
    
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 
        0.4,  // Soft strength
        0.5,  // Radius
        0.8   // High threshold (only bright reflections glow)
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 16;
    this.controls.maxPolarAngle = Math.PI / 1.8; 

    // --- STUDIO LIGHTING (Softbox Style) ---
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    this.scene.add(ambientLight);

    // Key Light (Soft White)
    const keyLight = new THREE.RectAreaLight(0xffffff, 3.0, 10, 10);
    keyLight.position.set(5, 5, 5);
    keyLight.lookAt(0, 0, 0);
    this.scene.add(keyLight);
    
    // Rim Light (Cool Cyan Accent) - Defines edges
    const rimLight = new THREE.SpotLight(0xddeeff, 4.0);
    rimLight.position.set(-5, 6, -5);
    rimLight.lookAt(0, 0, 0);
    this.scene.add(rimLight);

    // Bottom Fill (Warmth reflection)
    const fillLight = new THREE.PointLight(0xffeedd, 0.5);
    fillLight.position.set(0, -5, 0);
    this.scene.add(fillLight);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public transitionTo(targetData: VoxelData[], showModel: boolean) {
      // UNLOCKED: Allow updating targets even if animating (for slider responsiveness)
      
      if (!this.instanceMesh || this.instanceMesh.count < targetData.length) {
          this.updateMeshBufferSize(Math.max(targetData.length * 1.5, 10000));
      }

      this.targetVoxels = targetData;
      
      // Only reset morph progress if we were effectively done or if it's a huge shift
      // For small shifts (sliders), we just let the LERP catch up in the animate loop
      if (this.state === AppState.STABLE) {
          this.morphProgress = 0;
          this.state = AppState.REBUILDING;
          this.onStateChange(this.state);
      }
      
      this.onCountChange(targetData.length);
  }

  private updateMeshBufferSize(count: number) {
      if (this.instanceMesh) {
          this.scene.remove(this.instanceMesh);
          this.instanceMesh.geometry.dispose();
      }
      
      // Rounded Box for fluid feel
      const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE * 0.85, CONFIG.VOXEL_SIZE * 0.85, CONFIG.VOXEL_SIZE * 0.85);
      
      this.randomRotations = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        this.randomRotations[i * 3 + 0] = Math.random() * Math.PI;
        this.randomRotations[i * 3 + 1] = Math.random() * Math.PI;
        this.randomRotations[i * 3 + 2] = Math.random() * Math.PI;
      }

      // HIGH-FIDELITY MATERIAL (Glass/Jewel like)
      const material = new THREE.MeshPhysicalMaterial({ 
          color: 0xffffff,
          roughness: 0.1,        // Very smooth
          metalness: 0.1,
          transmission: 0.0,     // Solid but glossy
          reflectivity: 0.8,
          clearcoat: 1.0,        // Wet look
          clearcoatRoughness: 0.1,
      });
      
      this.instanceMesh = new THREE.InstancedMesh(geometry, material, count);
      this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(this.instanceMesh);
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.frameCount++;

    const time = this.frameCount * 0.005;

    // --- BREATHING EFFECT ---
    if (this.instanceMesh) {
        this.instanceMesh.position.y = Math.sin(time * 0.3) * 0.03;
        this.instanceMesh.rotation.y = Math.sin(time * 0.1) * 0.03; // Gentle yaw
    }

    if (this.instanceMesh) {
        // Transition Logic
        if (this.state === AppState.REBUILDING) {
            this.morphProgress += 0.05; // Faster transition for responsiveness
            if (this.morphProgress >= 1) {
                this.morphProgress = 1;
                this.state = AppState.STABLE;
                this.onStateChange(this.state);
            }
        }

        const count = this.instanceMesh.count;
        const targetLen = this.targetVoxels.length;

        for (let i = 0; i < count; i++) {
            this.instanceMesh.getMatrixAt(i, this.dummy.matrix);
            const currentPos = new THREE.Vector3();
            const currentScale = new THREE.Vector3();
            const currentRot = new THREE.Quaternion();
            this.dummy.matrix.decompose(currentPos, currentRot, currentScale);

            if (i < targetLen) {
                const target = this.targetVoxels[i];
                
                const breathe = Math.sin(target.y * 3.0 + time * 1.5) * 0.005;
                const ty = target.y + breathe;

                // Interpolation: Faster if state is stable (dragging slider), slower if rebuilding
                const lerpFactor = this.state === AppState.REBUILDING ? 0.1 : 0.25;
                currentPos.lerp(new THREE.Vector3(target.x, ty, target.z), lerpFactor);
                
                // Pop in effect
                currentScale.lerp(new THREE.Vector3(1,1,1), 0.15);

                // Rotations: Sparkle effect
                const rotX = this.randomRotations[i * 3 + 0] + (time * 0.2);
                const rotY = this.randomRotations[i * 3 + 1] + (time * 0.1);
                const targetRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0));
                currentRot.slerp(targetRot, 0.08);

                const baseColor = new THREE.Color(target.color);
                this.instanceMesh.setColorAt(i, baseColor);

            } else {
                currentScale.lerp(new THREE.Vector3(0,0,0), 0.2);
            }

            this.dummy.position.copy(currentPos);
            this.dummy.quaternion.copy(currentRot);
            this.dummy.scale.copy(currentScale);
            this.dummy.updateMatrix();
            this.instanceMesh.setMatrixAt(i, this.dummy.matrix);
        }
        
        this.instanceMesh.instanceMatrix.needsUpdate = true;
        if (this.instanceMesh.instanceColor) this.instanceMesh.instanceColor.needsUpdate = true;
    }

    this.composer.render();
  }

  public handleResize() {
      if (this.camera && this.renderer && this.composer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
      }
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}
