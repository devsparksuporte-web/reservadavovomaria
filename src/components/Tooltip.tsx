import React, { useState } from 'react';
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50",
          "px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800",
          "text-xs text-white whitespace-nowrap shadow-xl animate-in fade-in zoom-in duration-200",
          className
        )}>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}
