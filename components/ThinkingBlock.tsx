import React, { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkingBlockProps {
  content: string;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-3 w-full max-w-[85%]">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-white transition-colors duration-300 group w-full"
        title={isExpanded ? "Collapse thinking process" : "Expand thinking process"}
      >
        <div className={`p-1 rounded-md bg-white/5 border border-white/5 group-hover:border-white/20 transition-all ${isExpanded ? 'text-blue-400' : ''}`}>
           <BrainCircuit className="w-3 h-3" />
        </div>
        <span className="uppercase tracking-widest text-[10px]">
            {isExpanded ? 'Hide Thinking Process' : 'View Thinking Process'}
        </span>
        <div className="flex-1 h-px bg-white/5 group-hover:bg-white/10 transition-colors ml-2" />
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-3 bg-black/40 border-l-2 border-white/10 text-neutral-400 font-mono text-xs leading-relaxed whitespace-pre-wrap rounded-r-lg">
          {content}
        </div>
      </div>
    </div>
  );
};