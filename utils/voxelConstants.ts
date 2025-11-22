/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const COLORS = {
  COFFEE_DARK: 0x3e2723,  // Dark roast / Wet grounds
  COFFEE_DRY: 0x6d4c41,   // Dry grounds
  COFFEE_LIGHT: 0x8d6e63, // Light roast / Chaff
  WATER_STREAM: 0x29b6f6, // Pouring water
  WATER_POOL: 0x0288d1,   // Water in bed
  STEAM: 0xe1f5fe,        // Steam / Aroma
  FILTER: 0xffecb3,       // Paper filter
  CERAMIC: 0xffffff,      // V60 / Cup
  GLASS: 0x90a4ae,        // Carafe (abstract)
  STEEL: 0xb0bec5,        // Kettle
  GAS: 0xffeb3b,          // CO2 Bubbles
  ERROR: 0xf44336,        // Bad extraction
  OK: 0x4caf50            // Good extraction
};

export const CONFIG = {
  // Make voxels small and separated to create a "Point Cloud" aesthetic
  VOXEL_SIZE: 0.15, 
  GRID_SIZE: 0.4, // Spacing between points
  FLOOR_Y: -10,
  BG_COLOR: 0x0f172a, // Deep scientific blue-black
};