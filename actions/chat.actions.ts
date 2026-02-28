'use server'

import { PROMPTS } from '@/config/ai'
import { callGeminiWithFallback } from './gemini.actions'
import type { EvaluationResult } from '@/types'

interface RawEvaluation {
  status: 'correct' | 'partial' | 'incorrect'
  score: number
  feedback: string
  codeExample?: string | null
}

/**
 * Sends the user's answer to Gemini and returns a structured evaluation.
 * XP calculation is done client-side (needs streak context).
 */
export async function evaluateAnswer(
  questionText: string,
  userAnswer: string
): Promise<Omit<EvaluationResult, 'xpEarned'>> {
  const prompt = PROMPTS.evaluateAnswer(questionText, userAnswer)
  const { text } = await callGeminiWithFallback(prompt)

  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  let raw: RawEvaluation
  try {
    raw = JSON.parse(cleaned)
  } catch {
    throw new Error(`AI returned invalid evaluation JSON: ${cleaned.slice(0, 200)}`)
  }

  const validStatuses = ['correct', 'partial', 'incorrect'] as const
  if (!validStatuses.includes(raw.status)) {
    throw new Error(`Invalid status from AI: ${raw.status}`)
  }

  return {
    status: raw.status,
    score: typeof raw.score === 'number' ? Math.min(100, Math.max(0, raw.score)) : 50,
    feedback: raw.feedback ?? '',
    codeExample: raw.codeExample ?? undefined,
  }
}
