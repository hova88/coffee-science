/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AppState } from '../types';
import { ChevronRight, ChevronLeft, Play, Pause, Info, MessageSquare, Zap } from 'lucide-react';
import { CoffeeChapter } from '../App';

interface UIOverlayProps {
  voxelCount: number;
  appState: AppState;
  currentChapterIndex: number;
  chapters: CoffeeChapter[];
  isAutoRotate: boolean;
  isGenerating: boolean;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  onToggleRotation: () => void;
  onAskAI: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  appState,
  currentChapterIndex,
  chapters,
  isAutoRotate,
  isGenerating,
  onNextChapter,
  onPrevChapter,
  onToggleRotation,
  onAskAI
}) => {
  const currentChapter = chapters[currentChapterIndex];

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none flex flex-col justify-between">
      
      {/* --- Header --- */}
      <div className="pointer-events-auto flex justify-between items-start p-6">
         <div>
             <h1 className="text-3xl font-black text-slate-100 tracking-tighter uppercase drop-shadow-md">
                Pour-Over <span className="text-amber-500">Science</span>
             </h1>
             <div className="flex items-center gap-2 mt-1">
                 <div className="h-1 w-12 bg-amber-500 rounded-full"></div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interactive Visualizer</span>
             </div>
         </div>

         <div className="flex gap-2">
            <button 
                onClick={onToggleRotation}
                className="p-3 bg-slate-800/50 backdrop-blur hover:bg-slate-700 text-slate-200 rounded-full border border-slate-700 transition-all"
            >
                {isAutoRotate ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
         </div>
      </div>

      {/* --- Center Loading --- */}
      {isGenerating && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
              <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                  <div className="animate-spin text-amber-500">
                    <Zap size={32} />
                  </div>
                  <div className="text-center">
                      <h3 className="text-lg font-bold text-slate-100">AI is Brewing...</h3>
                      <p className="text-slate-400 text-sm">Analyzing coffee physics</p>
                  </div>
              </div>
          </div>
      )}

      {/* --- Bottom Info & Controls --- */}
      <div className="pointer-events-auto w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-end gap-8">
            
            {/* Text Content */}
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 text-amber-400 font-mono text-xs font-bold tracking-widest uppercase">
                    <span>Chapter {currentChapterIndex + 1}/{chapters.length}</span>
                    <div className="flex-1 h-px bg-amber-500/30"></div>
                </div>
                
                <h2 className="text-4xl font-bold text-white leading-tight">
                    {currentChapter.title}
                </h2>
                
                <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-2xl">
                    {currentChapter.text}
                </p>

                <div className="flex gap-2 pt-2">
                    <span className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">
                        VOXELS: {voxelCount}
                    </span>
                    <span className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">
                         {appState}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3 shrink-0">
                <button
                    onClick={onAskAI}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transition-all border border-indigo-400"
                >
                    <MessageSquare size={20} />
                    <span>Ask AI Tutor</span>
                </button>

                <div className="flex gap-2">
                    <button 
                        onClick={onPrevChapter}
                        disabled={currentChapterIndex === 0}
                        className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 text-white rounded-xl border border-slate-600 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={onNextChapter}
                        disabled={currentChapterIndex === chapters.length - 1}
                        className="flex-1 px-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Next Topic</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};