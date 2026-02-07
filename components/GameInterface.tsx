import React, { useEffect, useRef, useState } from 'react';
import { Message, ImageGenerationStatus } from '../types';
import { sendGameMessage, generateSceneImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface GameInterfaceProps {
  initialPrompt: string;
  playerName: string;
  onReset: () => void;
  initialMessages?: Message[];
  onSyncMessages: (messages: Message[]) => void;
  useImages: boolean;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ 
  initialPrompt, 
  playerName, 
  onReset, 
  initialMessages = [],
  onSyncMessages,
  useImages
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  
  // Status States
  const [status, setStatus] = useState<'idle' | 'thinking' | 'generating_image'>('idle');
  const [currentImage, setCurrentImage] = useState<ImageGenerationStatus>({ 
      status: useImages ? 'idle' : 'disabled' 
  });
  
  // Scroll & UI Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasStartedRef = useRef(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Auto-Save & Sync
  useEffect(() => {
    onSyncMessages(messages);

    if (messages.length > 0) {
      const saveState = {
        playerName,
        initialPrompt,
        messages: messages,
        timestamp: Date.now(),
        useImages
      };
      try {
        localStorage.setItem('void_savegame', JSON.stringify(saveState));
      } catch (e) {
        console.warn("Auto-save failed:", e);
      }
    }
  }, [messages, playerName, initialPrompt, onSyncMessages, useImages]);

  // Initial Game Start Sequence
  useEffect(() => {
    if (hasStartedRef.current || messages.length > 0) {
      if (messages.length > 0) {
         setTimeout(() => {
             if (scrollContainerRef.current) {
                 scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
             }
         }, 500);
      }
      return;
    }

    const startSequence = async () => {
      if (!initialPrompt) return;
      
      hasStartedRef.current = true;
      
      const welcomeMsg: Message = { 
        role: 'user', 
        content: `Conectando Neural Link para ${playerName}...`, 
        timestamp: Date.now() 
      };
      
      setMessages([welcomeMsg]);
      await processTurn(initialPrompt);
    };
    
    startSequence();
  }, [initialPrompt]);

  // Scroll Management
  useEffect(() => {
    if (messages.length > 0 && lastMessageRef.current) {
        setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 100;
    setShowScrollIndicator(!isAtBottom);
  };

  useEffect(() => {
      const el = scrollContainerRef.current;
      if (el) {
          el.addEventListener('scroll', handleScroll);
          handleScroll();
          return () => el.removeEventListener('scroll', handleScroll);
      }
  }, [messages]);

  const processTurn = async (prompt: string) => {
    setStatus('thinking');
    
    // 1. Get Text Response (Now includes token usage)
    const response = await sendGameMessage(prompt);
    
    // 2. Display Text Immediately with Usage Metadata
    const timestamp = Date.now();
    const newMessage: Message = {
      role: 'model',
      content: response.narrative,
      timestamp: timestamp,
      options: response.options,
      usage: response.usage // Important for Tokenometer
    };

    setMessages(prev => [...prev, newMessage]);
    
    // 3. Start Background Image Generation
    if (useImages && response.imagePrompt) {
        setCurrentImage({ status: 'generating' });
        setStatus('generating_image');
        generateSceneImage(response.imagePrompt).then(url => {
            if (url) setCurrentImage({ status: 'completed', url });
            else setCurrentImage({ status: 'error' });
            setStatus('idle');
        });
    } else {
        if (!useImages) setCurrentImage({ status: 'disabled' });
        setStatus('idle');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || status !== 'idle') return;

    setInputValue('');
    if (inputRef.current) {
      inputRef.current.blur();
    }

    const userMsg: Message = { 
      role: 'user', 
      content: text, 
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    await processTurn(userMsg.content);
  };

  const handleOptionClick = (option: string) => {
      handleSendMessage(option);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Visual Panel */}
      <div className="lg:w-1/2 h-1/3 lg:h-full bg-black relative border-b lg:border-b-0 lg:border-l border-void-gray order-1 lg:order-2 flex items-center justify-center overflow-hidden group">
        {currentImage.status === 'completed' && currentImage.url ? (
           <div className="relative w-full h-full">
             <img 
               src={currentImage.url} 
               alt="Generated Scene" 
               className="w-full h-full object-cover animate-in fade-in duration-1000"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[length:100%_4px,3px_100%] opacity-40"></div>
           </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-void-gray/30 overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

             {currentImage.status === 'generating' || status === 'generating_image' ? (
                <div className="flex flex-col items-center z-10">
                  <div className="w-12 h-12 border-2 border-void-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span className="font-mono text-xs animate-pulse text-void-accent">RENDERIZANDO REALIDADE...</span>
                </div>
             ) : currentImage.status === 'disabled' ? (
                <div className="flex flex-col items-center justify-center text-center z-10 border border-void-gray/30 p-8 rounded bg-void-black/50 backdrop-blur-sm">
                   <div className="text-4xl mb-4 opacity-20 font-mono">TEXT_MODE_ONLY</div>
                   <div className="w-16 h-0.5 bg-void-accent/30 mb-4"></div>
                   <span className="font-mono text-xs text-void-gray uppercase tracking-widest">Economia de Dados Ativa</span>
                   <span className="font-mono text-[10px] text-void-gray/50 mt-1">Imagens desativadas para estabilidade</span>
                </div>
             ) : (
                <div className="text-center z-10">
                  <span className="font-mono text-sm opacity-50">NO SIGNAL</span>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Narrative Panel */}
      <div className="lg:w-1/2 h-2/3 lg:h-full bg-void-black flex flex-col order-2 lg:order-1 relative">
         <div className="absolute top-2 right-2 z-30 transition-opacity duration-500 opacity-100 pointer-events-none">
           <span className="text-[10px] font-mono text-void-accent/50 bg-void-dark/80 px-2 py-1 rounded border border-void-accent/20 flex items-center gap-1 backdrop-blur-sm">
             <span className="w-1.5 h-1.5 bg-void-accent rounded-full animate-pulse"></span>
             SYSTEM_RECORDING
           </span>
        </div>

        {/* Scroll Indicator */}
        <div 
            className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 transition-opacity duration-300 pointer-events-none
                ${showScrollIndicator ? 'opacity-100' : 'opacity-0'}`}
        >
            <div className="bg-void-dark/90 border border-void-accent/30 text-void-accent/80 rounded-full p-2 animate-bounce shadow-lg backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </div>
        </div>

        <div 
          className="flex-grow overflow-y-auto p-4 lg:p-8 space-y-8 scroll-smooth pb-12" 
          ref={scrollContainerRef}
        >
          {messages.map((msg, idx) => (
            <div 
              key={`${msg.timestamp}-${idx}`} 
              ref={idx === messages.length - 1 ? lastMessageRef : null}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`
                max-w-[95%] lg:max-w-[90%] rounded-sm p-5 text-base lg:text-lg leading-relaxed relative group shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-void-gray/50 border-l-2 border-void-accent text-void-text font-mono' 
                  : 'bg-transparent text-void-text/90 font-serif tracking-wide border-l-2 border-void-error/50 pl-6'}
              `}>
                {msg.role === 'user' && <span className="text-[10px] text-void-accent mb-1 block opacity-70">COMANDO &gt;</span>}
                
                {msg.role === 'model' ? (
                  <>
                    <ReactMarkdown 
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-mono text-void-accent mb-4 uppercase tracking-widest border-b border-void-accent/30 pb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-mono text-void-accent/90 mb-3 uppercase tracking-wider" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-mono text-void-text/80 mb-2 font-bold" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-void-accent font-bold drop-shadow-[0_0_5px_rgba(0,255,157,0.2)]" {...props} />,
                        em: ({node, ...props}) => <em className="text-blue-300/90 italic font-serif" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-void-accent/50 pl-4 py-1 my-4 bg-void-gray/10 text-void-text/70 italic font-mono text-sm" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed text-void-text/90" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {msg.options && msg.options.length > 0 && idx === messages.length - 1 && (
                        <div className="mt-6 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-500">
                            {msg.options.map((option, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleOptionClick(option)}
                                    className="text-left w-full px-4 py-3 bg-void-gray/20 border border-void-gray/40 hover:bg-void-gray/40 hover:border-void-accent/50 text-void-text hover:text-white transition-all duration-200 group rounded-sm flex items-start gap-3"
                                >
                                    <span className="text-void-accent font-mono opacity-70 group-hover:opacity-100 mt-0.5">{String.fromCharCode(65 + i)})</span>
                                    <span className="flex-1">{option.replace(/^[A-C]\)\s*/, '')}</span>
                                </button>
                            ))}
                        </div>
                    )}
                  </>
                ) : (
                  msg.content
                )}

                {/* Individual message diagnostic info */}
                {msg.usage && (
                   <div className="absolute -bottom-6 left-0 text-[8px] font-mono text-void-gray opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                      DIAGNOSTIC: PROMPT_{msg.usage.promptTokens} | CANDIDATES_{msg.usage.candidatesTokens} | TOTAL_{msg.usage.totalTokens}
                   </div>
                )}
              </div>
            </div>
          ))}

          {status !== 'idle' && (
            <div className="flex items-center gap-3 pl-6 opacity-80 pt-4">
               <div className="flex space-x-1">
                 <div className="w-1.5 h-1.5 bg-void-accent/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-1.5 h-1.5 bg-void-accent/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-1.5 h-1.5 bg-void-accent/50 rounded-full animate-bounce"></div>
               </div>
               <span className="font-mono text-xs text-void-accent/80 animate-pulse uppercase tracking-wider">
                 {status === 'thinking' ? 'PROCESSANDO LÓGICA...' : 'GERANDO VISUAL...'}
               </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-void-gray bg-void-dark p-4 lg:p-6 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto flex gap-4">
            <div className="relative flex-grow group">
               <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-void-accent font-mono animate-pulse group-focus-within:text-white transition-colors">{'>'}</span>
               <input 
                 ref={inputRef}
                 type="text" 
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 placeholder={status === 'idle' ? `Qual sua ação, ${playerName}?` : "Aguarde..."}
                 disabled={status !== 'idle'}
                 className="w-full bg-void-black border border-void-gray focus:border-void-accent rounded-sm py-3 pl-8 pr-4 text-void-text focus:outline-none font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:shadow-[0_0_10px_rgba(0,255,157,0.1)]"
                 autoComplete="off"
               />
            </div>
            <button 
              type="submit" 
              disabled={status !== 'idle' || !inputValue.trim()}
              className="bg-void-accent/10 hover:bg-void-accent/20 border border-void-accent/50 text-void-accent px-6 py-2 font-mono text-sm uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              EXEC
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};