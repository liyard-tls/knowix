'use server'

import { GEMINI_MODEL_CHAIN, AI_CONFIG, type GeminiModel } from '@/config/ai'
import { getGeminiModel } from '@/lib/gemini'

interface GeminiCallResult {
  text: string
  modelUsed: GeminiModel
}

/**
 * Calls Gemini with automatic model fallback on 429/503.
 * Tries each model in GEMINI_MODEL_CHAIN until one succeeds.
 */
export async function callGeminiWithFallback(prompt: string): Promise<GeminiCallResult> {
  let lastError: unknown

  for (const model of GEMINI_MODEL_CHAIN) {
    try {
      const gemini = getGeminiModel(model)
      const result = await gemini.generateContent(prompt)
      const text = result.response.text()
      return { text, modelUsed: model }
    } catch (err: unknown) {
      const status = extractHttpStatus(err)
      if (status !== null && AI_CONFIG.fallbackOnStatus.includes(status)) {
        lastError = err
        continue // try next model
      }
      throw err // non-retryable error — propagate immediately
    }
  }

  throw lastError ?? new Error('All Gemini models failed')
}

function extractHttpStatus(err: unknown): number | null {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.status === 'number') return e.status
    if (typeof e.httpStatus === 'number') return e.httpStatus
    // Google SDK wraps errors in message strings like "[429 Too Many Requests]"
    if (typeof e.message === 'string') {
      const match = (e.message as string).match(/\[(\d{3})\s/)
      if (match) return parseInt(match[1], 10)
    }
  }
  return null
}
