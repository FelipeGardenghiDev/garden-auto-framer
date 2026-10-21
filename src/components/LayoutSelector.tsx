import React from 'react';
import { LayoutMode } from '../types';
import { Columns, Sparkles, MoveHorizontal, CreditCard } from 'lucide-react';

interface LayoutSelectorProps {
  currentLayout: LayoutMode;
  onSelect: (layout: LayoutMode) => void;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onSelect }) => {
  const layouts: { id: LayoutMode; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'split-streamer',
      title: 'Split Streamer',
      desc: 'Top Facecam + Bottom Gameplay',
      icon: <Columns className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'blur-fill',
      title: 'Smart Blur-Fill',
      desc: '16:9 Center with Blurred Background',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'centered-card',
      title: 'Title Header Card',
      desc: 'Top Hook Header + Video + Subtitle',
      icon: <CreditCard className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'auto-pan',
      title: 'Widescreen Pan',
      desc: 'Dynamic 9:16 Crop Window Sliding',
      icon: <MoveHorizontal className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {layouts.map((l) => (
        <button
          key={l.id}
          onClick={() => onSelect(l.id)}
          className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
            currentLayout === l.id
              ? 'bg-zinc-800 border-emerald-500/80 shadow-md shadow-emerald-950/40'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-400'
          }`}
        >
          <div className="p-2 rounded-lg bg-zinc-800/80 shrink-0">{l.icon}</div>
          <div>
            <div className="text-xs font-semibold text-zinc-100">{l.title}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{l.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
