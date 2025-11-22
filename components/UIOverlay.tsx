
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { SimulationParams, ViewMode, FlavorProfile } from '../types';
import { Sparkles, Droplets, Layers, Wind, X, Info, Scale, Thermometer, Waves, Move3d, ArrowRight } from 'lucide-react';

interface UIOverlayProps {
  simParams: SimulationParams;
  flavorProfile: FlavorProfile;
  isGenerating: boolean;
  onSimParamChange: (params: Partial<SimulationParams>) => void;
  onAskAI: () => void;
}

// --- 3B1B VISUALIZERS ---

const SineWaveVisualizer: React.FC<{ amplitude: number }> = ({ amplitude }) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
        const x = i;
        const freq = 0.5 + (amplitude * 0.5); 
        const y = 25 + Math.sin(i * 0.2 * freq + Date.now() * 0.005) * (amplitude * 20);
        points.push(`${x},${y}`);
    }
    const pathD = `M ${points.join(' L ')}`;

    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = requestAnimationFrame(() => setTick(t => t + 1));
        return () => cancelAnimationFrame(timer);
    });

    return (
        <div className="h-12 w-full overflow-hidden border-b border-white/10 mb-4">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                <path d={pathD} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};

const ParticleSizeVisualizer: React.FC<{ size: number }> = ({ size }) => {
    const radius = 2 + (size * 8); 
    return (
        <div className="h-12 w-full overflow-hidden border-b border-white/10 mb-4 flex items-center justify-center gap-2">
            {[1,2,3,4].map(i => (
                <div key={i} 
                    className="rounded-full bg-white/70 transition-all duration-300"
                    style={{ width: radius * 2, height: radius * 2, opacity: 1 - (i*0.15) }}
                />
            ))}
        </div>
    );
}

const GradientVisualizer: React.FC<{ value: number, type: 'TEMP' | 'RATIO' }> = ({ value, type }) => {
    return (
        <div className="h-12 w-full mb-4 flex flex-col justify-center">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                <div 
                    className="absolute top-0 h-full w-2 bg-white shadow-[0_0_10px_white] transition-all duration-300"
                    style={{ left: `${value * 100}%` }}
                />
                {type === 'TEMP' && (
                     <div className="w-full h-full bg-gradient-to-r from-blue-400 via-yellow-200 to-red-500 opacity-50" />
                )}
                {type === 'RATIO' && (
                     <div className="w-full h-full bg-gradient-to-r from-amber-900 to-blue-200 opacity-50" />
                )}
            </div>
            <div className="flex justify-between text-[10px] text-white/40 mt-2 font-mono">
                <span>{type === 'TEMP' ? '80°C' : '1:10 (Strong)'}</span>
                <span>{type === 'TEMP' ? '100°C' : '1:20 (Weak)'}</span>
            </div>
        </div>
    )
}

// --- TASTE FEEDBACK COMPONENTS ---

const TasteTrend: React.FC<{ label: string, value: string, impact: 'positive' | 'negative' | 'neutral' }> = ({ label, value, impact }) => (
    <div className="flex items-start gap-2 mt-2 text-xs font-mono animate-in fade-in duration-300">
        <ArrowRight size={12} className="mt-0.5 opacity-50" />
        <div>
            <span className="text-gray-400 mr-1">{label}:</span>
            <span className={`font-medium ${
                impact === 'positive' ? 'text-green-300' : 
                impact === 'negative' ? 'text-red-300' : 'text-amber-200'
            }`}>
                {value}
            </span>
        </div>
    </div>
);

// --- MAIN COMPONENTS ---

const SidePanel: React.FC<{
  title: string;
  subtitle: string;
  description: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, subtitle, description, children, onClose }) => (
  <div className="absolute top-0 right-0 h-full w-80 md:w-96 z-50 glass-panel border-l border-white/10 slide-in-right flex flex-col pointer-events-auto shadow-2xl">
     
     {/* Header */}
     <div className="p-8 border-b border-white/5 flex justify-between items-start bg-black/20">
         <div>
             <h2 className="text-3xl font-thin text-white tracking-tighter">{title}</h2>
             <p className="text-xs font-medium text-amber-400/80 uppercase tracking-widest mt-1">{subtitle}</p>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
             <X size={20} strokeWidth={1} />
         </button>
     </div>

     {/* Content */}
     <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
         <div className="text-sm text-gray-400 leading-7 mb-8 font-light space-y-4 border-b border-white/5 pb-6">
             {description}
         </div>
         {children}
     </div>
  </div>
);

// Minimalist Focus Point
const SpatialFocusPoint: React.FC<{
  label: string;
  className: string;
  onClick: () => void;
}> = ({ label, className, onClick }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`absolute group flex items-center justify-center w-12 h-12 transition-all duration-500 pointer-events-auto ${className}`}
    >
        {/* The Dot */}
        <div className="relative flex items-center justify-center w-4 h-4 cursor-pointer">
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_white] z-10" />
            <div className="absolute w-full h-full rounded-full border border-white/20 scale-0 group-hover:scale-100 transition-transform duration-500" />
            <div className="absolute w-full h-full rounded-full border border-white/10 animate-ping opacity-20" />
        </div>

        {/* The Reveal Label */}
        <div className="absolute left-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0 pointer-events-none">
            <span className="text-[10px] font-medium tracking-[0.2em] text-white/80 uppercase whitespace-nowrap bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                {label}
            </span>
        </div>
    </button>
);

export const UIOverlay: React.FC<UIOverlayProps> = ({
  simParams,
  flavorProfile,
  onSimParamChange,
  onAskAI
}) => {
  const [activeModule, setActiveModule] = useState<'GRIND' | 'WATER' | 'POUR' | null>(null);

  // Helper for flavor feedback
  const getGrindFeedback = (val: number) => {
      if (val < 0.2) return { text: "High risk of clogging & bitterness", impact: 'negative' };
      if (val < 0.4) return { text: "High body, slower drawdown", impact: 'neutral' };
      if (val > 0.8) return { text: "Watery body, highlights acidity", impact: 'neutral' };
      if (val > 0.9) return { text: "Under-extracted, sour finish", impact: 'negative' };
      return { text: "Balanced extraction & clarity", impact: 'positive' };
  };

  const getTempFeedback = (val: number) => {
      if (val < 0.2) return { text: "Low acidity extraction, tea-like", impact: 'neutral' };
      if (val > 0.9) return { text: "Maximum extraction, potential bitterness", impact: 'negative' };
      return { text: "Optimal for complex aromatics", impact: 'positive' };
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans text-gray-100">
      
      {/* NOTE: We removed the blocking backdrop to allow 3D rotation while panel is open */}

      {/* 1. Branding */}
      <div className="absolute top-8 left-8 pointer-events-auto flex flex-col gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <h1 className="text-sm tracking-[0.2em] font-semibold text-white">POUR OVER</h1>
          <p className="text-[10px] text-gray-500 tracking-widest">VISUAL GUIDE</p>
      </div>

      {/* 2. SPATIAL INTERACTION LAYER */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${activeModule ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Top: The Water */}
            <SpatialFocusPoint 
                label="The Water" 
                className="top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2"
                onClick={() => setActiveModule('WATER')}
            />

            {/* Left: The Grind */}
            <SpatialFocusPoint 
                label="The Grind" 
                className="bottom-[35%] left-[25%]"
                onClick={() => setActiveModule('GRIND')}
            />

            {/* Right: The Pour */}
            <SpatialFocusPoint 
                label="The Pour" 
                className="bottom-[35%] right-[25%]"
                onClick={() => setActiveModule('POUR')}
            />
      </div>

      {/* 3. SIDE PANELS (Content updated from PDF) */}
      {activeModule === 'GRIND' && (
        <SidePanel 
            title="The Grind"
            subtitle="Surface Area & Extraction"
            description={
                <>
                    <p>The size of your grind dictates how water flows through the bed. It is the primary variable for resistance.</p>
                    <p><strong className="text-white">Impact on Taste:</strong> Finer grinds expose more surface area, increasing extraction speed but risking bitterness.</p>
                </>
            }
            onClose={() => setActiveModule(null)}
        >
            <div className="mb-8 bg-white/5 rounded-lg p-4 border border-white/5">
                 <div className="text-[10px] text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-2">
                    <Scale size={12} /> Particle Visualization
                 </div>
                 <ParticleSizeVisualizer size={simParams.grindSize} />
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-400 mb-2">
                        <span>Fine (Salt)</span>
                        <span>Coarse (Rock Salt)</span>
                    </div>
                    <input 
                        type="range" min="0" max="1" step="0.01"
                        value={simParams.grindSize}
                        onChange={(e) => onSimParamChange({ grindSize: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <TasteTrend 
                        label="Taste Tendency" 
                        value={getGrindFeedback(simParams.grindSize).text} 
                        impact={getGrindFeedback(simParams.grindSize).impact as any} 
                    />
                </div>
            </div>
        </SidePanel>
      )}

      {activeModule === 'WATER' && (
        <SidePanel 
            title="The Water"
            subtitle="Solubility & Ratio"
            description={
                <>
                    <p>Water acts as the solvent. The SCA standard suggests <strong className="text-white">93°C ± 3°C</strong> for optimal extraction.</p>
                </>
            }
            onClose={() => setActiveModule(null)}
        >
            <div className="space-y-8">
                {/* Temp */}
                <div>
                    <div className="text-[10px] text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-2">
                        <Thermometer size={12} /> Temperature
                    </div>
                    <GradientVisualizer value={simParams.temperature} type="TEMP" />
                    <input 
                        type="range" min="0" max="1" step="0.01"
                        value={simParams.temperature}
                        onChange={(e) => onSimParamChange({ temperature: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                     <TasteTrend 
                        label="Solubility" 
                        value={getTempFeedback(simParams.temperature).text} 
                        impact={getTempFeedback(simParams.temperature).impact as any} 
                    />
                </div>

                {/* Ratio */}
                <div>
                    <div className="text-[10px] text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-2">
                        <Droplets size={12} /> Brew Ratio (1:{Math.round(10 + simParams.ratio * 10)})
                    </div>
                    <GradientVisualizer value={simParams.ratio} type="RATIO" />
                    <input 
                        type="range" min="0" max="1" step="0.01"
                        value={simParams.ratio}
                        onChange={(e) => onSimParamChange({ ratio: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <TasteTrend 
                        label="Strength" 
                        value={simParams.ratio < 0.3 ? "Strong / Heavy Body" : simParams.ratio > 0.7 ? "Delicate / Tea-like" : "Standard Strength"} 
                        impact="neutral" 
                    />
                </div>
            </div>
        </SidePanel>
      )}

      {activeModule === 'POUR' && (
        <SidePanel 
            title="The Pour"
            subtitle="Agitation & Contact"
            description={
                <>
                    <p><strong className="text-white">The Bloom:</strong> Releasing CO2 prevents sourness.</p>
                    <p><strong className="text-white">Pulse Pouring:</strong> Maintains constant temperature and prevents channeling.</p>
                </>
            }
            onClose={() => setActiveModule(null)}
        >
            <div className="mb-8 bg-white/5 rounded-lg p-4 border border-white/5">
                 <div className="text-[10px] text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-2">
                    <Waves size={12} /> Flow Turbulence
                 </div>
                 <SineWaveVisualizer amplitude={simParams.agitation} />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-400 mb-2">
                    <span>Gentle Stream</span>
                    <span>Heavy Agitation</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.01"
                    value={simParams.agitation}
                    onChange={(e) => onSimParamChange({ agitation: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
                 <TasteTrend 
                        label="Consistency" 
                        value={simParams.agitation > 0.7 ? "High risk of Channeling (Uneven)" : "Uniform Saturation"} 
                        impact={simParams.agitation > 0.7 ? 'negative' : 'positive'} 
                    />
            </div>
        </SidePanel>
      )}

      {/* 4. BOTTOM TIMELINE (Always Visible) */}
      <div className="absolute bottom-0 left-0 w-full pb-8 pt-24 px-8 md:px-12 pointer-events-auto bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
          <div className="max-w-4xl mx-auto">
             
             {/* Heads Up Data */}
             <div className="flex justify-between items-end mb-6">
                 <div className="flex items-center gap-4">
                     <button onClick={onAskAI} className="group flex items-center gap-2 text-[10px] font-bold tracking-widest text-amber-100/50 hover:text-amber-100 transition-colors">
                         <div className="p-1.5 rounded-full border border-amber-100/30 group-hover:border-amber-100/80">
                            <Sparkles size={10}/>
                         </div>
                         ASK AI BARISTA
                     </button>
                 </div>

                 <div className="flex gap-8 text-right border-l border-white/10 pl-8">
                     <div>
                        <span className="block text-[9px] text-gray-500 tracking-widest mb-1">TDS (STRENGTH)</span>
                        <span className="text-lg font-light text-white">{flavorProfile.tds.toFixed(2)}%</span>
                     </div>
                     <div>
                        <span className="block text-[9px] text-gray-500 tracking-widest mb-1">EXTRACTION</span>
                        <span className="text-lg font-light text-amber-400">{flavorProfile.extractionYield.toFixed(1)}%</span>
                     </div>
                 </div>
             </div>

             {/* Scrubber */}
             <div className="relative w-full h-10 group flex items-center cursor-pointer">
                 <div className="absolute w-full h-[1px] bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-amber-700 to-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                        style={{ width: `${simParams.time * 100}%` }}
                    />
                 </div>
                 <div 
                    className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-75"
                    style={{ left: `${simParams.time * 100}%`, marginLeft: -4 }}
                 />
                 
                 <input 
                    type="range" min="0" max="1" step="0.001"
                    value={simParams.time}
                    onChange={(e) => onSimParamChange({ time: parseFloat(e.target.value) })}
                    className="absolute inset-0 w-full opacity-0 z-10 cursor-ew-resize"
                 />
                 
                 {/* Time markers */}
                 <div className="absolute top-6 left-0 text-[9px] text-gray-600">0:00</div>
                 <div className="absolute top-6 left-1/4 text-[9px] text-gray-600 opacity-50">BLOOM</div>
                 <div className="absolute top-6 right-0 text-[9px] text-gray-600">4:00</div>
             </div>

          </div>
      </div>

      {/* 5. VIEW MODE TOGGLES */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
           {[
               { id: 'REALITY', icon: <Layers size={16} />, label: 'Reality' },
               { id: 'SATURATION', icon: <Droplets size={16} />, label: 'Saturation' },
               { id: 'FLOW_VELOCITY', icon: <Wind size={16} />, label: 'Velocity' }
           ].map((mode) => (
               <div key={mode.id} className="group relative flex items-center justify-end">
                    <span className="absolute right-12 text-[9px] font-bold tracking-wider text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 px-2 py-1 rounded border border-white/10 whitespace-nowrap pointer-events-none">
                        {mode.label}
                    </span>
                   <button
                       onClick={() => onSimParamChange({ viewMode: mode.id as ViewMode })}
                       className={`
                         p-3 rounded-full transition-all duration-500 border relative
                         ${simParams.viewMode === mode.id 
                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110 z-10' 
                            : 'bg-black/20 text-white/30 border-white/5 hover:text-white hover:border-white/20 backdrop-blur-md'}
                       `}
                   >
                       {mode.icon}
                   </button>
               </div>
           ))}
      </div>

    </div>
  );
};
