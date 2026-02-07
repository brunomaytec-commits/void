import React, { useState } from 'react';

interface StartScreenProps {
  onStart: (name: string, prompt: string, useImages: boolean) => void;
  onLoad?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onLoad }) => {
  const [view, setView] = useState<'menu' | 'new'>('menu');
  const [name, setName] = useState('');
  const [useImages, setUseImages] = useState(true);
  
  const defaultPrompt = `Iniciar Sistema V.O.I.D.
Quero um preview completo da experiência. Apresente 3 cenários iniciais altamente imersivos e distintos para eu escolher:
Um cenário Cyberpunk em uma Marília futurista (ano 2099).
Um cenário de Fantasia Dark estilo "Dark Souls".
Um cenário de Mistério/Terror psicológico atual.
Aguardo as descrições e o prompt visual para o "Menu Principal" do jogo.`;

  const handleStartClick = () => {
    const finalName = name.trim() || "Viajante";
    const promptWithName = `${defaultPrompt}\n\nNota: O nome do jogador é "${finalName}".`;
    onStart(finalName, promptWithName, useImages);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[url('https://picsum.photos/1920/1080?grayscale&blur=10')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-black/80"></div>
      
      <div className="relative z-10 max-w-2xl w-full">
        <div className="mb-8 animate-pulse-slow">
          <svg className="w-24 h-24 mx-auto text-void-accent mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h1 className="text-6xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-void-accent to-blue-500">
            V.O.I.D.
          </h1>
          <p className="text-void-text/60 mt-2 font-mono tracking-widest text-sm">VIRTUAL OMNISCIENT INTERACTIVE DIRECTOR</p>
        </div>

        <div className="bg-void-black/90 p-8 rounded border border-void-gray shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur">
          {view === 'menu' ? (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setView('new')}
                className="group relative px-8 py-4 bg-void-accent/5 hover:bg-void-accent/10 border border-void-accent/20 hover:border-void-accent/50 transition-all duration-300"
              >
                <span className="absolute left-0 top-0 w-1 h-full bg-void-accent/50 group-hover:h-full transition-all duration-300 h-0"></span>
                <span className="font-mono text-xl text-void-accent tracking-widest uppercase">Nova História</span>
              </button>

              <button
                onClick={onLoad}
                disabled={!onLoad}
                className={`group relative px-8 py-4 border transition-all duration-300 ${
                  onLoad 
                    ? 'bg-void-gray/20 hover:bg-void-gray/40 border-void-gray hover:border-void-text/50 cursor-pointer' 
                    : 'bg-transparent border-void-gray/10 text-void-gray cursor-not-allowed opacity-50'
                }`}
              >
                <span className="font-mono text-xl tracking-widest uppercase">Continuar Jornada</span>
                {!onLoad && <span className="block text-[10px] mt-1 text-void-error font-mono">NENHUM DADO ENCONTRADO</span>}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-left">
                <label className="block text-void-accent text-xs font-mono mb-2 uppercase tracking-wider">Identificação do Operador</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome..."
                  className="w-full bg-void-dark border-b-2 border-void-gray focus:border-void-accent text-void-text px-4 py-3 focus:outline-none font-mono text-lg transition-colors placeholder-void-gray/30"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleStartClick()}
                />
              </div>

              {/* Economy Mode Toggle */}
              <div className="flex items-center justify-between bg-void-gray/20 p-3 rounded border border-void-gray/30">
                  <div className="flex flex-col text-left">
                      <span className="text-sm font-mono text-void-text">Gerar Imagens</span>
                      <span className="text-[10px] text-void-text/50">Alto consumo de dados/cota</span>
                  </div>
                  <button 
                    onClick={() => setUseImages(!useImages)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${useImages ? 'bg-void-accent' : 'bg-void-gray'}`}
                  >
                      <div className={`w-4 h-4 rounded-full bg-black shadow-md transform transition-transform duration-300 ${useImages ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setView('menu')}
                  className="px-4 py-2 text-void-text/50 hover:text-void-text font-mono text-xs uppercase"
                >
                  Voltar
                </button>
                <button
                  onClick={handleStartClick}
                  className="flex-grow bg-void-accent text-void-black font-bold py-3 px-6 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.6)] uppercase tracking-widest text-sm"
                >
                  Iniciar Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};