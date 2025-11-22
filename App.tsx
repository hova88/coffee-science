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

// Content derived from the provided "About Coffee" PDF
const CHAPTERS: CoffeeChapter[] = [
  {
    id: 'intro',
    title: 'What is Pour-Over?',
    text: "It is a straightforward manual method: you hand-pour water over coffee grounds in a filter. This extracts flavors as it passes through into a carafe. It offers control over the brewing process and brings out distinctive flavors, especially for single-origin beans.",
    generator: 'V60Setup'
  },
  {
    id: 'equipment',
    title: 'Essential Equipment',
    text: "Precision is key. You need a Brewer (conical or flat), Filters (paper/metal/cloth), a Kettle (gooseneck for control), a Scale for ratio accuracy (1:16), and a Burr Grinder for consistent particle size.",
    generator: 'Equipment'
  },
  {
    id: 'grind',
    title: 'Grind Size & Taste',
    text: "Medium grind is ideal (center). If too fine (left), coffee tastes bitter/over-extracted. If too coarse (right), it tastes sour/under-extracted. Burr grinders preserve oils better than blade grinders.",
    generator: 'GrindSize'
  },
  {
    id: 'bloom',
    title: 'The Bloom Phase',
    text: "Pouring double the weight of coffee in water causes a 'Bloom'. You will see bubbles as CO2 gas escapes from the beans. This degassing is crucial for allowing water to saturate the grounds evenly for the main brew.",
    generator: 'BloomPhase'
  },
  {
    id: 'pour',
    title: 'Pulse Pouring & Agitation',
    text: "Pour slowly in a spiral starting from the center. 'Pulse pouring' (multiple pours) prevents channeling. 'Agitation' (gentle stirring) ensures all grounds contact water. Total brew time should be 2-4 minutes.",
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

  const [aiChapter, setAiChapter] = useState<CoffeeChapter | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setAppState(newState),
      (count) => setVoxelCount(count)
    );
    engineRef.current = engine;

    loadChapter(0);

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => setShowWelcome(false), 4000);

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
            Your goal is to explain a concept using a 3D Point Cloud visualization.
            
            COLORS (Hex Integers):
            - GROUNDS: 0x3e2723
            - WATER: 0x29b6f6
            - GAS/ENERGY: 0xffeb3b
            - FILTER: 0xffecb3
            
            OUTPUT:
            Return a JSON object with:
            1. "text": A concise, scientific explanation (max 2 sentences).
            2. "voxels": An array of {x,y,z,color} objects.
            
            SCENE CONSTRAINTS:
            - Center at 0,0,0.
            - Max 1200 points (for performance).
            - Use float coordinates for organic point cloud look.
            - Visualize abstract concepts like 'Turbulence', 'Extraction', 'Heat'.
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
                                    x: { type: Type.NUMBER },
                                    y: { type: Type.NUMBER },
                                    z: { type: Type.NUMBER },
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
                if (typeof colorStr === 'string' && colorStr.startsWith('#')) colorStr = colorStr.substring(1);
                const colorInt = parseInt(colorStr, 16);
                return {
                    x: v.x, y: v.y, z: v.z,
                    color: isNaN(colorInt) ? 0xFFFFFF : colorInt
                };
            });

            const newChapter: CoffeeChapter = {
                id: 'ai-generated',
                title: `Analysis: ${prompt}`,
                text: data.text,
                generator: 'AI',
                data: voxelData
            };

            setAiChapter(newChapter);
            if (engineRef.current) {
                engineRef.current.transitionTo(voxelData);
            }
            setCurrentChapterIndex(-1); 
        }
    } catch (err) {
        console.error("AI Generation failed", err);
        alert("Physics simulation failed. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const effectiveChapters = currentChapterIndex === -1 && aiChapter 
    ? [...CHAPTERS, aiChapter] 
    : CHAPTERS;
  const effectiveIndex = currentChapterIndex === -1 ? CHAPTERS.length : currentChapterIndex;

  return (
    <div className="relative w-full h-screen bg-[#0f172a] overflow-hidden font-sans">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      <UIOverlay 
        voxelCount={voxelCount}
        appState={appState}
        currentChapterIndex={effectiveIndex}
        chapters={effectiveChapters}
        isAutoRotate={isAutoRotate}
        isGenerating={isGenerating}
        onNextChapter={() => {
            if (currentChapterIndex === -1) loadChapter(0); 
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