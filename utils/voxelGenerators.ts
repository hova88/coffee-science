/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData } from '../types';
import { COLORS, CONFIG } from './voxelConstants';

// Helper to add a point (abstracted as setBlock for compatibility)
function addPoint(list: VoxelData[], x: number, y: number, z: number, color: number) {
    // Add some jitter for organic point cloud feel
    const jitter = 0.05;
    const jx = (Math.random() - 0.5) * jitter;
    const jy = (Math.random() - 0.5) * jitter;
    const jz = (Math.random() - 0.5) * jitter;
    list.push({ x: x + jx, y: y + jy, z: z + jz, color });
}

// Geometry Helpers
function cylinder(list: VoxelData[], yBottom: number, height: number, radius: number, color: number, density: number = 1) {
    for (let y = yBottom; y < yBottom + height; y += CONFIG.GRID_SIZE) {
        for (let x = -radius; x <= radius; x += CONFIG.GRID_SIZE) {
            for (let z = -radius; z <= radius; z += CONFIG.GRID_SIZE) {
                if (x*x + z*z <= radius*radius) {
                    if (Math.random() < density) addPoint(list, x, y, z, color);
                }
            }
        }
    }
}

function hollowCone(list: VoxelData[], yBottom: number, height: number, rBottom: number, rTop: number, color: number) {
    const steps = height / (CONFIG.GRID_SIZE * 0.8);
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const y = yBottom + i * CONFIG.GRID_SIZE * 0.8;
        const r = rBottom * (1 - t) + rTop * t;
        
        const circumference = 2 * Math.PI * r;
        const points = Math.floor(circumference / (CONFIG.GRID_SIZE * 0.5));
        
        for (let j = 0; j < points; j++) {
            const theta = (j / points) * Math.PI * 2;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            addPoint(list, x, y, z, color);
        }
    }
}

export const Generators = {
    // 1. Intro / Setup
    V60Setup: (): VoxelData[] => {
        const points: VoxelData[] = [];
        
        // The Cup/Carafe
        cylinder(points, -8, 4, 3, COLORS.GLASS, 0.3);
        
        // The V60 Cone
        hollowCone(points, -3, 5, 1, 4.5, COLORS.CERAMIC);
        
        // The Filter Paper (Slightly inside)
        hollowCone(points, -2.8, 5.2, 0.8, 4.3, COLORS.FILTER);
        
        // Coffee Bed (Dry)
        cylinder(points, -2.5, 2, 1.5, COLORS.COFFEE_DRY, 0.8);

        return points;
    },

    // 2. Equipment
    Equipment: (): VoxelData[] => {
        const points: VoxelData[] = [];

        // Digital Scale
        for(let x=-5; x<=5; x+=CONFIG.GRID_SIZE) 
            for(let z=-5; z<=5; z+=CONFIG.GRID_SIZE) 
                addPoint(points, x, -6, z, COLORS.STEEL);
        
        // Display on Scale
        for(let x=-1; x<=1; x+=0.2) addPoint(points, x, -6, 4, COLORS.GAS);

        // Kettle Outline (Gooseneck)
        const kettleBaseY = -4;
        cylinder(points, kettleBaseY, 4, 3, COLORS.STEEL, 0.2);
        
        // Spout
        for(let t=0; t<=1; t+=0.02) {
            const x = 3 + Math.sin(t * Math.PI) * 4;
            const y = kettleBaseY + t * 5;
            const z = 0;
            addPoint(points, x, y, z, COLORS.STEEL);
            addPoint(points, x, y+0.2, z, COLORS.STEEL); // thickness
        }
        
        return points;
    },

    // 3. Grind Size Comparison
    GrindSize: (): VoxelData[] => {
        const points: VoxelData[] = [];

        // Helper for a pile
        const makePile = (offsetX: number, spread: number, color: number, labelColor: number) => {
            // Label/Indicator
            addPoint(points, offsetX, 2, 0, labelColor);
            
            for(let i=0; i<400; i++) {
                // Cone distribution
                const r = Math.random() * 2.5;
                const theta = Math.random() * Math.PI * 2;
                const y = (2.5 - r) * (Math.random() * 0.5 + 0.5); // Peak at center
                
                // Spacing based on "spread" (coarseness)
                const x = offsetX + Math.cos(theta) * r;
                const z = Math.sin(theta) * r;
                
                // Only add if it aligns with a "grid" defined by spread to simulate particle size
                // We simulate this by quantizing coordinates roughly
                const q = spread;
                const qx = Math.round(x/q)*q;
                const qy = Math.round(y/q)*q;
                const qz = Math.round(z/q)*q;
                
                addPoint(points, qx, qy - 4, qz, color);
            }
        };

        makePile(-6, 0.2, COLORS.COFFEE_DRY, COLORS.ERROR); // Fine (Dense)
        makePile(0, 0.5, COLORS.COFFEE_DRY, COLORS.OK);    // Medium (Goldilocks)
        makePile(6, 0.9, COLORS.COFFEE_LIGHT, COLORS.ERROR); // Coarse (Loose)

        return points;
    },

    // 4. Bloom
    BloomPhase: (): VoxelData[] => {
        const points: VoxelData[] = [];

        // Saturated Bed
        cylinder(points, -4, 3, 2.5, COLORS.COFFEE_DARK, 0.9);
        
        // Rising CO2 Bubbles
        for(let i=0; i<150; i++) {
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * 2;
            const y = -1 + Math.random() * 5; // Rising up
            addPoint(points, Math.cos(theta)*r, y, Math.sin(theta)*r, COLORS.GAS);
        }
        
        // Water layer on top
        for(let i=0; i<100; i++) {
             const theta = Math.random() * Math.PI * 2;
             const r = Math.random() * 2.2;
             addPoint(points, Math.cos(theta)*r, -0.8, Math.sin(theta)*r, COLORS.WATER_POOL);
        }

        return points;
    },

    // 5. Spiral Pour
    SpiralPour: (): VoxelData[] => {
        const points: VoxelData[] = [];

        // Filter Shape
        hollowCone(points, -4, 6, 1, 5, COLORS.FILTER);

        // Coffee Slurry
        cylinder(points, -3.5, 3, 3, COLORS.COFFEE_DARK, 0.5);

        // The Water Spiral path
        let angle = 0;
        const height = 8; // Spout height
        
        // Draw the stream from kettle to bed
        for(let y=0; y<height; y+=0.1) {
            addPoint(points, 0.5, y, 0.5, COLORS.WATER_STREAM);
        }

        // Draw the spiral pattern on the bed surface
        for(let t=0; t<20; t+=0.1) {
            const r = t * 0.15; // Spiral out
            const theta = t;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            
            // Water impact points
            addPoint(points, x, 0, z, COLORS.WATER_STREAM);
            
            // Agitation (particles moving away)
            addPoint(points, x + (Math.random()-0.5), -0.5, z + (Math.random()-0.5), COLORS.COFFEE_LIGHT);
        }

        return points;
    }
};