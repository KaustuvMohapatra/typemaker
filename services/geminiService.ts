import { GoogleGenAI } from "@google/genai";
import { GameMode } from "../types";

const FALLBACK_TEXT_CASUAL = "the quick brown fox jumps over the lazy dog programming is the art of telling another human what one wants the computer to do simplicity is the soul of efficiency " + 
"learning to type faster requires practice and consistency never give up on your goals because consistency is key " +
"javascript react and typescript are powerful tools for building modern web applications " + 
"always strive for excellence in everything you do and success will follow " +
"the journey of a thousand miles begins with a single step so keep moving forward";

const FALLBACK_TEXT_COMP = "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do. Simplicity is the soul of efficiency. " +
"In the realm of computer science, algorithms are the fundamental building blocks of software. They dictate how data is processed and how tasks are executed. " +
"Artificial intelligence is rapidly transforming the world, enabling machines to learn from data and make decisions. " +
"Climate change is a pressing global issue that requires immediate attention and collective action from all nations.";

export const generateTypingPrompt = async (mode: GameMode): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found, using fallback text.");
    return mode === GameMode.CASUAL ? FALLBACK_TEXT_CASUAL : FALLBACK_TEXT_COMP;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let prompt = "";
    if (mode === GameMode.CASUAL) {
        // Requesting a significantly larger list (300 words) for "infinite" feel
        prompt = "Generate a list of 300 random, common English words. Output them as a single line of text, separated by spaces. All words must be in lowercase. Do not use any punctuation, numbers, or bullet points. Keep words simple and varied.";
    } else {
        prompt = "Generate a long, coherent, educational text about science, nature, or history. It should be approximately 250-300 words long. Use proper English punctuation, capitalization, and sentence structure. Ensure it flows well as a single paragraph.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // Removed maxOutputTokens as it requires thinkingBudget to be set for Gemini 2.5 models
        // and is generally not required for this use case.
        temperature: 0.9,
      }
    });

    const text = response.text?.trim();
    
    if (!text) return mode === GameMode.CASUAL ? FALLBACK_TEXT_CASUAL : FALLBACK_TEXT_COMP;

    // Extra sanitization for casual mode to ensure it meets requirements
    if (mode === GameMode.CASUAL) {
        return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "").replace(/\s{2,}/g, " ");
    }

    // Ensure competition text is single line for display purposes
    return text.replace(/\n/g, " ");
  } catch (error) {
    console.error("Failed to generate text from Gemini:", error);
    return mode === GameMode.CASUAL ? FALLBACK_TEXT_CASUAL : FALLBACK_TEXT_COMP;
  }
};