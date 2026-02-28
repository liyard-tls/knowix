export type ChatRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: ChatRole
  content: string
  timestamp: number
}

export interface EvaluationResult {
  status: 'correct' | 'partial' | 'incorrect'
  score: number         // 0-100
  feedback: string      // Пояснення від AI
  codeExample?: string  // Приклад коду (якщо є)
  xpEarned: number      // Нараховано після відповіді
}

export interface ChatSession {
  id: string            // uid_courseId_questionId
  messages: Message[]
  updatedAt: number
}
