/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { PromptModal } from './components/PromptModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Generators } from './utils/voxelGenerators';
import { AppState, VoxelData } from './types';
import { GoogleGenAI, Type } from "@google/genai";

export interface CoffeeChapter {
    id: string;
    title: string;
    text: string;
    generator: keyof typeof Generators | 'AI';
    data?: VoxelData[];
}

const CHAPTERS: CoffeeChapter[] = [
  {
    id: 'intro',
    title: 'The Pour-Over Method',
    text: "Pour-over coffee is a precise, manual brewing method. By hand-pouring water over grounds in a filter, you extract distinctive flavors and aromas directly into your carafe. It offers ultimate control over the brewing process.",
    generator: 'V60Setup'
  },
  {
    id: 'equipment',
    title: 'Essential Equipment',
    text: "Precision requires the right tools. A conical brewer (like a V60) allows for continuous flow. A gooseneck kettle provides pouring control. A scale ensures the perfect 1:16 ratio. And most importantly, a burr grinder.",
    generator: 'Equipment'
  },
  {
    id: 'grind',
    title: 'Grind Size Matters',
    text: "Medium grind is the sweet spot. Too fine (left) restricts flow, causing bitterness (over-extraction). Too coarse (right) flows too fast, leading to sour, watery coffee (under-extraction).",
    generator: 'GrindSize'
  },
  {
    id: 'bloom',
    title: 'The Bloom Phase',
    text: "The first pour (2x coffee weight) causes the 'Bloom'. Hot water releases trapped CO2 gas from the beans (shown here as bubbles). This degassing ensures even extraction in subsequent pours.",
    generator: 'BloomPhase'
  },
  {
    id: 'pour',
    title: 'Spiral Pouring',
    text: "Pouring in a slow, steady spiral ensures all grounds are saturated evenly. This prevents 'channeling'—where water finds the path of least resistance—and promotes a consistent, flavorful extraction.",
    generator: 'SpiralPour'
  }
];

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState<number>(0);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  // Custom AI Chapter state
  const [aiChapter, setAiChapter] = useState<CoffeeChapter | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setAppState(newState),
      (count) => setVoxelCount(count)
    );
    engineRef.current = engine;

    // Initial Load
    loadChapter(0);

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => setShowWelcome(false), 3000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      engine.cleanup();
    };
  }, []);

  const loadChapter = (index: number) => {
      if (!engineRef.current) return;
      
      const chapter = (index === -1 && aiChapter) ? aiChapter : CHAPTERS[index];
      
      if (chapter.generator !== 'AI') {
          // @ts-ignore
          const genFunc = Generators[chapter.generator];
          if (genFunc) {
              engineRef.current.transitionTo(genFunc());
          }
      } else if (aiChapter && aiChapter.data) {
          // It's an AI chapter with data already loaded in the chapter object (we hack this slightly)
           // @ts-ignore
          engineRef.current.transitionTo(aiChapter.data);
      }
      
      setCurrentChapterIndex(index);
  };

  const handleNext = () => {
      const next = Math.min(currentChapterIndex + 1, CHAPTERS.length - 1);
      if (next !== currentChapterIndex) loadChapter(next);
  };

  const handlePrev = () => {
      const prev = Math.max(currentChapterIndex - 1, 0);
      if (prev !== currentChapterIndex) loadChapter(prev);
  };

  const handleAskAI = async (prompt: string) => {
    if (!process.env.API_KEY) return;

    setIsGenerating(true);
    setIsPromptModalOpen(false);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-pro-preview';
        
        const systemContext = `
            CONTEXT: You are a Scientific Data Visualizer expert in COFFEE PHYSICS.
            Your goal is to explain a concept using a 3D voxel visualization.
            
            COLORS TO USE:
            - COFFEE GROUNDS: #3e2723 (Dark), #5d4037 (Med)
            - WATER: #4fc3f7 (Blue)
            - FILTER: #fff8e1 (Cream)
            - EQUIPMENT: #90a4ae (Steel), #ffffff (Ceramic)
            
            OUTPUT:
            Return a JSON object with:
            1. "text": A concise, scientific explanation (max 2 sentences).
            2. "voxels": An array of {x,y,z,color} objects representing the scene.
            
            SCENE CONSTRAINTS:
            - Center at 0,0,0.
            - Max 800 voxels.
            - Use abstract point-cloud style if complex.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: `${systemContext}\n\nUSER QUERY: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        voxels: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    x: { type: Type.INTEGER },
                                    y: { type: Type.INTEGER },
                                    z: { type: Type.INTEGER },
                                    color: { type: Type.STRING }
                                },
                                required: ["x", "y", "z", "color"]
                            }
                        }
                    },
                    required: ["text", "voxels"]
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            
            const voxelData: VoxelData[] = data.voxels.map((v: any) => {
                let colorStr = v.color;
                if (colorStr.startsWith('#')) colorStr = colorStr.substring(1);
                const colorInt = parseInt(colorStr, 16);
                return {
                    x: v.x, y: v.y, z: v.z,
                    color: isNaN(colorInt) ? 0xCCCCCC : colorInt
                };
            });

            const newChapter: CoffeeChapter = {
                id: 'ai-generated',
                title: `AI Analysis: ${prompt}`,
                text: data.text,
                generator: 'AI',
                data: voxelData
            };

            setAiChapter(newChapter);
            // We use -1 to denote custom AI chapter
            // We need to hack the list or just handle it in render
            // For simplicity, let's just load it immediately
            if (engineRef.current) {
                engineRef.current.transitionTo(voxelData);
            }
            // Force update UI to show this 'special' chapter state if we wanted, 
            // but simple way is to just show it and deselect the index
            setCurrentChapterIndex(-1); 
        }
    } catch (err) {
        console.error("AI Generation failed", err);
        alert("The AI barista spilled the coffee. Try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  // Display logic helper
  const activeChapter = currentChapterIndex === -1 && aiChapter ? aiChapter : CHAPTERS[currentChapterIndex];
  // If activeChapter is somehow null (shouldn't be), fallback
  const safeChapter = activeChapter || CHAPTERS[0];
  // We mock the array for the UI component if we are in AI mode
  const effectiveChapters = currentChapterIndex === -1 && aiChapter 
    ? [...CHAPTERS, aiChapter] 
    : CHAPTERS;
  const effectiveIndex = currentChapterIndex === -1 ? CHAPTERS.length : currentChapterIndex;

  return (
    <div className="relative w-full h-screen bg-[#1a1a1a] overflow-hidden font-sans">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      <UIOverlay 
        voxelCount={voxelCount}
        appState={appState}
        currentChapterIndex={effectiveIndex}
        chapters={effectiveChapters}
        isAutoRotate={isAutoRotate}
        isGenerating={isGenerating}
        onNextChapter={() => {
            if (currentChapterIndex === -1) loadChapter(0); // Reset from AI
            else handleNext();
        }}
        onPrevChapter={() => {
            if (currentChapterIndex === -1) loadChapter(CHAPTERS.length - 1);
            else handlePrev();
        }}
        onToggleRotation={() => {
            setIsAutoRotate(!isAutoRotate);
            engineRef.current?.setAutoRotate(!isAutoRotate);
        }}
        onAskAI={() => setIsPromptModalOpen(true)}
      />

      <WelcomeScreen visible={showWelcome} />

      <PromptModal
        isOpen={isPromptModalOpen}
        mode="create"
        onClose={() => setIsPromptModalOpen(false)}
        onSubmit={handleAskAI}
      />
    </div>
  );
};

export default App;