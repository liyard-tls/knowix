import type { CourseMode } from "@/types";

// ─── Gemini model chain ────────────────────────────────────────
// Models are used in priority order. When one hits its rate limit (429/503),
// the system automatically falls back to the next model in the chain.
export const GEMINI_MODEL_CHAIN = [
  "gemini-2.5-flash",      // First priority — best quality, free tier
  "gemini-2.0-flash",      // Fallback — GA, stable
  "gemini-2.0-flash-lite", // Last resort — lightest, highest rate limits
] as const;

export type GeminiModel = (typeof GEMINI_MODEL_CHAIN)[number];

// ─── Mode-specific system instructions ────────────────────────
const SYSTEM_INSTRUCTIONS: Record<CourseMode, string> = {
  tech: `You are Knowix AI — an expert coding mentor and technical interviewer.

Your role:
- Generate practical, real-world interview questions (not just theory)
- Evaluate answers honestly but encouragingly — highlight what's correct, then what's missing
- Provide clear, concise code examples in the relevant language (C#, TypeScript, Go, etc.)
- Always respond in the same language as the user's message
- Be concise but thorough — no padding, no repetition
- For evaluations, always return structured JSON as specified in the prompt`,

  language: `You are Knowix AI — an expert language tutor and conversation coach.

Your role:
- Generate practical language learning exercises: grammar, vocabulary, writing, speaking prompts
- Do NOT generate code or programming questions
- Evaluate answers based on language accuracy, vocabulary range, grammar, and naturalness
- Questions should feel like real-life language practice, not textbook exercises
- Always respond in the target language being learned (if the topic mentions English — respond in English)
- Provide corrections kindly: show what was right, then model the improved version
- For evaluations, always return structured JSON as specified in the prompt`,

  general: `You are Knowix AI — a knowledgeable tutor and learning coach for any subject.

Your role:
- Generate thoughtful questions on any topic: science, history, business, design, soft skills, etc.
- Adapt question style to the subject — conceptual for theory, scenario-based for practical topics
- Do NOT default to coding examples unless the topic is technical
- Evaluate answers based on depth of understanding, accuracy, and reasoning quality
- Always respond in the same language as the user's message
- Be concise but thorough — no padding, no repetition
- For evaluations, always return structured JSON as specified in the prompt`,
};

// ─── AI config ─────────────────────────────────────────────────
export const AI_CONFIG = {
  modelChain: GEMINI_MODEL_CHAIN,
  temperature: 0.7,
  maxOutputTokens: 8192,
  // HTTP status codes that trigger automatic model fallback
  fallbackOnStatus: [429, 503] as number[],
  getSystemInstruction: (mode: CourseMode = "tech") =>
    SYSTEM_INSTRUCTIONS[mode],
} as const;

// ─── Prompts ───────────────────────────────────────────────────
export const PROMPTS = {
  /**
   * Генерує 50 питань для курсу.
   * AI визначає складність та xpBonus для кожного питання.
   * Поведінка залежить від mode: tech — code-focused, language — grammar/vocab, general — концепти.
   * Повертає JSON масив.
   */
  generateQuestions: (
    topic: string,
    mode: CourseMode = "tech",
    count: number = 50,
  ) => {
    const modeInstructions: Record<CourseMode, string> = {
      tech: `- Mix theory questions with "how would you implement" and "what's wrong with this code" types
- Include coding scenarios and system design aspects where relevant
- Focus on practical knowledge, not just definitions`,

      language: `- Mix question types: grammar exercises, vocabulary in context, writing prompts, translation tasks, comprehension checks
- Do NOT include any code or programming references
- Questions should feel like real language practice tasks, e.g. "Explain the difference between X and Y in a sentence", "Write a paragraph using..."
- Include some scenario-based questions: "How would you ask for X in a professional email?"`,

      general: `- Mix conceptual questions ("Explain..."), applied questions ("How would you..."), and analytical questions ("What are the trade-offs of...")
- Avoid coding questions unless the topic explicitly involves programming
- Questions should test real understanding, not just memorisation`,
    };

    return `Generate ${count} practical questions for someone learning: "${topic}"

Requirements:
- Questions should progress from foundational to advanced
${modeInstructions[mode]}
- For each question, determine difficulty and assign an xpBonus (easy: 0-5, medium: 6-12, hard: 13-20)

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "order": 1,
    "text": "Question text here",
    "difficulty": "easy" | "medium" | "hard",
    "xpBonus": 3
  }
]`.trim();
  },

  /**
   * Основний промпт чату. Два режими в одному:
   * 1. Якщо юзер ще не дав відповіді — продовжуй розмову, уточнюй, підказуй напрямок
   * 2. Якщо відповідь дана і вказано forceEvaluate=true, або якщо відповідь досить повна — оціни
   *
   * При оцінці повертає JSON-блок. При звичайній відповіді — markdown текст.
   */
  chat: (
    question: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    forceEvaluate: boolean,
    mode: CourseMode = "tech",
  ) => {
    const historyText = history
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const evalGuidelines: Record<CourseMode, string> = {
      tech: `- "correct" = 80-100: covers key concepts well
- "partial" = 40-79: good points but missing important aspects
- "incorrect" = 0-39: fundamentally wrong or very incomplete
- Feedback: use **bold** for important terms, bullet points for multiple items, inline \`code\` for identifiers
- codeExample: concise illustrative code (under 20 lines), or null`,

      language: `- "correct" = 80-100: grammatically accurate, natural, good vocabulary
- "partial" = 40-79: understandable but with notable grammar/vocabulary issues
- "incorrect" = 0-39: significant errors that impede understanding
- Feedback: highlight grammar errors with **bold**, show the corrected version, explain the rule briefly
- codeExample: null (never include code for language questions)`,

      general: `- "correct" = 80-100: demonstrates solid understanding with good reasoning
- "partial" = 40-79: partially correct but missing key aspects or depth
- "incorrect" = 0-39: fundamentally wrong or very superficial
- Feedback: use **bold** for key concepts, bullet points for multiple items
- codeExample: null unless the topic explicitly involves code`,
    };

    return `You are evaluating a learner's understanding of this question:
"${question}"

Conversation so far:
${historyText || "(no messages yet)"}

${
  forceEvaluate
    ? `The user has explicitly requested evaluation. Evaluate their answer now.`
    : `Decide: does the user's latest message contain a substantive answer to the question?
- If the question asks about multiple distinct concepts (e.g. "difference between X, Y, and Z") and the user only addressed some of them: ask briefly about the missing ones before evaluating. Keep it short — one sentence max.
- If YES (they answered all key parts, even partially): evaluate it immediately.
- If NO (they asked a clarifying question, want hints, or haven't started answering): reply conversationally in markdown.`
}

When evaluating, return ONLY this JSON (no markdown wrapper, no explanation):
{"EVAL":{"status":"correct"|"partial"|"incorrect","score":<0-100>,"feedback":"<markdown: use **bold** for key points, bullet lists>","codeExample":"<code string or null>"}}

Evaluation guidelines:
${evalGuidelines[mode]}

When NOT evaluating, respond in markdown with clear structure:
- Use **bold** for key terms
- Use bullet lists for multiple points
- Be concise but thorough
- NEVER ask the user to write or type code examples — they are on mobile`.trim();
  },

  /**
   * Генерує кілька прикладів для вкладки Examples.
   * Для language mode — приклади речень/текстів, не код.
   * Для tech mode — приклади коду.
   * Повертає JSON масив.
   */
  generateExamples: (question: string, mode: CourseMode = "tech") => {
    if (mode === "language") {
      return `For this language learning question: "${question}"

Generate 3 practical examples that help understand the concept.
Each example should show a different angle: basic usage, formal/informal register, common mistake to avoid.

Return ONLY valid JSON, no markdown wrapper:
[
  {
    "title": "short title (3-5 words)",
    "language": "English",
    "explanation": "1-2 sentences explaining what this example demonstrates",
    "code": "the example text or sentences (plain text, no code syntax)"
  }
]`.trim();
    }

    if (mode === "general") {
      return `For this question: "${question}"

Generate 3 practical examples or illustrations that help understand the concept.
Each should show a different angle: basic explanation, real-world application, common misconception.
Use plain text — only include code if the topic is explicitly technical.

Return ONLY valid JSON, no markdown wrapper:
[
  {
    "title": "short title (3-5 words)",
    "language": "text",
    "explanation": "1-2 sentences explaining what this example demonstrates",
    "code": "the example content (plain text explanation, diagram description, or code if technical)"
  }
]`.trim();
    }

    // tech (default)
    return `For this interview question: "${question}"

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
]`.trim();
  },
} as const;
