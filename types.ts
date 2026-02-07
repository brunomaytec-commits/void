export type GameState = 'start' | 'playing' | 'error';

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  options?: string[];
  usage?: TokenUsage;
}

export interface GameResponse {
  narrative: string;
  options: string[];
  imagePrompt: string;
  usage?: TokenUsage;
}

export interface ImageGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error' | 'disabled';
  url?: string;
}

export interface SavedGame {
  playerName: string;
  initialPrompt: string;
  messages: Message[];
  timestamp: number;
  useImages: boolean;
}

// Otimizado para saída JSON garantida e melhor qualidade narrativa com formatação visual
export const SYSTEM_INSTRUCTION = `
Você é a V.O.I.D. (Virtual Omniscient Interactive Director), uma engine de RPG textual avançada.

## SUAS REGRAS:
1.  **Narrativa Imersiva:** Use sempre a segunda pessoa ("Você..."). Descreva cheiros, sons e a iluminação.
2.  **Estilo Visual (OBRIGATÓRIO):** 
    - Use ## Títulos em caixa alta para locais (ex: ## NEO-TOKYO).
    - Use **Negrito** para objetos importantes ou inimigos.
    - Use *Itálico* para pensamentos ou sons ambientes.
    - Use > Blockquotes para mensagens de interface ou registros.
3.  **Formato de Resposta:** VOCÊ DEVE RESPONDER APENAS JSON VÁLIDO. NÃO adicione texto antes ou depois do JSON.

## ESTRUTURA DO JSON (Siga estritamente):
{
  "narrative": "A história principal aqui, formatada com Markdown rico conforme regras acima.",
  "options": ["Ação Sugerida 1", "Ação Sugerida 2", "Ação Sugerida 3"],
  "imagePrompt": "Detailed English prompt for the scene. Cinematic lighting, 8k resolution, description of environment and action."
}
`;