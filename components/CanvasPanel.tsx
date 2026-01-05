import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Copy, FileText, Terminal, FileJson, Printer } from 'lucide-react';
import { Button } from './Button';
import { MermaidDiagram } from './MermaidDiagram';
import { CodeBlock } from './CodeBlock';

interface CanvasPanelProps {
  content: string;
}

export const CanvasPanel: React.FC<CanvasPanelProps> = ({ content }) => {
  
  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architect-design.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const data = {
        title: "Architect AI Design Document",
        exportedAt: new Date().toISOString(),
        content: content
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architect-design.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
      window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-4xl overflow-hidden relative" id="canvas-panel-root">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-transparent print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-semibold text-lg text-white tracking-tight">Design Canvas</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopy} tooltip="Copy Markdown">
            <Copy className="w-5 h-5" />
          </Button>
          <Button variant="secondary" onClick={handleDownloadJSON} tooltip="Export JSON">
            <FileJson className="w-5 h-5" />
          </Button>
           <Button variant="secondary" onClick={handlePrintPDF} tooltip="Print / Save as PDF">
            <Printer className="w-5 h-5" />
          </Button>
          <Button variant="secondary" onClick={handleDownloadMarkdown} tooltip="Download Markdown">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-10 scroll-smooth print:overflow-visible print:h-auto print:p-0">
        {content ? (
          <div className="markdown-body max-w-4xl mx-auto print:max-w-none print:text-black">
            <ReactMarkdown
              components={{
                code(props) {
                    const {children, className, node, ...rest} = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const codeContent = String(children).replace(/\n$/, '');
                    
                    if (language === 'mermaid') {
                        return <MermaidDiagram chart={codeContent} />;
                    }

                    if (match) {
                        return <CodeBlock language={language} value={codeContent} />;
                    }

                    return (
                        <code className={className} {...rest}>
                            {children}
                        </code>
                    );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 opacity-40 print:hidden">
            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
              <FileText className="w-12 h-12 text-neutral-500" />
            </div>
            <p className="text-xl font-light tracking-wide text-neutral-400">Canvas Empty</p>
          </div>
        )}
      </div>
      
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-20 print:hidden" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2 opacity-10 print:hidden" />
    </div>
  );
};