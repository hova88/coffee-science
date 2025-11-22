/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface WelcomeScreenProps {
  visible: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible }) => {
  const [logs, setLogs] = useState<string[]>([]);
  
  const systemLogs = [
      "INITIALIZING PHYSICS ENGINE...",
      "LOADING VOXEL MESH SHADERS...",
      "CALIBRATING FLUID DYNAMICS...",
      "LOADING GLB: CHEMEX_DRIP_BREWER...",
      "COMPILING FLAVOR ALGORITHMS...",
      "SYSTEM READY."
  ];

  useEffect(() => {
      if (!visible) return;
      let delay = 0;
      systemLogs.forEach((log, i) => {
          delay += (Math.random() * 400) + 100;
          setTimeout(() => {
              setLogs(prev => [...prev, log]);
          }, delay);
      });
  }, [visible]);

  return (
    <div className={`
        absolute top-0 left-0 w-full h-full flex justify-center items-center z-50 bg-black
        transition-opacity duration-500
        ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
    `}>
      <div className="font-mono text-xs text-green-500 w-80">
            <div className="mb-4 flex items-center gap-2 text-white font-bold">
                <Loader2 className="animate-spin" size={16} />
                <span>BOOTING LAB</span>
            </div>
            <div className="border-l-2 border-zinc-800 pl-4 space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-200">
                        <span className="text-zinc-600 mr-2">[{Math.random().toFixed(4)}]</span>
                        {log}
                    </div>
                ))}
            </div>
      </div>
    </div>
  );
};
