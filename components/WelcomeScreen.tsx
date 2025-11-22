/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface WelcomeScreenProps {
  visible: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible }) => {
  return (
    <div className={`
        absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-center z-50 select-none
        transition-all duration-700 ease-out transform font-sans bg-black/40 backdrop-blur-sm
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className="text-center flex flex-col items-center gap-6 p-12 rounded-3xl border border-amber-500/20 bg-slate-900/80 shadow-2xl max-w-2xl">
        <div>
            <h1 className="text-6xl font-black text-slate-100 tracking-tighter uppercase mb-2 drop-shadow-lg">
                Pour-Over
            </h1>
            <div className="text-2xl font-bold text-amber-500 uppercase tracking-[0.5em]">
                Visualization
            </div>
        </div>
        
        <div className="h-px w-24 bg-slate-700 my-2"></div>

        <div className="space-y-2">
            <p className="text-xl text-slate-300 font-light">Explore the physics of extraction</p>
            <p className="text-sm text-slate-500 font-mono uppercase tracking-widest">Powered by Gemini 3</p>
        </div>
      </div>
    </div>
  );
};