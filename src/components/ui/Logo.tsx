export function Logo({ className = "", size = "md", hideText = false, forceIcon = false }: { className?: string; size?: "sm" | "md" | "lg" | "xl", hideText?: boolean, forceIcon?: boolean }) {
  const sizes = {
    sm: { img: "h-8", box: "w-8 h-8 rounded-lg", text: "text-lg", char: "text-base" },
    md: { img: "h-10", box: "w-10 h-10 rounded-xl", text: "text-xl", char: "text-xl" },
    lg: { img: "h-14", box: "w-14 h-14 rounded-2xl", text: "text-3xl", char: "text-3xl" },
    xl: { img: "h-20", box: "w-20 h-20 rounded-3xl", text: "text-5xl", char: "text-5xl" },
  };

  const currentSize = sizes[size];
  const useIconOnly = hideText || forceIcon;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 
        Para usar a sua imagem real:
        Faça o upload do arquivo na pasta "public/" com o nome de "logo.png" ou "icon.png"
      */}
      <div className="relative flex items-center">
        {!useIconOnly ? (
          <div className="flex items-center gap-3">
             <div className={`${currentSize.box} flex items-center justify-center flex-shrink-0 relative group`}>
                {/* Glow behind icon */}
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] relative z-10 overflow-visible" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                  {/* Neon B icon fallback matching the image aesthetic */}
                  <path d="M 20 20 L 50 20 C 70 20 70 45 50 50 C 75 50 75 80 50 80 L 20 80 Z" className="text-blue-500 opacity-50" strokeWidth="12" filter="blur(4px)" />
                  <path d="M 20 20 L 50 20 C 70 20 70 45 50 50 C 75 50 75 80 50 80 L 20 80 Z" className="text-[#3b82f6]" />
                  
                  <path d="M 20 20 L 20 80" className="text-blue-500 opacity-50" strokeWidth="12" filter="blur(4px)" />
                  <path d="M 20 20 L 20 80" className="text-[#60a5fa]" />
                </svg>
             </div>
             <span className={`font-display font-semibold tracking-tight text-white ${currentSize.text} flex items-center`}>
                <span className="text-[#60a5fa] drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] font-light">Bella</span>
                <span className="text-[#e2e8f0] drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">PDV</span>
             </span>
          </div>
        ) : (
          <div className={`${currentSize.box} flex items-center justify-center flex-shrink-0 relative group`}>
              <div className="absolute inset-0 bg-blue-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] relative z-10 overflow-visible" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 20 20 L 50 20 C 70 20 70 45 50 50 C 75 50 75 80 50 80 L 20 80 Z" className="text-blue-500 opacity-50" strokeWidth="12" filter="blur(4px)" />
                <path d="M 20 20 L 50 20 C 70 20 70 45 50 50 C 75 50 75 80 50 80 L 20 80 Z" className="text-[#3b82f6]" />
                <path d="M 20 20 L 20 80" className="text-blue-500 opacity-50" strokeWidth="12" filter="blur(4px)" />
                <path d="M 20 20 L 20 80" className="text-[#60a5fa]" />
              </svg>
          </div>
        )}
      </div>
    </div>
  );
}
