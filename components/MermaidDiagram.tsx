import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;
      
      try {
        setError(null);
        // Generate unique ID for each chart render to avoid conflicts
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Failed to render diagram. Syntax might be incorrect.');
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-xs font-mono">
        <p className="mb-2 font-semibold">Diagram Error:</p>
        {error}
        <pre className="mt-2 p-2 bg-black/50 rounded overflow-x-auto opacity-50">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-6 p-4 bg-[#111] rounded-xl border border-white/5 overflow-x-auto flex justify-center">
       <div 
         ref={containerRef}
         dangerouslySetInnerHTML={{ __html: svg }} 
         className="w-full text-center"
       />
    </div>
  );
};