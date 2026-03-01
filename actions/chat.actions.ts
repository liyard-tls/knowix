'use server'

import { PROMPTS } from '@/config/ai'
import { callGeminiWithFallback } from './gemini.actions'
import { NoApiKeyError } from '@/lib/errors'
import type { CourseMode } from '@/types'

export interface CodeExample {
  title: string
  language: string
  explanation: string
  code: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  content: string   // markdown reply text
  score: number     // 0-100 cumulative score of learner's understanding
}

/**
 * Sends a chat turn to Gemini.
 * AI always returns a score (0-100) and a conversational reply.
 * userKeys — user's own Gemini API keys passed from client.
 */
export async function sendChatMessage(
  questionText: string,
  history: ChatMessage[],
  _forceEvaluate: boolean,
  mode: CourseMode = 'tech',
  userKeys?: string[]
): Promise<ChatResponse> {
  const prompt = PROMPTS.chat(questionText, history, false, mode)
  let text: string
  try {
    const result = await callGeminiWithFallback(prompt, mode, userKeys)
    text = result.text
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('403') || msg.includes('API Key') || msg.includes('identity')) {
      throw new NoApiKeyError()
    }
    throw err
  }

  // Parse {"SCORE":<n>,"REPLY":"<text>"}
  // Strategy 1 & 2: strip optional markdown fences, then JSON.parse the whole thing
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  for (const attempt of [text.trim(), cleaned]) {
    if (!attempt) continue
    try {
      const raw = JSON.parse(attempt) as { SCORE?: number; REPLY?: string }
      if (typeof raw.SCORE === 'number' && typeof raw.REPLY === 'string') {
        return {
          score: Math.min(100, Math.max(0, raw.SCORE)),
          content: raw.REPLY.trim(),
        }
      }
    } catch {
      // try next strategy
    }
  }

  // Strategy 3: regex — extract SCORE and REPLY independently
  // Handles cases where the REPLY string contains unescaped quotes or newlines
  const scoreMatch = cleaned.match(/"SCORE"\s*:\s*(\d+)/)
  const replyMatch = cleaned.match(/"REPLY"\s*:\s*"([\s\S]*?)"\s*\}/)
  if (scoreMatch && replyMatch) {
    const score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)))
    return { score, content: replyMatch[1].replace(/\\n/g, '\n').trim() }
  }

  // Fallback: treat raw text as reply, score unknown → -1 (sentinel: no score to show)
  return { score: -1, content: text.trim() }
}

/**
 * Generates 3 code examples for the Examples tab.
 * userKeys — user's own Gemini API keys passed from client.
 */
export async function generateExamples(
  questionText: string,
  mode: CourseMode = 'tech',
  userKeys?: string[]
): Promise<CodeExample[]> {
  const prompt = PROMPTS.generateExamples(questionText, mode)
  let text: string
  try {
    const result = await callGeminiWithFallback(prompt, mode, userKeys)
    text = result.text
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('403') || msg.includes('API Key') || msg.includes('identity')) {
      throw new NoApiKeyError()
    }
    throw err
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed as CodeExample[]
  } catch {
    // ignore
  }
  return []
}
