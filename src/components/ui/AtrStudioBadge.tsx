import React from 'react';

interface AtrStudioBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPrefix?: boolean;
}

export function AtrStudioBadge({ size = 'md', className = '', showPrefix = true }: AtrStudioBadgeProps) {
  const sizeClasses = {
    sm: {
      box: 'w-4 h-4 text-[7px] rounded',
      text: 'text-[11px]',
      gap: 'gap-1.5',
    },
    md: {
      box: 'w-5 h-5 text-[9px] rounded-md',
      text: 'text-xs',
      gap: 'gap-2',
    },
    lg: {
      box: 'w-7 h-7 text-xs rounded-lg',
      text: 'text-sm',
      gap: 'gap-2.5',
    },
  }[size];

  return (
    <div className={`flex items-center ${sizeClasses.gap} ${className}`}>
      {showPrefix && <span className="text-slate-500 text-xs">Desenvolvido por</span>}
      <a
        href="https://atrstudio.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5 text-slate-400 hover:text-white transition-all cursor-pointer"
        title="Acessar site oficial ATR Studio Design"
      >
        {/* Brand Icon */}
        <div
          className={`${sizeClasses.box} bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 text-white font-black flex items-center justify-center tracking-tighter shadow-[0_0_12px_rgba(34,211,238,0.35)] group-hover:shadow-[0_0_18px_rgba(34,211,238,0.6)] group-hover:scale-105 transition-all border border-cyan-300/30`}
        >
          ATR
        </div>
        
        {/* Brand Typography */}
        <span className={`font-semibold tracking-wide text-slate-300 group-hover:text-cyan-400 transition-colors ${sizeClasses.text}`}>
          ATR Studio <span className="text-slate-500 font-normal group-hover:text-cyan-300/70">Design</span>
        </span>
      </a>
    </div>
  );
}
