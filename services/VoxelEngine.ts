/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, VoxelData } from '../types';
import { CONFIG } from '../utils/voxelConstants';

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private instanceMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  
  private voxels: VoxelData[] = []; // Current state
  private targetVoxels: VoxelData[] = []; // Target for morphing
  private morphProgress: number = 1;
  
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private animationId: number = 0;

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
    this.scene.background = new THREE.Color(CONFIG.BG_COLOR);
    // Add subtle grid for technical feel
    const gridHelper = new THREE.GridHelper(100, 50, 0x333333, 0x222222);
    gridHelper.position.y = CONFIG.FLOOR_Y;
    this.scene.add(gridHelper);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(25, 20, 35);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;
    this.controls.target.set(0, 0, 0);

    // Technical Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const spotLight = new THREE.SpotLight(0xffc107, 0.8);
    spotLight.position.set(-20, 30, -20);
    spotLight.lookAt(0, 0, 0);
    this.scene.add(spotLight);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public loadInitialModel(data: VoxelData[]) {
    // Direct load, no animation
    this.updateMesh(data);
    this.targetVoxels = data; // Sync
    this.onCountChange(data.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  // Transition to new model using morphing
  public transitionTo(targetData: VoxelData[]) {
      if (this.state === AppState.REBUILDING) return;
      
      // If current is empty, just load
      if (!this.instanceMesh || this.instanceMesh.count === 0) {
          this.loadInitialModel(targetData);
          return;
      }

      this.targetVoxels = targetData;
      this.morphProgress = 0;
      this.state = AppState.REBUILDING;
      this.onStateChange(this.state);
      
      // Resize mesh if needed (always grow to max required)
      const maxCount = Math.max(this.instanceMesh.count, targetData.length);
      if (maxCount > this.instanceMesh.count) {
          this.updateMeshBufferSize(maxCount);
      }
      
      this.onCountChange(targetData.length);
  }

  private updateMeshBufferSize(count: number) {
      if (this.instanceMesh) {
          this.scene.remove(this.instanceMesh);
          this.instanceMesh.geometry.dispose();
      }
      
      const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE);
      const material = new THREE.MeshStandardMaterial({ 
          roughness: 0.6, 
          metalness: 0.2,
      });
      
      this.instanceMesh = new THREE.InstancedMesh(geometry, material, count);
      this.instanceMesh.castShadow = true;
      this.instanceMesh.receiveShadow = true;
      this.scene.add(this.instanceMesh);
  }

  private updateMesh(data: VoxelData[]) {
      this.updateMeshBufferSize(data.length);
      data.forEach((v, i) => {
          this.dummy.position.set(v.x, v.y, v.z);
          this.dummy.scale.set(1,1,1);
          this.dummy.updateMatrix();
          this.instanceMesh!.setMatrixAt(i, this.dummy.matrix);
          this.instanceMesh!.setColorAt(i, new THREE.Color(v.color));
      });
      this.instanceMesh!.instanceMatrix.needsUpdate = true;
      if (this.instanceMesh!.instanceColor) this.instanceMesh!.instanceColor.needsUpdate = true;
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();

    // Morphing Logic
    if (this.state === AppState.REBUILDING && this.instanceMesh) {
        this.morphProgress += 0.02; // Speed
        if (this.morphProgress >= 1) {
            this.morphProgress = 1;
            this.state = AppState.STABLE;
            this.onStateChange(this.state);
            // Final cleanup of mesh size could happen here
        }
        
        const count = this.instanceMesh.count;

        for (let i = 0; i < count; i++) {
            const target = this.targetVoxels[i];
            
            this.instanceMesh.getMatrixAt(i, this.dummy.matrix);
            const currentPos = new THREE.Vector3();
            const currentScale = new THREE.Vector3();
            this.dummy.matrix.decompose(currentPos, new THREE.Quaternion(), currentScale);

            if (target) {
                // Move towards target
                const dx = target.x - currentPos.x;
                const dy = target.y - currentPos.y;
                const dz = target.z - currentPos.z;
                
                // We want to close the gap by a factor
                currentPos.x += dx * 0.1;
                currentPos.y += dy * 0.1;
                currentPos.z += dz * 0.1;
                
                // Scale up to 1
                currentScale.lerp(new THREE.Vector3(1,1,1), 0.1);
                
                this.dummy.position.copy(currentPos);
                this.dummy.scale.copy(currentScale);
                this.dummy.updateMatrix();
                this.instanceMesh.setMatrixAt(i, this.dummy.matrix);
                
                // Color lerp
                if (this.morphProgress > 0.5) {
                    this.instanceMesh.setColorAt(i, new THREE.Color(target.color));
                }
            } else {
                // Scale down and fall (disappear)
                currentPos.y -= 0.5;
                currentScale.lerp(new THREE.Vector3(0,0,0), 0.1);
                
                this.dummy.position.copy(currentPos);
                this.dummy.scale.copy(currentScale);
                this.dummy.updateMatrix();
                this.instanceMesh.setMatrixAt(i, this.dummy.matrix);
            }
        }
        this.instanceMesh.instanceMatrix.needsUpdate = true;
        if (this.instanceMesh.instanceColor) this.instanceMesh.instanceColor.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
  }

  public handleResize() {
      if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
  }
  
  public setAutoRotate(enabled: boolean) {
    if (this.controls) {
        this.controls.autoRotate = enabled;
    }
  }
  
  public getUniqueColors(): string[] {
     return [];
  }
  
  public getJsonData(): string {
      return "";
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}