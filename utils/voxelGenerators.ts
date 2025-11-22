/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData } from '../types';
import { COLORS } from './voxelConstants';

// Helper to map voxels
function setBlock(map: Map<string, VoxelData>, x: number, y: number, z: number, color: number) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    map.set(key, { x: rx, y: ry, z: rz, color });
}

function drawCircle(map: Map<string, VoxelData>, y: number, radius: number, color: number, fill: boolean = false) {
    const r2 = radius * radius;
    for (let x = -Math.ceil(radius); x <= Math.ceil(radius); x++) {
        for (let z = -Math.ceil(radius); z <= Math.ceil(radius); z++) {
            const d2 = x*x + z*z;
            if (d2 <= r2 && (fill || d2 >= (radius-1)*(radius-1))) {
                setBlock(map, x, y, z, color);
            }
        }
    }
}

function drawCone(map: Map<string, VoxelData>, yStart: number, height: number, rStart: number, rEnd: number, color: number, fill: boolean = false) {
    for (let h = 0; h < height; h++) {
        const t = h / height;
        const r = rStart * (1-t) + rEnd * t;
        drawCircle(map, yStart + h, r, color, fill);
    }
}

export const Generators = {
    // 1. The Full Setup
    V60Setup: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        
        // Carafe (Glass)
        drawCone(map, -10, 8, 5, 2, COLORS.GLASS, false); 
        // Carafe Handle
        for(let y=-8; y<-4; y++) { setBlock(map, 6, y, 0, COLORS.STEEL); setBlock(map, 5, y, 0, COLORS.STEEL); }

        // Dripper (Ceramic)
        drawCone(map, -2, 6, 1.5, 6, COLORS.CERAMIC, false);
        // Rim
        drawCircle(map, 4, 6.2, COLORS.CERAMIC, false);
        
        // Filter (Paper) - visible at top
        drawCone(map, -1.5, 6, 1.4, 5.8, COLORS.PAPER, false);

        // Coffee Bed inside
        drawCone(map, -1, 3, 1.2, 3.5, COLORS.COFFEE_DARK, true);

        return Array.from(map.values());
    },

    // 2. Equipment Showcase (Kettle, Scale)
    Equipment: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        
        // Scale (Base)
        for(let x=-6; x<=6; x++) for(let z=-6; z<=6; z++) setBlock(map, x, -10, z, COLORS.STEEL);
        // Scale (Display)
        for(let x=-2; x<=2; x++) setBlock(map, x, -10, 6, COLORS.HIGHLIGHT);

        // Kettle Base
        const kX = 0;
        drawCone(map, -9, 6, 5, 4, COLORS.STEEL, false);
        // Lid
        drawCircle(map, -3, 4, COLORS.STEEL, true);
        // Gooseneck Spout
        for(let i=0; i<10; i++) {
            const t = i/10;
            const y = -8 + t * 8;
            const x = 5 + Math.sin(t * Math.PI) * 4;
            setBlock(map, x, y, 0, COLORS.STEEL);
        }
        setBlock(map, 9, 0, 0, COLORS.STEEL); // Tip

        return Array.from(map.values());
    },

    // 3. The Grind (Magnified View)
    GrindSize: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        
        // Label: Fine (Left)
        for(let x=-12; x<-4; x+=0.5) for(let z=-4; z<4; z+=0.5) for(let y=-5; y<0; y+=0.5) {
            if(Math.random() > 0.3) setBlock(map, x, y, z, COLORS.COFFEE_DARK);
        }

        // Label: Medium (Center) - Ideal
        for(let x=-2; x<2; x+=1.2) for(let z=-4; z<4; z+=1.2) for(let y=-5; y<2; y+=1.2) {
            // Clumps
            setBlock(map, x, y, z, COLORS.COFFEE_MED);
            setBlock(map, x+0.5, y, z, COLORS.COFFEE_MED);
            setBlock(map, x, y+0.5, z, COLORS.COFFEE_MED);
        }
        
        // Label: Coarse (Right)
        for(let x=6; x<14; x+=2) for(let z=-4; z<4; z+=2) for(let y=-5; y<0; y+=2) {
             // Big chunks
            for(let dx=0; dx<1.5; dx+=0.5) for(let dy=0; dy<1.5; dy+=0.5) for(let dz=0; dz<1.5; dz+=0.5)
                setBlock(map, x+dx, y+dy, z+dz, COLORS.COFFEE_LIGHT);
        }

        return Array.from(map.values());
    },

    // 4. The Bloom (Chemistry)
    BloomPhase: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        
        // Bed
        drawCone(map, -5, 5, 2, 6, COLORS.COFFEE_DARK, true);
        
        // Water hitting top
        drawCircle(map, 0, 5, COLORS.WATER_DEEP, true);
        
        // Bubbles (CO2) rising
        for(let i=0; i<50; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            const y = Math.random() * 8 + 1;
            setBlock(map, x, y, z, COLORS.GAS);
        }

        return Array.from(map.values());
    },

    // 5. Spiral Pour (Technique)
    SpiralPour: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();

        // Filter Outline
        drawCone(map, -5, 8, 2, 7, COLORS.PAPER, false);

        // Water Stream (Spiral)
        let theta = 0;
        for (let y = -2; y < 10; y += 0.2) {
            const r = y * 0.4; // Expanding spiral
            theta += 0.5;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            setBlock(map, x, y, z, COLORS.WATER_DEEP);
            // Add thickness
            setBlock(map, x, y-0.5, z, COLORS.WATER_DEEP);
        }
        
        // Kettle Tip
        setBlock(map, 0, 12, 0, COLORS.STEEL);
        
        return Array.from(map.values());
    }
};