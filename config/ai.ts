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
   * Основний промпт чату. Два режими в одному:
   * 1. Якщо юзер ще не дав відповіді — продовжуй розмову, уточнюй, підказуй напрямок
   * 2. Якщо відповідь дана і вказано forceEvaluate=true, або якщо відповідь досить повна — оціни
   *
   * При оцінці повертає JSON-блок. При звичайній відповіді — markdown текст.
   */
  chat: (
    question: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    forceEvaluate: boolean
  ) => {
    const historyText = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    return `You are evaluating a learner's understanding of this interview question:
"${question}"

Conversation so far:
${historyText || '(no messages yet)'}

${forceEvaluate
  ? `The user has explicitly requested evaluation. Evaluate their answer now.`
  : `Decide: does the user's latest message contain a substantive answer to the question?
- If YES (they attempted to answer): evaluate it.
- If NO (they asked a follow-up, want clarification, or are continuing discussion): reply conversationally in markdown.`
}

When evaluating, return ONLY this JSON (no markdown wrapper, no explanation):
{"EVAL":{"status":"correct"|"partial"|"incorrect","score":<0-100>,"feedback":"<markdown: use **bold** for key points, bullet lists, short code snippets>","codeExample":"<code string or null>"}}

Evaluation guidelines:
- "correct" = 80-100: covers key concepts well
- "partial" = 40-79: good points but missing important aspects
- "incorrect" = 0-39: fundamentally wrong or very incomplete
- Feedback: use **bold** for important terms, bullet points for multiple items, inline \`code\` for identifiers
- codeExample: concise illustrative code (under 20 lines), or null

When NOT evaluating, respond in markdown with clear structure:
- Use **bold** for key terms
- Use \`inline code\` for identifiers, types, methods
- Use bullet lists for multiple points
- Be concise but thorough`.trim()
  },

  /**
   * Явна оцінка без контексту (використовується тільки якщо треба re-evaluate).
   */
  evaluateAnswer: (question: string, answer: string) => `
Question: "${question}"

User's answer: "${answer}"

Evaluate and return ONLY valid JSON, no markdown wrapper:
{"EVAL":{"status":"correct"|"partial"|"incorrect","score":<0-100>,"feedback":"<markdown feedback>","codeExample":"<code or null>"}}

- "correct" = 80-100, "partial" = 40-79, "incorrect" = 0-39
- Feedback: use **bold** for key points, bullet lists, inline \`code\`
- codeExample: under 20 lines or null
`.trim(),

  /**
   * Генерує кілька прикладів коду для вкладки Examples.
   * Повертає JSON масив прикладів з назвою, поясненням і кодом.
   */
  generateExamples: (question: string) => `
For this interview question: "${question}"

Generate 3 practical code examples that help understand the concept.
Each example should show a different angle: basic usage, real-world scenario, common pitfall or edge case.

Return ONLY valid JSON, no markdown wrapper:
[
  {
    "title": "short title (3-5 words)",
    "language": "language name (e.g. C#, TypeScript, Go)",
    "explanation": "1-2 sentences explaining what this example demonstrates",
    "code": "the code (under 30 lines, well-commented)"
  }
]
`.trim(),
} as const
