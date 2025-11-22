/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';

export enum AppState {
  STABLE = 'STABLE',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING'
}

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

// The core physics layers
export type ViewMode = 
  | 'REALITY'     // The actual look
  | 'SATURATION'  // Water distribution
  | 'EXTRACTION'  // Solubles remaining
  | 'FLOW_VELOCITY'; // Speed of particles

export interface SimulationParams {
    grindSize: number;   // 0.0 (Turkish) to 1.0 (French Press)
    temperature: number; // 0.0 (80C) to 1.0 (100C)
    ratio: number;       // 0.0 (1:10) to 1.0 (1:20)
    agitation: number;   // 0.0 (Gentle) to 1.0 (Aggressive)
    time: number;        // 0.0 (0s) to 1.0 (240s)
    shape: 'CONE' | 'FLAT';
    viewMode: ViewMode; 
}

export interface FlavorProfile {
    acidity: number;    // Early extraction
    sweetness: number;  // Mid extraction
    bitterness: number; // Late extraction
    body: number;       // Total dissolved solids + oils
    clarity: number;    // Inverse of fines/body
    extractionYield: number; // %
    tds: number;        // %
}
