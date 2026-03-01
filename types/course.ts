export type QuestionStatus = 'pending' | 'correct' | 'partial' | 'incorrect'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'
export type CourseMode = 'tech' | 'language' | 'general'

export interface Question {
  id: string
  text: string
  status: QuestionStatus
  difficulty: QuestionDifficulty
  xpBonus: number   // Визначається AI при генерації курсу (0-20)
  xpEarned: number  // Нараховано юзеру після відповіді (0 якщо ще не відповів)
  order: number     // Порядок у курсі (1-50)
  createdAt: number
}

export interface Course {
  id: string
  userId: string
  title: string
  description: string  // Оригінальний запит юзера
  mode: CourseMode     // Режим курсу — впливає на промпти AI
  questions: Question[]
  isPublic: boolean    // true — курс видимий іншим юзерам (sharing)
  createdAt: number
  updatedAt: number
  completedAt?: number
}
