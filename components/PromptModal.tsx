/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Search } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  mode: 'create' | 'morph'; // Kept for interface compatibility but mostly unused in new flow
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      await onSubmit(prompt);
      setPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-slate-700 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-900/50 text-indigo-400">
                <Search size={20} strokeWidth={2.5} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-100">
                    Ask the AI Tutor
                </h2>
                <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide">
                    Generate a 3D Explanation
                </p>
            </div>
          </div>
          <button 
            onClick={!isLoading ? onClose : undefined}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Show me what happens during 'channeling'..." 
              disabled={isLoading}
              className="w-full h-32 resize-none bg-slate-950 border border-slate-700 rounded-xl p-4 font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 mb-4"
              autoFocus
            />

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all
                  ${isLoading 
                    ? 'bg-slate-800 text-slate-500 cursor-wait' 
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing Physics...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} fill="currentColor" />
                    Visualize Concept
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};