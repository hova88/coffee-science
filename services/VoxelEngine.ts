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
    this.scene.background = new THREE.Color(CONFIG.BG_COLOR);
    this.scene.fog = new THREE.FogExp2(CONFIG.BG_COLOR, 0.02);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(15, 10, 15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, -2, 0);

    // Lighting for points
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);
    
    const blueLight = new THREE.PointLight(0x0088ff, 0.5, 50);
    blueLight.position.set(-10, 5, -10);
    this.scene.add(blueLight);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public loadInitialModel(data: VoxelData[]) {
    this.updateMesh(data);
    this.targetVoxels = data;
    this.onCountChange(data.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  public transitionTo(targetData: VoxelData[]) {
      if (this.state === AppState.REBUILDING) return;
      
      if (!this.instanceMesh || this.instanceMesh.count === 0) {
          this.loadInitialModel(targetData);
          return;
      }

      this.targetVoxels = targetData;
      this.morphProgress = 0;
      this.state = AppState.REBUILDING;
      this.onStateChange(this.state);
      
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
      
      // Point Cloud Aesthetic: Small boxes
      const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE);
      const material = new THREE.MeshStandardMaterial({ 
          roughness: 0.4, 
          metalness: 0.1,
          flatShading: true
      });
      
      this.instanceMesh = new THREE.InstancedMesh(geometry, material, count);
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
    this.frameCount++;

    // Gentle breathing animation for the point cloud
    const time = this.frameCount * 0.01;

    if (this.instanceMesh) {
        // If morphing
        if (this.state === AppState.REBUILDING) {
            this.morphProgress += 0.015;
            if (this.morphProgress >= 1) {
                this.morphProgress = 1;
                this.state = AppState.STABLE;
                this.onStateChange(this.state);
            }
        }

        const count = this.instanceMesh.count;
        const isMorphing = this.state === AppState.REBUILDING;

        for (let i = 0; i < count; i++) {
            this.instanceMesh.getMatrixAt(i, this.dummy.matrix);
            const currentPos = new THREE.Vector3();
            const currentScale = new THREE.Vector3();
            this.dummy.matrix.decompose(currentPos, new THREE.Quaternion(), currentScale);

            const target = this.targetVoxels[i];

            if (target) {
                // Logic: Move towards target
                // If not morphing, we still do a tiny float
                let tx = target.x;
                let ty = target.y;
                let tz = target.z;

                // Add idle float
                if (!isMorphing) {
                    ty += Math.sin(time + tx * 0.5) * 0.05;
                }

                // Lerp Position
                currentPos.x += (tx - currentPos.x) * 0.1;
                currentPos.y += (ty - currentPos.y) * 0.1;
                currentPos.z += (tz - currentPos.z) * 0.1;
                
                // Lerp Scale (Pop in)
                currentScale.lerp(new THREE.Vector3(1,1,1), 0.1);
                
                this.dummy.position.copy(currentPos);
                this.dummy.scale.copy(currentScale);
                this.dummy.updateMatrix();
                this.instanceMesh.setMatrixAt(i, this.dummy.matrix);

                // Color transition
                if (isMorphing && this.morphProgress > 0.5) {
                    this.instanceMesh.setColorAt(i, new THREE.Color(target.color));
                }
            } else {
                // Scale down (disappear)
                currentScale.lerp(new THREE.Vector3(0,0,0), 0.2);
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

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}