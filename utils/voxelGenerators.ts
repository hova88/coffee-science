/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData, SimulationParams } from '../types';
import { COLORS, CONFIG } from './voxelConstants';

// --- MATH HELPERS ---

function addPoint(list: VoxelData[], x: number, y: number, z: number, color: number) {
    // Very minimal jitter for a clean, high-tech scientific look
    const jitter = CONFIG.GRID_SIZE * 0.05; 
    const jx = (Math.random() - 0.5) * jitter;
    const jy = (Math.random() - 0.5) * jitter;
    const jz = (Math.random() - 0.5) * jitter;
    list.push({ x: x + jx, y: y + jy, z: z + jz, color });
}

function lerpColor(c1: number, c2: number, t: number): number {
    const r1 = (c1 >> 16) & 255;
    const g1 = (c1 >> 8) & 255;
    const b1 = c1 & 255;
    
    const r2 = (c2 >> 16) & 255;
    const g2 = (c2 >> 8) & 255;
    const b2 = c2 & 255;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
}

const DEFAULT_PARAMS: SimulationParams = {
    grindSize: 0.5,
    temperature: 0.5,
    ratio: 0.5,
    agitation: 0.5,
    time: 0.2,
    shape: 'CONE',
    viewMode: 'REALITY'
};

export const ParametricGenerators = {
    
    V60Simulation: (params: SimulationParams = DEFAULT_PARAMS): VoxelData[] => {
        const p = params || DEFAULT_PARAMS;
        const points: VoxelData[] = [];
        
        // --- PHYSICS VARIABLES ---
        const resistance = 1.0 - (p.grindSize * 0.8); 
        const gravity = 0.8;
        const flowRate = (gravity / resistance) * 0.5;
        const solubility = 0.5 + (p.temperature * 1.5);

        // Draw Down Simulation
        // Map time 0..1 to drainage.
        const drainageProgress = p.time * flowRate; 
        
        // --- GEOMETRY CALIBRATION ---
        // Calibrated to fit inside the STL Model (scale 0.12, trans 25)
        // Visually, the V60 interior cone spans roughly Y = -0.5 to Y = 2.5 in world space
        const coneTipY = -0.5; 
        const coneTopY = 2.2;
        
        // Water level starts high and lowers
        const waterLevelY = coneTopY - (drainageProgress * 3.5); 
        const effectiveWaterLevel = Math.max(coneTipY, waterLevelY);

        const isFlat = p.shape === 'FLAT';

        const radiusAtY = (y: number) => {
            if (isFlat) {
               // Kalita style flat bottom wave
               if (y < coneTipY + 0.3) return 0.7; 
               return 0.7 + (y - (coneTipY + 0.3)) * 0.6;
            }
            // V60 Cone
            const h = y - coneTipY;
            if (h < 0) return 0;
            return h * 0.65; // Approx 60 deg opening
        };

        // --- GENERATE PARTICLE CLOUD ---
        // Denser steps for high-fidelity visualization
        const verticalStep = 0.04; 
        const radialStep = 0.04;

        for (let y = coneTipY; y <= coneTopY; y += verticalStep) {
            const r = radiusAtY(y) * 0.9; // Scale down slightly to fit INSIDE glass
            
            // Optimization: Don't render empty air above water level unless pouring active
            if (y > effectiveWaterLevel && p.time > 0.6) continue;

            for (let x = -r; x <= r; x += radialStep) {
                for (let z = -r; z <= r; z += radialStep) {
                    // Circle check
                    if (x*x + z*z > r*r) continue;

                    // --- PHYSICS STATE ---
                    const isWet = y <= effectiveWaterLevel;
                    const bedHeight = coneTipY + 0.8 + (1.0 - p.grindSize) * 0.2; // Bed swells
                    const isBed = y < bedHeight; 
                    
                    const surfaceArea = 1.0 + ((1.0 - p.grindSize) * 2.0); 
                    const exposure = isWet ? (p.time * solubility * surfaceArea) : 0;

                    let voxelColor = 0;
                    let includeVoxel = false;

                    // --- VISUALIZATION LOGIC ---

                    if (p.viewMode === 'REALITY') {
                        if (isBed) {
                            voxelColor = isWet ? COLORS.GROUNDS_WET : COLORS.GROUNDS_DRY;
                            includeVoxel = true;
                        } else if (isWet) {
                            // Water Area
                            // High density random sample for liquid volume
                            if (Math.random() > 0.4) { 
                                voxelColor = COLORS.WATER_CLEAR;
                                includeVoxel = true;
                            }
                        }
                    } 
                    else if (p.viewMode === 'SATURATION') {
                         if (y > effectiveWaterLevel) {
                             if (isBed) { voxelColor = COLORS.GROUNDS_DRY; includeVoxel = true; }
                         } else {
                             const depth = (effectiveWaterLevel - y) / 1.5;
                             const saturation = Math.min(1, depth + p.time);
                             voxelColor = lerpColor(COLORS.WATER_CLEAR, 0x0288D1, saturation);
                             includeVoxel = true;
                         }
                    }
                    else if (p.viewMode === 'EXTRACTION') {
                        if (z > 0) continue; // Cutaway view
                        
                        if (isBed) {
                             if (!isWet) {
                                  voxelColor = 0x424242;
                                  includeVoxel = true;
                             } else {
                                  // Extraction heatmap
                                  if (exposure < 0.3) voxelColor = lerpColor(COLORS.GROUNDS_WET, COLORS.CHEM_ACID, exposure * 3.3);
                                  else if (exposure < 0.6) voxelColor = lerpColor(COLORS.CHEM_ACID, COLORS.CHEM_SUGAR, (exposure - 0.3) * 3.3);
                                  else if (exposure < 0.9) voxelColor = lerpColor(COLORS.CHEM_SUGAR, COLORS.CHEM_TANNIN, (exposure - 0.6) * 3.3);
                                  else voxelColor = COLORS.CHEM_OVER;
                                  includeVoxel = true;
                             }
                        } else if (isWet) {
                             // Liquid color gets darker as it extracts
                             const extractionColor = lerpColor(COLORS.WATER_CLEAR, COLORS.CHEM_TANNIN, exposure * 0.4);
                             voxelColor = extractionColor;
                             if (Math.random() > 0.7) includeVoxel = true;
                        }
                    }
                    else if (p.viewMode === 'FLOW_VELOCITY') {
                        if (z > 0) continue; 

                        if (isWet) {
                            const dist = Math.sqrt(x*x + z*z) / r; 
                            // Center moves fastest, edges stick to wall
                            let velocity = (1.0 - dist) * flowRate * (1.0 + p.agitation);
                            
                            // Bed resistance
                            if (isBed) velocity *= 0.1;

                            voxelColor = lerpColor(COLORS.VELOCITY_LOW, COLORS.VELOCITY_HIGH, velocity * 4);
                            includeVoxel = true;

                            if (p.agitation > 0.6 && Math.random() > 0.95) {
                                voxelColor = COLORS.CHANNELING;
                            }
                        } else if (isBed) {
                            voxelColor = 0x222222;
                            includeVoxel = true;
                        }
                    }

                    if (includeVoxel) {
                        addPoint(points, x, y, z, voxelColor);
                    }
                }
            }
        }

        return points;
    }
};