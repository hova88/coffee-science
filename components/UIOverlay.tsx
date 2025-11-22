/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AppState } from '../types';
import { ChevronRight, ChevronLeft, Play, Pause, MessageSquare, Zap, GraduationCap } from 'lucide-react';
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
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none flex flex-col justify-between text-slate-100">
      
      {/* --- Header --- */}
      <div className="pointer-events-auto flex justify-between items-start p-6 bg-gradient-to-b from-slate-900/80 to-transparent">
         <div>
             <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
                <GraduationCap className="text-amber-500" />
                Pour-Over <span className="text-amber-500">Lab</span>
             </h1>
             <div className="flex items-center gap-2 mt-1">
                 <div className="h-0.5 w-8 bg-amber-500"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interactive Point Cloud</span>
             </div>
         </div>

         <div className="flex gap-2">
            <button 
                onClick={onToggleRotation}
                className="p-2 bg-slate-800/50 backdrop-blur hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all"
            >
                {isAutoRotate ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
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
                      <h3 className="text-lg font-bold text-slate-100">Computing Physics...</h3>
                      <p className="text-slate-400 text-sm">Generating Point Cloud</p>
                  </div>
              </div>
          </div>
      )}

      {/* --- Bottom Info & Controls --- */}
      <div className="pointer-events-auto w-full bg-slate-900/90 border-t border-slate-800 p-6 md:p-8 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-8">
            
            {/* Text Content */}
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 text-amber-500 font-mono text-xs font-bold tracking-widest uppercase">
                    <span>Topic {currentChapterIndex + 1} // {chapters.length}</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {currentChapter.title}
                </h2>
                
                <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-3xl font-light">
                    {currentChapter.text}
                </p>

                <div className="flex gap-4 pt-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <span>Points: {voxelCount}</span>
                    <span>State: {appState}</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                <button
                    onClick={onAskAI}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white font-bold rounded-lg border border-indigo-500/30 transition-all text-sm"
                >
                    <MessageSquare size={16} />
                    <span>Ask AI Tutor</span>
                </button>

                <div className="flex gap-2">
                    <button 
                        onClick={onPrevChapter}
                        disabled={currentChapterIndex === 0}
                        className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg border border-slate-700 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={onNextChapter}
                        disabled={currentChapterIndex === chapters.length - 1}
                        className="flex-1 px-8 py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Next Step</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};