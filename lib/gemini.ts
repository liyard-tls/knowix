import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG, GEMINI_MODEL_CHAIN, type GeminiModel } from '@/config/ai'

/**
 * Returns a Gemini model instance for a given model name.
 * systemInstruction — mode-specific persona (tech/language/general).
 * apiKey — optional per-user key; falls back to GEMINI_API_KEY env var.
 * Model selection and fallback logic is handled in Server Actions (gemini.actions.ts).
 */
export function getGeminiModel(model: GeminiModel, systemInstruction?: string, apiKey?: string) {
  const key = apiKey ?? process.env.GEMINI_API_KEY ?? ''
  const genAI = new GoogleGenerativeAI(key)

  // Allow env override for local testing / manual switching
  const resolvedModel = (process.env.GEMINI_MODEL_OVERRIDE as GeminiModel) ?? model

  return genAI.getGenerativeModel({
    model: resolvedModel,
    generationConfig: {
      temperature: AI_CONFIG.temperature,
      maxOutputTokens: AI_CONFIG.maxOutputTokens,
    },
    systemInstruction: systemInstruction ?? AI_CONFIG.getSystemInstruction('tech'),
  })
}

/** Default model instance (first in chain). Used for simple one-off calls. */
export const geminiModel = getGeminiModel(GEMINI_MODEL_CHAIN[0])
