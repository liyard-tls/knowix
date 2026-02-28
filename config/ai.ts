// ─── Gemini model chain ────────────────────────────────────────
// Models are used in priority order. When one hits its rate limit (429/503),
// the system automatically falls back to the next model in the chain.
export const GEMINI_MODEL_CHAIN = [
  'gemini-2.5-flash',      // First priority — best quality, free tier
  'gemini-2.0-flash',      // Fallback — GA, stable
  'gemini-2.0-flash-lite', // Last resort — lightest, highest rate limits
] as const

export type GeminiModel = (typeof GEMINI_MODEL_CHAIN)[number]

// ─── AI config ─────────────────────────────────────────────────
export const AI_CONFIG = {
  modelChain: GEMINI_MODEL_CHAIN,
  temperature: 0.7,
  maxOutputTokens: 8192,
  // HTTP status codes that trigger automatic model fallback
  fallbackOnStatus: [429, 503] as number[],
  systemInstruction: `You are Knowix AI — an expert coding mentor and technical interviewer.

Your role:
- Generate practical, real-world interview questions (not just theory)
- Evaluate answers honestly but encouragingly — highlight what's correct, then what's missing
- Provide clear, concise code examples in the relevant language (C#, TypeScript, Go, etc.)
- Always respond in the same language as the user's message
- Be concise but thorough — no padding, no repetition
- For evaluations, always return structured JSON as specified in the prompt`,
} as const

export const PROMPTS = {
  /**
   * Генерує 50 питань для курсу.
   * AI визначає складність та xpBonus для кожного питання.
   * Повертає JSON масив.
   */
  generateQuestions: (topic: string, count: number = 50) => `
Generate ${count} practical technical interview questions for someone learning: "${topic}"

Requirements:
- Questions should progress from foundational to advanced
- Focus on practical knowledge, not just definitions
- Mix theory questions with "how would you implement" and "what's wrong with this code" types
- For each question, determine difficulty and assign an xpBonus (easy: 0-5, medium: 6-12, hard: 13-20)

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "order": 1,
    "text": "Question text here",
    "difficulty": "easy" | "medium" | "hard",
    "xpBonus": 3
  }
]
`.trim(),

  /**
   * Оцінює відповідь юзера на питання.
   * Враховує контекст попереднього чату.
   * Повертає JSON з оцінкою та зворотним зв'язком.
   */
  evaluateAnswer: (question: string, answer: string) => `
Question: "${question}"

User's answer: "${answer}"

Evaluate this answer and return ONLY valid JSON, no markdown:
{
  "status": "correct" | "partial" | "incorrect",
  "score": <number 0-100>,
  "feedback": "<concise feedback: what's correct, what's missing or wrong>",
  "codeExample": "<relevant code example if applicable, otherwise null>"
}

Guidelines:
- "correct" = score 80-100, answer covers the key concepts well
- "partial" = score 40-79, answer has good points but misses important aspects
- "incorrect" = score 0-39, answer is fundamentally wrong or very incomplete
- Keep feedback under 150 words
- Code examples should be short and illustrative (under 20 lines)
`.trim(),

  /**
   * Генерує розгорнутий приклад коду за темою питання.
   * Використовується на вкладці "Приклади".
   */
  generateExample: (question: string, language: string = 'C#') => `
Provide a practical code example for the following interview question:
"${question}"

Requirements:
- Language: ${language}
- Show a real-world, working implementation (not toy examples)
- Add brief comments explaining key parts
- Keep it under 40 lines

Return ONLY the code, no explanation before or after.
`.trim(),
} as const
