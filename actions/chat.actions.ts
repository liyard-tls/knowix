'use server'

import { PROMPTS } from '@/config/ai'
import { callGeminiWithFallback } from './gemini.actions'
import type { EvaluationResult, CourseMode } from '@/types'

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
  type: 'message' | 'evaluation'
  content: string                          // markdown text (for type=message)
  evaluation?: Omit<EvaluationResult, 'xpEarned'>  // present when type=evaluation
}

/**
 * Sends a chat turn to Gemini.
 * AI decides whether to reply conversationally or evaluate.
 * If forceEvaluate=true — always evaluates.
 * userKeys — user's own Gemini API keys passed from client.
 */
export async function sendChatMessage(
  questionText: string,
  history: ChatMessage[],
  forceEvaluate: boolean,
  mode: CourseMode = 'tech',
  userKeys?: string[]
): Promise<ChatResponse> {
  const prompt = PROMPTS.chat(questionText, history, forceEvaluate, mode)
  const { text } = await callGeminiWithFallback(prompt, mode, userKeys)

  // Check if AI returned an evaluation JSON block
  const evalMatch = text.match(/\{"EVAL":\s*(\{[\s\S]*?\})\s*\}/)
  if (evalMatch) {
    try {
      const raw = JSON.parse(evalMatch[1]) as {
        status: 'correct' | 'partial' | 'incorrect'
        score: number
        feedback: string
        codeExample?: string | null
      }
      const validStatuses = ['correct', 'partial', 'incorrect'] as const
      if (!validStatuses.includes(raw.status)) throw new Error('invalid status')

      return {
        type: 'evaluation',
        content: raw.feedback ?? '',
        evaluation: {
          status: raw.status,
          score: Math.min(100, Math.max(0, raw.score ?? 50)),
          feedback: raw.feedback ?? '',
          codeExample: raw.codeExample ?? undefined,
        },
      }
    } catch {
      // Failed to parse eval — fall through to treat as message
    }
  }

  return { type: 'message', content: text.trim() }
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
  const { text } = await callGeminiWithFallback(prompt, mode, userKeys)

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
