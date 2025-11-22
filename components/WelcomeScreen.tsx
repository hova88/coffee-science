/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { GraduationCap } from 'lucide-react';

interface WelcomeScreenProps {
  visible: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible }) => {
  return (
    <div className={`
        absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-center z-50 select-none
        transition-all duration-1000 ease-out transform font-sans bg-slate-950/80 backdrop-blur-sm
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none scale-105'}
    `}>
      <div className="text-center flex flex-col items-center gap-6 p-16 rounded-3xl border border-amber-500/20 bg-slate-900 shadow-2xl max-w-3xl">
        <GraduationCap size={64} className="text-amber-500 mb-4" />
        <div>
            <h1 className="text-6xl font-black text-slate-100 tracking-tighter uppercase mb-4 drop-shadow-lg">
                Pour-Over <span className="text-amber-500">Lab</span>
            </h1>
            <div className="text-xl font-medium text-slate-400 tracking-widest uppercase">
                The Physics of Extraction
            </div>
        </div>
        
        <div className="h-px w-24 bg-slate-700 my-4"></div>

        <div className="space-y-2 text-slate-400">
            <p>Loading 3D Physics Engine...</p>
        </div>
      </div>
    </div>
  );
};