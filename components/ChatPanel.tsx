import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Mic, Plus, StopCircle, Sparkles, Image as ImageIcon, Box, Upload, File as FileIcon, Github, Globe, Search, BrainCircuit, LineChart, Code2, Trash2, Palette, Zap } from 'lucide-react';
import { Button } from './Button';
import { Message, AIMode } from '../types';
import { ThinkingBlock } from './ThinkingBlock';
import { EXAMPLE_PROMPTS, SAVED_PROMPTS } from '../constants/prompts';
import { CodeBlock } from './CodeBlock';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string, file?: { mimeType: string; data: string }) => void;
  isLive: boolean;
  isTalking: boolean;
  onToggleLive: () => void;
  isLoading: boolean;
  currentMode?: AIMode;
  onModeChange?: (mode: AIMode) => void;
  onClearSession: () => void;
}

// Definition of Available Modes for the @ Menu
const AVAILABLE_MODES = [
  { id: AIMode.ARCHITECT, label: 'Architect AI', icon: BrainCircuit, color: 'text-orange-400', desc: 'Design & Docs' },
  { id: AIMode.DEEP_SEARCH, label: 'Deep Research', icon: Globe, color: 'text-cyan-400', desc: 'Web Search' },
  { id: AIMode.MARKET_ANALYSIS, label: 'Market Analyst', icon: LineChart, color: 'text-green-400', desc: 'Strategy' },
  { id: AIMode.TECHNICAL_DEEP_DIVE, label: 'Tech Architect', icon: Code2, color: 'text-purple-400', desc: 'Stack & Arch' },
  { id: AIMode.DEEP_CREATIVE_RESEARCH, label: 'Creative Director', icon: Palette, color: 'text-pink-400', desc: 'UX & Brand' },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  onSendMessage, 
  isLive, 
  isTalking,
  onToggleLive, 
  isLoading,
  currentMode = AIMode.ARCHITECT,
  onModeChange,
  onClearSession
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ mimeType: string; data: string; name: string } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState("Thinking...");
  const [randomPrompts, setRandomPrompts] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Menu State for @ and / commands
  const [menuType, setMenuType] = useState<'@' | '/' | null>(null);
  const [menuQuery, setMenuQuery] = useState('');
  const [menuIndex, setMenuIndex] = useState(0);

  useEffect(() => {
    const shuffled = [...EXAMPLE_PROMPTS].sort(() => 0.5 - Math.random());
    setRandomPrompts(shuffled.slice(0, 4));
  }, []);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
        const statuses = ["Deep Thinking...", "Analyzing Market...", "Structuring Document...", "Writing Content...", "Reviewing Logic...", "Consulting Creative Director..."];
        let index = 0;
        setLoadingStatus(statuses[0]);
        interval = setInterval(() => {
            index = (index + 1) % statuses.length;
            setLoadingStatus(statuses[index]);
        }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingStatus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${Math.max(80, newHeight)}px`;
    }
  }, [inputText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.add-menu-container')) {
        setShowAddMenu(false);
      }
      if (!target.closest('.command-menu-container') && !target.closest('textarea')) {
          setMenuType(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInputText(val);

      // Detect trigger characters at the end of input or after space
      // Check for @
      const atMatch = val.match(/@([a-zA-Z0-9\s]*)$/);
      // Check for /
      const slashMatch = val.match(/\/([a-zA-Z0-9\s]*)$/);

      if (atMatch) {
          setMenuType('@');
          setMenuQuery(atMatch[1]);
          setMenuIndex(0);
      } else if (slashMatch) {
          setMenuType('/');
          setMenuQuery(slashMatch[1]);
          setMenuIndex(0);
      } else {
          setMenuType(null);
          setMenuQuery('');
      }
  };

  const getFilteredItems = () => {
      if (menuType === '@') {
          return AVAILABLE_MODES.filter(mode => 
              mode.label.toLowerCase().includes(menuQuery.toLowerCase()) || 
              mode.desc.toLowerCase().includes(menuQuery.toLowerCase())
          );
      }
      if (menuType === '/') {
          return SAVED_PROMPTS.filter(p => 
              p.label.toLowerCase().includes(menuQuery.toLowerCase()) ||
              p.text.toLowerCase().includes(menuQuery.toLowerCase())
          );
      }
      return [];
  };

  const executeMenuSelection = (index: number) => {
      const items = getFilteredItems();
      if (!items[index]) return;

      if (menuType === '@') {
          const selected = items[index] as typeof AVAILABLE_MODES[0];
          if (onModeChange) onModeChange(selected.id);
          // Remove the @query part
          setInputText(prev => prev.replace(/@([a-zA-Z0-9\s]*)$/, '').trim());
      } else if (menuType === '/') {
          const selected = items[index] as typeof SAVED_PROMPTS[0];
          // Replace /query with prompt text
          setInputText(prev => prev.replace(/\/([a-zA-Z0-9\s]*)$/, selected.text));
      }
      setMenuType(null);
      setMenuQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (menuType) {
          const items = getFilteredItems();
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setMenuIndex(prev => (prev + 1) % items.length);
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setMenuIndex(prev => (prev - 1 + items.length) % items.length);
          } else if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              executeMenuSelection(menuIndex);
          } else if (e.key === 'Escape') {
              setMenuType(null);
          }
      } else {
           if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
      }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedFile) || isLoading || isLive) return;

    onSendMessage(inputText, selectedFile ? { mimeType: selectedFile.mimeType, data: selectedFile.data } : undefined);
    setInputText('');
    setSelectedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = '80px';
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading || isLive) return;
    onSendMessage(suggestion);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setSelectedFile({
        mimeType: file.type || 'application/octet-stream',
        data: base64Data,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    setShowAddMenu(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLive && !isLoading) setIsDragging(true);
  }, [isLive, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLive || isLoading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processFile(files[0]);
  }, [isLive, isLoading]);

  const handleModeSelection = (mode: AIMode) => {
    if (onModeChange) onModeChange(mode);
    setShowAddMenu(false);
  };

  const getModeIcon = (mode: AIMode) => {
      switch(mode) {
          case AIMode.ARCHITECT: return <Sparkles className="w-5 h-5 text-neutral-400" />;
          case AIMode.DEEP_SEARCH: return <Search className="w-5 h-5 text-blue-400" />;
          case AIMode.MARKET_ANALYSIS: return <LineChart className="w-5 h-5 text-green-400" />;
          case AIMode.TECHNICAL_DEEP_DIVE: return <Code2 className="w-5 h-5 text-purple-400" />;
          case AIMode.DEEP_CREATIVE_RESEARCH: return <Palette className="w-5 h-5 text-pink-400" />;
          default: return <Sparkles className="w-5 h-5" />;
      }
  }

  const getModeName = (mode: AIMode) => {
      const found = AVAILABLE_MODES.find(m => m.id === mode);
      return found ? found.label : 'Architect AI';
  }

  const getModeDescription = (mode: AIMode) => {
      const found = AVAILABLE_MODES.find(m => m.id === mode);
      return found ? found.desc : 'Design & Documentation';
  }

  return (
    <div className="h-full flex flex-col glass-panel rounded-4xl overflow-hidden relative">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            {getModeIcon(currentMode)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-300 tracking-wide text-sm uppercase">
                {getModeName(currentMode)}
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                {getModeDescription(currentMode)}
            </span>
          </div>
        </div>
        <Button 
            variant="ghost" 
            onClick={onClearSession} 
            tooltip="Clear Session & Reset"
            className="text-neutral-600 hover:text-red-500"
        >
            <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8 relative group">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative w-24 h-24 bg-black border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Box className="w-10 h-10 text-white" />
                </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Architect AI</h1>
            <p className="text-neutral-500 max-w-xs mb-12 leading-relaxed">
              Your collaborative partner for designing next-generation applications.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-md">
              {randomPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(prompt)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-xs text-neutral-400 hover:text-white transition-all duration-300"
                  title="Click to send this example prompt"
                >
                  {prompt}
                </button>
              ))}
            </div>
             <p className="mt-8 text-xs text-neutral-600 font-mono">
                Tip: Type <span className="text-blue-400">@</span> to switch tools or <span className="text-purple-400">/</span> for saved prompts
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
          >
            {msg.role === 'model' && msg.thinking && (
                <ThinkingBlock content={msg.thinking} />
            )}

            <div 
              className={`max-w-[85%] rounded-3xl px-6 py-4 text-sm leading-7 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-white text-black rounded-tr-sm chat-markdown' 
                  : 'bg-[#111] text-neutral-300 border border-white/10 rounded-tl-sm chat-markdown'
              }`}
            >
              <ReactMarkdown
                 components={{
                    code(props) {
                        const {children, className, node, ...rest} = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeContent = String(children).replace(/\n$/, '');

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
                {msg.text}
              </ReactMarkdown>
            </div>

            {msg.role === 'model' && msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 max-w-[90%]">
                {msg.suggestions.map((suggestion, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading || isLive}
                    className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start pl-2">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <span className="text-xs font-mono tracking-widest uppercase animate-shimmer">{loadingStatus}</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Live Overlay */}
      {isLive && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="relative mb-12">
                {isTalking && (
                     <div className="absolute inset-0 rounded-full border border-white/30 animate-ping scale-150 duration-1000" />
                )}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isTalking ? 'bg-white border-white shadow-[0_0_50px_rgba(255,255,255,0.4)]' : 'bg-transparent border-white/20'}`}>
                    <Mic className={`w-8 h-8 transition-colors duration-500 ${isTalking ? 'text-black' : 'text-white'}`} />
                </div>
            </div>
            <h3 className="text-2xl font-light text-white mb-2">Listening</h3>
            <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-shimmer">Processing Voice Stream</p>
        </div>
      )}

      {/* Expanded Input Area */}
      <div className="p-6 pt-2 bg-gradient-to-t from-black via-black to-transparent z-10 command-menu-container">
        {selectedFile && (
          <div className="flex items-center gap-3 mb-3 bg-[#111] p-2 pl-3 rounded-xl max-w-fit border border-white/10 animate-in slide-in-from-bottom-2">
            <ImageIcon className="w-4 h-4 text-white" />
            <span className="text-xs text-neutral-300 truncate max-w-[150px] font-mono">{selectedFile.name}</span>
            <button 
                onClick={() => setSelectedFile(null)} 
                className="text-neutral-500 hover:text-white ml-2 transition-colors p-1 hover:bg-white/10 rounded-md"
                title="Remove attachment"
            >
                &times;
            </button>
          </div>
        )}
        
        <div 
            className={`relative bg-[#0a0a0a] border rounded-[2rem] shadow-2xl transition-all duration-300 focus-within:border-white/20 focus-within:bg-[#0f0f0f] focus-within:shadow-[0_0_30px_rgba(0,0,0,0.5)] ${isDragging ? 'border-white bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-white/10'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[2rem] bg-black/60 backdrop-blur-sm border-2 border-dashed border-white/50 animate-in fade-in duration-200 pointer-events-none">
                    <div className="flex flex-col items-center gap-3">
                        <Upload className="w-10 h-10 text-white animate-bounce" />
                        <span className="text-white font-medium text-lg">Drop image to attach</span>
                    </div>
                </div>
            )}

            {/* Popup Menu */}
            {menuType && (
                <div className="absolute bottom-full left-0 mb-4 w-full px-2 z-50">
                    <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-64 overflow-y-auto">
                        <div className="p-2 border-b border-white/5 bg-white/5">
                            <span className="text-[10px] font-mono uppercase text-neutral-400 px-2">
                                {menuType === '@' ? 'Switch Tools' : 'Saved Prompts'}
                            </span>
                        </div>
                        <div className="p-1">
                            {getFilteredItems().length > 0 ? getFilteredItems().map((item: any, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => executeMenuSelection(idx)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${idx === menuIndex ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5'}`}
                                >
                                    {menuType === '@' ? (
                                        <>
                                            <div className={`p-1.5 rounded-lg bg-white/5 ${item.color.replace('text', 'bg')}/10`}>
                                                <item.icon className={`w-4 h-4 ${item.color}`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{item.label}</span>
                                                <span className="text-[10px] text-neutral-500">{item.desc}</span>
                                            </div>
                                            {currentMode === item.id && <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Active</span>}
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-1.5 rounded-lg bg-white/5">
                                                <Zap className="w-4 h-4 text-yellow-400" />
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-sm font-medium text-white">{item.label}</span>
                                                <span className="text-[10px] text-neutral-500 truncate max-w-[200px]">{item.text}</span>
                                            </div>
                                        </>
                                    )}
                                </button>
                            )) : (
                                <div className="p-4 text-center text-neutral-500 text-xs">No matches found</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isLive ? "Live session active..." : "Describe your vision (Use @ for tools, / for prompts)..."}
                    disabled={isLive || isLoading}
                    rows={1}
                    className="w-full bg-transparent text-white placeholder-neutral-600 px-6 py-5 focus:outline-none resize-none min-h-[80px] max-h-[150px] scrollbar-hide text-sm leading-relaxed"
                />
                
                {/* Action Bar inside Input */}
                <div className="flex items-center justify-between px-4 pb-3 pt-2 relative add-menu-container">
                    <div className="flex items-center gap-1">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                        <input type="file" ref={mediaInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />

                        {/* Popover Menu - kept for manual clicks as well */}
                        {showAddMenu && (
                            <div className="absolute bottom-16 left-4 w-72 bg-[#111] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 overflow-hidden flex flex-col max-h-[400px] overflow-y-auto">
                                <div className="p-2 border-b border-white/5">
                                    <p className="text-[10px] uppercase text-neutral-500 font-semibold px-2 py-1">Attachments</p>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-lg text-sm text-neutral-300 hover:text-white transition-colors text-left"
                                    >
                                        <FileIcon className="w-4 h-4 text-blue-400" /> Add File
                                    </button>
                                    <button 
                                        onClick={() => mediaInputRef.current?.click()} 
                                        className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-lg text-sm text-neutral-300 hover:text-white transition-colors text-left"
                                    >
                                        <ImageIcon className="w-4 h-4 text-green-400" /> Add Media
                                    </button>
                                </div>
                                <div className="p-2">
                                    <p className="text-[10px] uppercase text-neutral-500 font-semibold px-2 py-1">Intelligence Mode</p>
                                    {AVAILABLE_MODES.map((m) => (
                                        <button 
                                            key={m.id}
                                            onClick={() => handleModeSelection(m.id)} 
                                            className={`flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-lg text-sm transition-colors text-left ${currentMode === m.id ? 'bg-white/10 text-white' : 'text-neutral-300'}`}
                                        >
                                            <m.icon className={`w-4 h-4 ${m.color}`} />
                                            <div className="flex flex-col">
                                                <span>{m.label}</span>
                                                <span className="text-[10px] text-neutral-500">{m.desc}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button 
                            type="button" 
                            variant="primary" 
                            onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }} 
                            disabled={isLive} 
                            tooltip="Add Attachments & Modes" 
                            className={`!p-2.5 ${showAddMenu ? 'text-white' : ''}`}
                        >
                            <Plus className={`w-5 h-5 transition-transform duration-300 ${showAddMenu ? 'rotate-45' : ''}`} />
                        </Button>
                        <Button 
                            type="button" 
                            variant={isLive ? "danger" : "primary"} 
                            onClick={onToggleLive} 
                            tooltip={isLive ? "End Live Session" : "Start Live Session"} 
                            active={isLive} 
                            className="!p-2.5"
                        >
                            {isLive ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>
                    </div>

                    <Button 
                        type="submit" 
                        variant="primary" 
                        onClick={() => handleSubmit()} 
                        disabled={(!inputText.trim() && !selectedFile) || isLoading || isLive} 
                        tooltip="Send Message" 
                        className={`!p-2.5 transition-all duration-300 ${inputText.trim() ? 'bg-white text-black hover:bg-neutral-200' : ''}`}
                    >
                        <Send className={`w-5 h-5 ${inputText.trim() ? 'text-black fill-current' : ''}`} />
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};