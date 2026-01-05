import React, { useState, useEffect } from 'react';
import { Message, AIMode } from './types';
import { ChatPanel } from './components/ChatPanel';
import { CanvasPanel } from './components/CanvasPanel';
import { GeminiService } from './services/gemini';
import { useLiveSession } from './hooks/useLiveSession';
import { useLocalStorage } from './hooks/useLocalStorage';

// You must set this in your environment or replace strictly for local testing (not recommended for prod)
const API_KEY = process.env.API_KEY || ''; 

const DEFAULT_DOCUMENT = `# Architect AI: The Visionary Engine

> **Welcome to the future of software design.**

Architect AI is a collaborative intelligence designed to transform abstract ideas into rigorous technical specifications. It operates as a dual-screen environment: a conversational interface on the left and a live, evolving design canvas on the right.

## 🧠 Core Capabilities

### 1. The Architect Mode
Acts as your Product Manager and Lead Engineer. It listens to your high-level vision and instantly structures it into:
- Executive Summaries
- User Stories
- Feature Requirements

### 2. Market Analysis Mode
*Powered by Deep Research & Grounding*
- Identifies competitors and blue-ocean opportunities using **Google Search Grounding**.
- Synthesizes SWOT analyses and business models with real-time data.
- Updates this document with data-driven insights.

### 3. Technical Deep Dive
*Powered by Staff+ Engineering Logic*
- Architectures scalable systems (Microservices, Serverless).
- Generates **Mermaid.js** diagrams for data flow.
- Recommends specific tech stacks based on modern standards.

## 🚀 Advanced Intelligence Features

### 🔍 Deep Research & Grounding
Architect AI leverages **Google Search Grounding** to anchor its responses in reality.
- **Live Web Access**: It doesn't hallucinate; it verifies facts, checks library versions, and finds real competitor pricing.
- **Citation & Verification**: Research findings are cross-referenced before being synthesized into your document.

### ⛓️ Sequential Thinking Mode
For complex problems, the AI engages a **Chain of Thought (CoT)** protocol:
1.  **Analyze**: Deconstructs the user request.
2.  **Reason**: Traces logic paths in an internal monologue (visible in "Thinking Process").
3.  **Execute**: Formulates the optimal solution.
This ensures high-fidelity output for architecture decisions and complex logic.

### 🛠️ Integrated Tool Calling
The system is built on a robust **Function Calling** architecture:
- **Canvas Control**: The AI directly manipulates this document via the \`updateDocument\` tool.
- **External Data**: It calls search tools to fetch external context.
- **UI Suggestion**: It triggers interactive UI chips via \`suggestNextSteps\`.

## 🛠 Features

*   **Live Canvas**: Real-time Markdown rendering with syntax highlighting.
*   **Visual Thinking**: Automatic generation of flowcharts and sequence diagrams.
*   **Voice Interface**: Real-time audio streaming for hands-free brainstorming.
*   **Persistence**: Your work is saved locally and persists across sessions.

---

*To begin, simply type your idea in the chat or switch modes to perform deep research.*`;

export default function App() {
  const [messages, setMessages] = useLocalStorage<Message[]>('architect_messages', []);
  const [documentContent, setDocumentContent] = useLocalStorage<string>('architect_document', DEFAULT_DOCUMENT);
  const [userApiKey, setUserApiKey] = useLocalStorage<string>('architect_api_key', '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>(AIMode.ARCHITECT);

  useEffect(() => {
    // Check key on mount
    const effectiveKey = API_KEY || userApiKey;
    if (!effectiveKey) {
        setShowApiKeyModal(true);
    }
  }, [userApiKey]);

  // Global Scroll Listener for Auto-hiding Scrollbars
  useEffect(() => {
    let timeoutId: any;
    const handleScroll = () => {
      // Add class to body to indicate scrolling
      if (!document.body.classList.contains('scrolling')) {
        document.body.classList.add('scrolling');
      }
      
      // Debounce the removal
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        document.body.classList.remove('scrolling');
      }, 1000); // Hide after 1 second of no scroll
    };

    // Use capture: true to ensure we catch scroll events from overflow containers (which don't bubble)
    window.addEventListener('scroll', handleScroll, { capture: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      clearTimeout(timeoutId);
    };
  }, []);

  const handleError = (error: any) => {
      console.error("App Error:", error);
      const errorMsg = error.toString().toLowerCase();
      if (
        errorMsg.includes('404') || 
        errorMsg.includes('requested entity was not found') ||
        errorMsg.includes('401') ||
        errorMsg.includes('unauthenticated') ||
        errorMsg.includes('api keys are not supported')
      ) {
          setMessages(prev => [...prev, { role: 'model', text: "Authentication Error: The API key provided is invalid or does not support the requested model. Please provide a valid API key.", timestamp: new Date() }]);
          setUserApiKey(''); // Clear invalid key
          setShowApiKeyModal(true); // Force re-entry
      } else {
          setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
      }
  };

  const handleSendMessage = async (text: string, file?: { mimeType: string; data: string }) => {
    const effectiveKey = API_KEY || userApiKey;
    if (!effectiveKey) {
        setShowApiKeyModal(true);
        return;
    }

    const newMessage: Message = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const geminiService = new GeminiService(effectiveKey);
      const response = await geminiService.sendMessage(messages, documentContent, text, currentMode, file);
      
      const aiMessage: Message = { 
        role: 'model', 
        text: response.text, 
        timestamp: new Date(),
        suggestions: response.suggestions,
        thinking: response.thinking
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (response.documentUpdate) {
        setDocumentContent(response.documentUpdate);
      }
    } catch (error) {
      handleError(error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const { connect, disconnect, isConnected, isTalking } = useLiveSession({
    apiKey: API_KEY || userApiKey,
    onTranscript: (text, isUser) => {
        console.log("Transcript:", text); 
    },
    onDocumentUpdate: (content) => {
      setDocumentContent(content);
    },
    onSuggestions: (suggestions) => {
        setMessages(prev => [...prev, { 
            role: 'model', 
            text: "I've updated the canvas. Here are some options for us to discuss:", 
            timestamp: new Date(),
            suggestions: suggestions
        }]);
    },
    onError: handleError
  });

  const handleToggleLive = () => {
    if (isConnected) {
      disconnect();
    } else {
      const effectiveKey = API_KEY || userApiKey;
      if (!effectiveKey) {
          setShowApiKeyModal(true);
          return;
      }
      connect();
    }
  };

  const handleSaveApiKey = () => {
    if(userApiKey.trim()) {
       setShowApiKeyModal(false);
    }
  }

  const handleClearSession = () => {
      if (window.confirm("Are you sure you want to clear the session? This will delete all chat history and reset the design document.")) {
          setMessages([]);
          setDocumentContent(DEFAULT_DOCUMENT);
          // We do not reload the page, just reset state
      }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 overflow-hidden relative">
      
      {/* Background Gradients - Monochrome/Dark */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 h-screen p-4 md:p-8 flex flex-col md:flex-row gap-8">
        
        {/* Left: Chat */}
        <div className="w-full md:w-[35%] lg:w-[30%] min-w-[320px] h-[40vh] md:h-full flex-shrink-0 transition-all duration-300 flex flex-col">
           <ChatPanel 
             messages={messages} 
             onSendMessage={handleSendMessage}
             isLive={isConnected}
             isTalking={isTalking}
             onToggleLive={handleToggleLive}
             isLoading={isLoading}
             currentMode={currentMode}
             onModeChange={setCurrentMode}
             onClearSession={handleClearSession}
           />
        </div>

        {/* Right: Canvas */}
        <div className="flex-1 h-[60vh] md:h-full min-w-0 transition-all duration-300">
          <CanvasPanel content={documentContent} />
        </div>
      </div>
      
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
           <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
             <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Enter API Key</h2>
             <p className="text-neutral-400 mb-8 text-sm leading-relaxed">To access the Visionary Architect, please provide your Google Gemini API key. It will be saved locally.</p>
             <input 
               type="password" 
               className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white mb-4 focus:ring-1 focus:ring-white/20 focus:border-white/20 outline-none transition-all placeholder-neutral-600"
               placeholder="AIza..."
               value={userApiKey}
               onChange={(e) => setUserApiKey(e.target.value)}
             />
             <button 
               onClick={handleSaveApiKey}
               className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
             >
               Initialize
             </button>
             <p className="mt-6 text-xs text-neutral-600 text-center">
               <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-neutral-400 transition-colors">Get an API Key</a>
             </p>
           </div>
        </div>
      )}
    </div>
  );
}