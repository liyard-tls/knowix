'use server'

import { GEMINI_MODEL_CHAIN, AI_CONFIG, type GeminiModel } from '@/config/ai'
import { getGeminiModel } from '@/lib/gemini'
import type { CourseMode } from '@/types'

interface GeminiCallResult {
  text: string
  modelUsed: GeminiModel
}

/**
 * Calls Gemini with automatic key×model fallback on 429/503.
 * Tries each user key (or env key as fallback) × each model in GEMINI_MODEL_CHAIN.
 * mode — determines the system instruction (persona) for the AI.
 * userKeys — user's own Gemini API keys; if empty falls back to GEMINI_API_KEY env var.
 */
export async function callGeminiWithFallback(
  prompt: string,
  mode: CourseMode = 'tech',
  userKeys?: string[]
): Promise<GeminiCallResult> {
  // Use user's keys if provided (non-empty strings only), else fall back to env key
  const keysToTry = userKeys?.filter(Boolean).length
    ? userKeys.filter(Boolean)
    : [process.env.GEMINI_API_KEY ?? '']

  let lastError: unknown

  for (const apiKey of keysToTry) {
    for (const model of GEMINI_MODEL_CHAIN) {
      try {
        const gemini = getGeminiModel(model, AI_CONFIG.getSystemInstruction(mode), apiKey)
        const result = await gemini.generateContent(prompt)
        const text = result.response.text()
        return { text, modelUsed: model }
      } catch (err: unknown) {
        const status = extractHttpStatus(err)
        if (status !== null && AI_CONFIG.fallbackOnStatus.includes(status)) {
          lastError = err
          continue // try next model for this key
        }
        throw err // non-retryable error — propagate immediately
      }
    }
    // All models exhausted for this key — try next key
  }

  throw lastError ?? new Error('All Gemini keys and models failed')
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
