import { GoogleGenAI, Chat, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { SYSTEM_INSTRUCTION, GameResponse, TokenUsage } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 2.5 Flash for speed/cost/stability
const TEXT_MODEL = 'gemini-2.5-flash'; 
const IMAGE_MODEL = 'gemini-2.5-flash-image';

let chatSession: Chat | null = null;

const cleanJsonResponse = (text: string): string => {
  let clean = text.trim();
  clean = clean.replace(/^```json/i, '').replace(/^```/i, '');
  clean = clean.replace(/```$/i, '');
  return clean.trim();
};

export const initializeChat = (): void => {
  chatSession = ai.chats.create({
    model: TEXT_MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 1.0,
      responseMimeType: "application/json",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ]
    },
  });
};

const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

export const sendGameMessage = async (message: string): Promise<GameResponse> => {
  if (!chatSession) {
    initializeChat();
  }

  try {
    const apiCall = chatSession!.sendMessage({ message });
    const response = await Promise.race([apiCall, timeoutPromise(15000)]) as GenerateContentResponse;
    
    // Extract Token Usage
    const usage: TokenUsage | undefined = response.usageMetadata ? {
      promptTokens: response.usageMetadata.promptTokenCount || 0,
      candidatesTokens: response.usageMetadata.candidatesTokenCount || 0,
      totalTokens: response.usageMetadata.totalTokenCount || 0
    } : undefined;

    if (response.candidates && response.candidates[0] && response.candidates[0].finishReason !== "STOP") {
      if (response.candidates[0].finishReason === "SAFETY") {
        return {
           narrative: "## SISTEMA BLOQUEADO\n\nFiltro de segurança ativado. Tente reformular a ação.",
           options: ["Tentar Novamente", "/reset"],
           imagePrompt: "",
           usage
        };
      }
    }

    const text = response.text;

    if (!text) {
        throw new Error("Empty response");
    }

    let parsedData;
    try {
      const cleanedText = cleanJsonResponse(text);
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.warn("JSON Fallback triggered");
      return {
        narrative: text || "Erro na decodificação. O sistema falhou em estruturar a resposta.",
        options: ["Continuar", "/reset"],
        imagePrompt: "Static noise, glitch screen",
        usage
      };
    }

    return {
      narrative: parsedData.narrative || "Dados corrompidos...",
      options: parsedData.options || ["Continuar"],
      imagePrompt: parsedData.imagePrompt || "",
      usage
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    
    const errMessage = (error as Error).message || '';

    if (errMessage.includes('429') || errMessage.toLowerCase().includes('quota') || errMessage.toLowerCase().includes('resource exhausted')) {
       return {
         narrative: "## ⚠️ LIMITE DE ENERGIA ATINGIDO (429)\n\nO sistema V.O.I.D. excedeu a cota de processamento da API do Google.\n\n**O que fazer:**\n1. Aguarde cerca de **60 segundos**.\n2. Clique em **[Tentar Novamente]** abaixo.\n3. Se o erro persistir, o limite diário pode ter sido alcançado.",
         options: ["Tentar Novamente", "Aguardar", "/reset"],
         imagePrompt: ""
       };
    }

    if (errMessage === "Timeout") {
         return {
            narrative: "**ALERTA DE LATÊNCIA**: O Neural Link demorou muito para responder. A conexão pode estar instável.",
            options: ["Tentar Novamente (Reenviar)", "/reset"],
            imagePrompt: "" 
         };
    }

    return {
      narrative: `**ERRO DE CONEXÃO**: ${errMessage}`,
      options: ["Tentar Novamente", "/reset"],
      imagePrompt: ""
    };
  }
};

export const generateSceneImage = async (prompt: string): Promise<string | null> => {
  if (!prompt) return null;
  try {
    const apiCall = ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] },
    });
    const response = await Promise.race([apiCall, timeoutPromise(10000)]) as GenerateContentResponse;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const resetGame = () => {
  chatSession = null;
};