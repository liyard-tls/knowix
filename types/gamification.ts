export interface Achievement {
  id: string
  title: string
  description: string
  icon: string          // emoji
  unlockedAt?: number   // Unix timestamp — якщо не встановлено, ще не розблоковано
}

export interface Level {
  level: number
  title: string
  minXP: number
  maxXP: number         // Infinity для останнього рівня
}

export interface XPEvent {
  type: 'answer' | 'daily_bonus' | 'course_complete' | 'achievement'
  amount: number
  timestamp: number
  questionId?: string
  courseId?: string
}
