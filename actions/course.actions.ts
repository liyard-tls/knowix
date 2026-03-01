'use server'

import { PROMPTS } from '@/config/ai'
import { callGeminiWithFallback } from './gemini.actions'
import type { Question, QuestionDifficulty, CourseMode } from '@/types'

interface RawQuestion {
  order: number
  text: string
  difficulty: QuestionDifficulty
  xpBonus: number
}

/**
 * Generates questions via Gemini and returns them.
 * Firestore write is done on the client (authenticated user context).
 */
export async function generateQuestions(
  description: string,
  mode: CourseMode = 'tech',
  count: number = 50
): Promise<Question[]> {
  const prompt = PROMPTS.generateQuestions(description, mode, count)
  const { text } = await callGeminiWithFallback(prompt, mode)

  const rawQuestions = parseQuestionsJson(text)

  if (rawQuestions.length === 0) {
    throw new Error('AI returned an empty question list')
  }

  const now = Date.now()
  return rawQuestions.map((q, i) => ({
    id: `q${String(i + 1).padStart(3, '0')}`,
    text: q.text ?? '',
    status: 'pending',
    difficulty: q.difficulty ?? 'medium',
    xpBonus: typeof q.xpBonus === 'number' ? q.xpBonus : 5,
    xpEarned: 0,
    order: q.order ?? i + 1,
    createdAt: now,
  }))
}

function parseQuestionsJson(text: string): RawQuestion[] {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // fall through to recovery
  }

  // Recovery: extract all complete {...} objects (handles truncated output)
  const objects: RawQuestion[] = []
  const objectRegex = /\{[^{}]*"order"\s*:\s*(\d+)[^{}]*"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,[^{}]*"difficulty"\s*:\s*"(easy|medium|hard)"[^{}]*"xpBonus"\s*:\s*(\d+)[^{}]*\}/g

  let match: RegExpExecArray | null
  while ((match = objectRegex.exec(cleaned)) !== null) {
    try {
      objects.push(JSON.parse(match[0]))
    } catch {
      // skip malformed object
    }
  }

  if (objects.length > 0) {
    console.warn(`Recovered ${objects.length} questions from truncated AI output`)
    return objects
  }

  throw new Error(`AI returned unparseable JSON (length: ${cleaned.length})`)
}
