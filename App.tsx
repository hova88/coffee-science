/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { PromptModal } from './components/PromptModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ParametricGenerators } from './utils/voxelGenerators';
import { AppState, SimulationParams, ViewMode, FlavorProfile } from './types';
import { GoogleGenAI } from '@google/genai';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState(0);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // --- SCIENTIFIC STATE ---
  const [simParams, setSimParams] = useState<SimulationParams>({
    grindSize: 0.5,    // Medium
    temperature: 0.6,  // ~92C
    ratio: 0.5,        // 1:15
    agitation: 0.3,    // Gentle pour
    time: 0.1,         // Start of brew
    shape: 'CONE',
    viewMode: 'REALITY'
  });

  // --- FLAVOR CALCULATION ENGINE ---
  const flavorProfile = useMemo<FlavorProfile>(() => {
      // 1. Calculate Extraction Potential based on Grind & Temp
      const surfaceArea = 1 + (1 - simParams.grindSize) * 2; // Finer = More Area
      const solvency = 0.8 + (simParams.temperature * 0.4); // Hotter = More Soluble
      const extractionRate = surfaceArea * solvency * (1 + simParams.agitation * 0.2);

      // 2. Calculate Total Extraction based on Time
      // Time is 0.0 - 1.0. Let's map to an extraction curve.
      // Curve: Acids extract fast, Sugars medium, Bitter slow.
      const t = simParams.time * extractionRate; 

      // Extraction Curves (0 to 1)
      const acidExtracted = Math.min(1, t * 4); // Fast
      const sugarExtracted = Math.max(0, Math.min(1, (t - 0.1) * 3)); // Delayed
      const bitterExtracted = Math.max(0, Math.min(1, (t - 0.4) * 2)); // Late

      // 3. Concentration (TDS) based on Ratio
      // Lower ratio (1:10) = Higher Concentration. 
      const concentrationFactor = 1.0 + (1.0 - simParams.ratio) * 0.5;

      const tds = (acidExtracted * 0.3 + sugarExtracted * 0.5 + bitterExtracted * 0.4) * concentrationFactor * 1.5;
      const yieldVal = tds * (15 + simParams.ratio * 5); // Rough EY calc

      return {
          acidity: acidExtracted * (1.0 - bitterExtracted * 0.5), // Masked by bitterness
          sweetness: sugarExtracted * (1.0 - bitterExtracted * 0.3),
          bitterness: bitterExtracted,
          body: (tds * 0.8) + (simParams.grindSize < 0.3 ? 0.2 : 0), // Fines add body
          clarity: 1.0 - (simParams.grindSize < 0.2 ? 0.4 : 0),
          extractionYield: yieldVal * 10, // Scale to %
          tds: tds
      };
  }, [simParams]);

  // --- INIT ENGINE ---
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create Engine
    const engine = new VoxelEngine(
        containerRef.current,
        (state) => setAppState(state),
        (count) => setVoxelCount(count)
    );
    engineRef.current = engine;

    // Welcome Delay
    setTimeout(() => setShowWelcome(false), 2500);

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.cleanup();
    };
  }, []);

  // --- GENERATION LOOP ---
  useEffect(() => {
      if (!engineRef.current) return;

      // Generate Point Cloud based on current scientific params
      const voxels = ParametricGenerators.V60Simulation(simParams);
      
      engineRef.current.transitionTo(voxels, true);

  }, [simParams]);

  // --- AI HANDLER ---
  const handleAIPrompt = async (prompt: string) => {
      // Logic to parse natural language into SimParams using Gemini would go here.
      // For now, we simulate a response.
      console.log("Analyzing prompt:", prompt);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Act as a coffee physics engine. 
        Convert this user request into a JSON object with these keys (values 0.0-1.0): 
        grindSize, temperature, ratio, agitation, time. 
        
        Request: "${prompt}"`,
      });

      try {
          const text = response.text || "{}";
          // Basic cleanup to find JSON block
          const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
          const params = JSON.parse(jsonStr);
          
          setSimParams(prev => ({
              ...prev,
              ...params
          }));
          setIsPromptOpen(false);
      } catch (e) {
          console.error("AI Parse Error", e);
      }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* 3D Viewport */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* UI Layer */}
      <UIOverlay 
        simParams={simParams}
        flavorProfile={flavorProfile}
        isGenerating={appState !== AppState.STABLE}
        onSimParamChange={(p) => setSimParams(prev => ({...prev, ...p}))}
        onAskAI={() => setIsPromptOpen(true)}
      />

      {/* Modals */}
      <PromptModal 
        isOpen={isPromptOpen}
        mode="create"
        onClose={() => setIsPromptOpen(false)}
        onSubmit={handleAIPrompt}
      />

      <WelcomeScreen visible={showWelcome} />
    </div>
  );
}