import React, { useState, useEffect, useMemo } from 'react';
import { GameInterface } from './components/GameInterface';
import { StartScreen } from './components/StartScreen';
import { GameState, SavedGame, Message } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  
  // Controls whether we are starting fresh or loading
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [useImages, setUseImages] = useState<boolean>(true); // Default to true
  
  // Session ID forces a clean mount only when explicitly starting a new game/loading
  const [sessionId, setSessionId] = useState<number>(0);

  // Constants for Gemini 2.5 Flash
  const CONTEXT_LIMIT = 1000000;

  // Calculate Token Metrics
  const tokenMetrics = useMemo(() => {
    const metrics = sessionMessages.reduce((acc, msg) => {
      if (msg.usage) {
        acc.accumulated += msg.usage.totalTokens;
        acc.currentContext = msg.usage.promptTokens + msg.usage.candidatesTokens;
      }
      return acc;
    }, { accumulated: 0, currentContext: 0 });

    const percentage = Math.min((metrics.currentContext / CONTEXT_LIMIT) * 100, 100);
    return { ...metrics, percentage };
  }, [sessionMessages]);

  // Check for saved game on mount
  useEffect(() => {
    const loadSave = () => {
      const saved = localStorage.getItem('void_savegame');
      if (saved) {
        try {
          setSavedGame(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load save", e);
        }
      }
    };
    loadSave();
  }, [gameState]);

  const handleStart = (name: string, customPrompt: string, enableImages: boolean) => {
    setPlayerName(name);
    setInitialPrompt(customPrompt);
    setUseImages(enableImages);
    setSessionMessages([]); 
    setSessionId(Date.now());
    setGameState('playing');
  };

  const handleLoadGame = () => {
    if (savedGame) {
      setPlayerName(savedGame.playerName);
      setInitialPrompt(savedGame.initialPrompt);
      setUseImages(savedGame.useImages ?? true);
      setSessionMessages(savedGame.messages);
      setSessionId(savedGame.timestamp);
      setGameState('playing');
    }
  };

  const handleReset = () => {
    localStorage.removeItem('void_savegame');
    setSavedGame(null);
    setSessionMessages([]);
    setGameState('start');
    setInitialPrompt('');
    setPlayerName('');
  };

  const handleSyncMessages = (msgs: Message[]) => {
    setSessionMessages(msgs);
  };

  return (
    <div className="min-h-screen bg-void-black text-void-text font-sans selection:bg-void-accent selection:text-void-black overflow-hidden flex flex-col">
      <header className="border-b border-void-gray p-4 flex flex-col md:flex-row justify-between items-center bg-void-black/80 backdrop-blur-md z-50 sticky top-0 gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-wider font-mono text-void-accent flex items-center gap-2">
            <span className="w-2 h-2 bg-void-accent rounded-full animate-pulse"></span>
            V.O.I.D.
          </h1>
          {gameState === 'playing' && (
            <div className="h-4 w-[1px] bg-void-gray hidden md:block"></div>
          )}
          {gameState === 'playing' && (
             <div className="flex items-center gap-3 font-mono text-[10px] text-void-text/40 tracking-widest uppercase">
                <span className={useImages ? 'text-void-accent/60' : ''}>VISUAL_{useImages ? 'ON' : 'OFF'}</span>
                <span>OP_{playerName || 'UNKNOWN'}</span>
             </div>
          )}
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-6 w-full md:w-auto">
            {/* Advanced Tokenometer with Progress Bar */}
            <div className="flex flex-col flex-grow md:flex-grow-0 min-w-[180px] font-mono">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] uppercase tracking-tighter text-void-gray">Neural_Context_Load</span>
                <span className="text-[10px] text-void-accent tabular-nums">
                  {tokenMetrics.currentContext.toLocaleString()} <span className="text-void-gray">/ 1.0M</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-void-gray/30 rounded-full overflow-hidden border border-void-gray/50 p-[1px]">
                <div 
                  className="h-full bg-void-accent transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,157,0.5)]" 
                  style={{ width: `${Math.max(tokenMetrics.percentage, 1)}%` }}
                ></div>
              </div>
              <div className="mt-1 flex justify-between text-[8px] uppercase text-void-gray/60">
                <span>0.0M</span>
                <span className="text-void-accent/40 italic">Accumulated: {tokenMetrics.accumulated.toLocaleString()}</span>
                <span>1.0M</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setGameState('start')}
                className="text-[10px] border border-void-gray text-void-gray px-3 py-1 hover:bg-void-gray hover:text-white transition-all uppercase tracking-widest"
              >
                Menu
              </button>
              <button 
                onClick={handleReset}
                className="text-[10px] border border-void-error/50 text-void-error/50 px-3 py-1 hover:bg-void-error hover:text-white transition-all uppercase tracking-widest"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow relative">
        {gameState === 'start' ? (
          <StartScreen onStart={handleStart} onLoad={savedGame ? handleLoadGame : undefined} />
        ) : (
          <GameInterface 
            key={sessionId}
            initialPrompt={initialPrompt} 
            playerName={playerName} 
            onReset={handleReset}
            initialMessages={sessionMessages}
            onSyncMessages={handleSyncMessages}
            useImages={useImages}
          />
        )}
      </main>
    </div>
  );
};

export default App;