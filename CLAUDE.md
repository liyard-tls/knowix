# Knowix — Файл-біблія проекту

> Цей файл є єдиним джерелом правди про стандарти, архітектуру та конвенції проекту.
> Перед будь-якими змінами — прочитай цей файл. Нові патерни додавай сюди.

---

## 1. Проект

**Knowix** — мобільний (mobile-first) веб-додаток для навчання через AI-співбесіди.
Користувач описує що хоче вивчити, AI генерує 50 питань, юзер відповідає у чаті, AI оцінює.
Геймифікація: стріки, XP, рівні, досягнення.

### 1.1 Мова інтерфейсу та локалізація

- **Мова за замовчуванням: English** — весь UI-текст англійською
- **Архітектура готова до локалізації**: всі рядки UI виносити в окремі об'єкти/константи, не хардкодити в JSX
- Шаблон: `lib/i18n/en.ts` (та майбутні `uk.ts`, `de.ts` тощо)
- У компонентах використовувати хук `useTranslations()` або передавати рядки через props — НЕ писати текст напряму в JSX

```ts
// ✅ Правильно — рядки в окремому файлі
// lib/i18n/en.ts
export const en = {
  dashboard: { title: 'Continue Learning', newCourse: 'New Course' },
  login: { signIn: 'Sign in with Google', tagline: 'Learn through AI interviews' },
}

// ❌ Неправильно — хардкод в JSX
<button>Продовжити навчання</button>
```

> **Примітка**: поки що використовуємо простий об'єкт `en.ts`. Повноцінний i18n (next-intl або react-i18next) додамо пізніше без переписування компонентів.

---

## 2. Стек

| Категорія | Технологія | Версія |
|---|---|---|
| Framework | Next.js (App Router) | 14+ |
| Мова | TypeScript | strict |
| Стилі | Tailwind CSS + shadcn/ui | latest |
| Анімації | Framer Motion | latest |
| AI | Google Gemini API (`gemini-1.5-flash`) | latest |
| База даних | Firebase Firestore | latest |
| Auth | Firebase Auth (Google Sign-In) | latest |
| Іконки | Lucide React | latest |
| Варіанти класів | class-variance-authority (cva) | latest |
| Утиліти класів | clsx + tailwind-merge | latest |
| Push нотіфікейшини | Web Push API + Service Worker | native |

---

## 3. Структура проекту

```
knowix/
├── CLAUDE.md                        # ← цей файл, читай перш за все
├── .env.local                       # секрети (не комітити)
├── .env.local.example               # шаблон змінних середовища
│
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout: providers + AppShell
│   ├── page.tsx                     # Redirect → /dashboard або /login
│   ├── (auth)/
│   │   └── login/page.tsx           # Google Sign-In екран
│   ├── dashboard/
│   │   └── page.tsx                 # Hero + список курсів
│   ├── course/
│   │   ├── new/page.tsx             # Форма створення курсу
│   │   └── [id]/
│   │       ├── page.tsx             # Список 50 питань
│   │       └── [questionId]/
│   │           └── page.tsx         # Split-screen чат
│   └── stats/
│       └── page.tsx                 # Статистика, стріки, досягнення
│
├── actions/                         # Next.js Server Actions ('use server')
│   ├── course.actions.ts            # createCourse, deleteCourse, regenQuestion
│   ├── gemini.actions.ts            # generateQuestions, evaluateAnswer
│   └── gamification.actions.ts      # updateStreak, addXP, unlockAchievement
│
├── components/
│   ├── atoms/                       # Presentational, без бізнес-логіки
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Spinner.tsx
│   │   └── Tabs.tsx
│   ├── molecules/                   # Комбінації atoms + мінімальна логіка
│   │   ├── CourseCard.tsx           # Картка курсу з градієнтом і прогресом
│   │   ├── QuestionItem.tsx         # Елемент списку питань зі статусом
│   │   ├── StreakBadge.tsx           # Вогонь + кількість днів
│   │   ├── XPBar.tsx                # XP прогрес до наступного рівня
│   │   └── XPPopup.tsx              # Анімований попап +XP
│   ├── organisms/                   # Складні компоненти з логікою/даними
│   │   ├── HeroStreak.tsx           # Hero-блок дашборду (стрік + XP + щоденна ціль)
│   │   ├── CourseGrid.tsx           # Список курсів
│   │   ├── QuestionList.tsx         # Список питань курсу з фільтрацією
│   │   ├── ChatScreen.tsx           # Split-screen чат контейнер
│   │   ├── ChatMessages.tsx         # Список повідомлень чату
│   │   ├── ChatInput.tsx            # Інпут + кнопки відправки
│   │   └── ExamplesTab.tsx          # Вкладка з прикладами коду від AI
│   └── layout/
│       ├── AppShell.tsx             # Root wrapper: safe-area, фон, провайдери
│       ├── BottomNav.tsx            # Мобільна навігація знизу
│       └── SideDrawer.tsx           # Бокове меню (налаштування, профіль)
│
├── config/
│   ├── ai.ts                        # Gemini модель, температура, ВСІ промпти
│   └── gamification.ts              # XP таблиця, рівні, досягнення, мультиплікатори
│
├── context/
│   ├── AuthContext.tsx              # Firebase Auth стан (user, loading, signIn, signOut)
│   ├── UserContext.tsx              # Streak, XP, level (синхронізується з Firestore)
│   └── index.ts                     # Barrel re-exports
│
├── hooks/
│   ├── useAuth.ts                   # useContext(AuthContext) + guard
│   ├── useStreak.ts                 # Читає/оновлює стрік
│   ├── useCourse.ts                 # CRUD для курсів
│   └── useXP.ts                     # addXP, getLevel, getProgress
│
├── lib/
│   ├── firebase.ts                  # Firebase client init (для браузера)
│   ├── firebase.server.ts           # Firebase Admin init (для Server Actions)
│   └── gemini.ts                    # Gemini client init
│
├── types/
│   ├── user.ts                      # User, UserStreak, UserProfile
│   ├── course.ts                    # Course, Question, QuestionStatus
│   ├── chat.ts                      # Message, ChatRole, EvaluationResult
│   ├── gamification.ts              # Achievement, XPEvent, Level
│   └── index.ts                     # Barrel: export type { ... } from './user' тощо
│
└── public/
    └── sw.js                        # Service Worker для Web Push нотіфікейшинів
```

---

## 4. Правила компонентів

### 4.1 Атомарний дизайн

```
atoms → molecules → organisms → pages
```

**atoms/** — тільки presentational. Не знають про Firebase, контекст, бізнес-логіку.
```tsx
// ✅ Правильно
<Button variant="primary" size="lg" onClick={onClick}>Продовжити</Button>

// ❌ Неправильно — atom не робить fetch
function Button() { const data = await fetch(...) }
```

**molecules/** — комбінують atoms, можуть приймати дані через props, мінімальна локальна логіка.

**organisms/** — можуть використовувати hooks, context, робити запити через Server Actions.

**layout/** — структурні компоненти (навігація, shell). Рендеряться один раз.

### 4.2 Правило: не дублювати компоненти

- **Завжди** шукай існуючий компонент перед створенням нового
- Якщо потрібна нова варіація — додай `variant` до існуючого
- Нова кнопка = новий `variant` у `Button.tsx`, НЕ новий файл

### 4.3 Іменування

| Тип | Конвенція | Приклад |
|---|---|---|
| Компоненти | PascalCase | `CourseCard.tsx` |
| Hooks | camelCase з use- | `useStreak.ts` |
| Actions | camelCase з дієсловом | `createCourse`, `generateQuestions` |
| Types/Interfaces | PascalCase | `interface Question` |
| Constants | SCREAMING_SNAKE_CASE | `XP_REWARDS` |
| CSS variables | kebab-case | `--accent` |

---

## 5. Design Tokens

### 5.1 CSS Variables (globals.css) — єдине джерело правди

```css
:root {
  /* Фони */
  --bg-base: #0d0d0d;        /* Головний фон */
  --bg-surface: #1a1a1e;     /* Картки, панелі */
  --bg-elevated: #242428;    /* Модалки, дропдауни */
  --bg-input: #2a2a2f;       /* Інпути */

  /* Акцент (стиль Claude) */
  --accent: #cc785c;
  --accent-hover: #b5684d;
  --accent-subtle: rgba(204, 120, 92, 0.12);

  /* Текст */
  --text-primary: #ececec;
  --text-secondary: #b4b4b4;
  --text-muted: #8e8ea0;
  --text-disabled: #555560;

  /* Межі */
  --border: #2f2f3a;
  --border-subtle: #1f1f28;

  /* Статуси */
  --success: #4ade80;
  --warning: #facc15;
  --error: #f87171;
  --partial: #fb923c;

  /* Радіуси */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Шрифти */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Тіні */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 20px rgba(204,120,92,0.2);

  /* Анімації */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 5.2 tailwind.config.ts

Всі кольори/радіуси мають посилатись на CSS variables через `var(--...)`.
Ніколи не хардкодити кольори напряму в tailwind.config.

---

## 6. TypeScript конвенції

### 6.1 Типи — центральний types/ + barrel

```ts
// ✅ Завжди імпортуй так:
import { Course, Question, Message } from '@/types'

// ❌ Ніколи не так:
import { Course } from '@/types/course'
import type { Question } from '../../types/course'
```

### 6.2 Ключові типи

```ts
// types/course.ts
export type QuestionStatus = 'pending' | 'correct' | 'partial' | 'incorrect'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  text: string
  status: QuestionStatus
  difficulty: QuestionDifficulty
  xpBonus: number          // Встановлюється AI при генерації курсу (0-20)
  xpEarned: number         // Нараховано юзеру після відповіді
  order: number            // Порядок у курсі (1-50)
  createdAt: number        // Unix timestamp
}

export interface Course {
  id: string
  userId: string
  title: string
  description: string      // Оригінальний запит юзера
  questions: Question[]
  createdAt: number
  updatedAt: number
  completedAt?: number
}

// types/chat.ts
export type ChatRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: ChatRole
  content: string
  timestamp: number
}

export interface EvaluationResult {
  status: QuestionStatus
  score: number            // 0-100
  feedback: string         // Пояснення від AI
  codeExample?: string     // Приклад коду (якщо є)
  xpEarned: number         // Нараховано (base + xpBonus) * streakMultiplier
}

// types/gamification.ts
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string             // emoji або lucide icon name
  unlockedAt?: number
}

export interface Level {
  level: number
  title: string
  minXP: number
  maxXP: number
}
```

### 6.3 Правила

- `strict: true` в tsconfig — завжди
- Ніколи не використовувати `any` — якщо не знаєш тип, використай `unknown`
- Props компонентів — interface, не type alias (для кращих повідомлень помилок)
- Enum — не використовувати, замість них union types (`'pending' | 'correct'`)

---

## 7. Server Actions

Всі виклики Gemini та Firebase Admin — тільки через Server Actions.

```ts
// actions/gemini.actions.ts
'use server'

import { geminiClient } from '@/lib/gemini'
import { PROMPTS, AI_CONFIG } from '@/config/ai'

export async function generateQuestions(topic: string): Promise<Question[]> {
  // ...
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  chatHistory: Message[]
): Promise<EvaluationResult> {
  // ...
}
```

**Правила:**
- `'use server'` — перший рядок файлу actions/
- Actions приймають прості типи або серіалізовані об'єкти
- Валідація вхідних даних на початку кожного action
- Помилки — throw з зрозумілим повідомленням

---

## 8. AI конфігурація (config/ai.ts)

Єдиний файл для всього що стосується AI.

### 8.1 Ланцюжок моделей Gemini (fallback по лімітах)

Моделі використовуються **по порядку**: коли вичерпується ліміт поточної — автоматично переходимо на наступну.

```ts
export const GEMINI_MODEL_CHAIN = [
  'gemini-2.5-pro',          // Найпотужніша — пріоритет
  'gemini-2.5-flash',        // Швидша, менший ліміт
  'gemini-2.5-flash-lite',   // Lite-версія
  'gemini-2.0-flash',        // Старша генерація
  'gemini-2.0-flash-lite',   // Fallback останній
] as const

export type GeminiModel = typeof GEMINI_MODEL_CHAIN[number]
```

**Логіка fallback:**
- При отриманні помилки 429 (quota exceeded) або 503 — переходимо на наступну модель
- Поточна активна модель зберігається в Firestore (`settings/ai.currentModel`)
- Якщо всі моделі вичерпані — показуємо повідомлення юзеру
- При новому дні (UTC) — скидаємося на першу модель (`gemini-2.5-pro`)

**UI індикатор поточної моделі:**
- У chat screen є кнопка (наприклад ⚙️ або ✨) яка відкриває маленьке меню/tooltip
- Там показується: назва поточної моделі + статус (active/rate-limited)
- Кнопка ручного перемикання на іншу модель (для tax-сейвінгу або тестування)

### 8.2 Правила конфігурації

```ts
export const AI_CONFIG = {
  modelChain: GEMINI_MODEL_CHAIN,
  currentModelIndex: 0,   // береться з Firestore
  temperature: 0.7,
  maxOutputTokens: 4096,
  systemInstruction: `...`,
} as const
```

**Правила промптів:**
- Промпти — тільки в `config/ai.ts`
- Промпти — функції, що приймають параметри і повертають рядок
- Якщо промпт довший за 10 рядків — додай JSDoc коментар що він робить

---

## 9. Gamification (config/gamification.ts)

```ts
// Базові XP за відповідь
export const XP_BASE = {
  correct: 30,
  partial: 15,
  incorrect: 5,
} as const

// xpBonus встановлюється AI при генерації питання (0-20)
// залежить від складності: easy=0-5, medium=6-12, hard=13-20

// Мультиплікатор стріку (застосовується до базових XP, не до xpBonus)
export const STREAK_MULTIPLIER: Record<number, number> = {
  7: 1.5,
  14: 1.75,
  30: 2.0,
}

// Формула: totalXP = (XP_BASE[status] * streakMultiplier) + question.xpBonus

// Бонус за завершення щоденної сесії (5 питань)
export const DAILY_BONUS_XP = 20

// Бонус за завершення всього курсу
export const COURSE_COMPLETE_XP = 100

// Рівні
export const LEVELS: Level[] = [
  { level: 1, title: 'Trainee',   minXP: 0,    maxXP: 199 },
  { level: 2, title: 'Junior',    minXP: 200,  maxXP: 499 },
  { level: 3, title: 'Middle',    minXP: 500,  maxXP: 999 },
  { level: 4, title: 'Senior',    minXP: 1000, maxXP: 1999 },
  { level: 5, title: 'Lead',      minXP: 2000, maxXP: 3999 },
  { level: 6, title: 'Principal', minXP: 4000, maxXP: Infinity },
]

// Досягнення
export const ACHIEVEMENTS = [
  { id: 'first_question', title: 'Перший крок', description: 'Відповів на перше питання', icon: '🎯' },
  { id: 'first_course',   title: 'Перший курс',  description: 'Створив перший курс', icon: '📚' },
  { id: 'streak_3',       title: '3 дні поспіль', description: 'Стрік 3 дні', icon: '🔥' },
  { id: 'streak_7',       title: 'Тижневик',      description: 'Стрік 7 днів', icon: '🔥🔥' },
  { id: 'streak_30',      title: 'Місяць!',       description: 'Стрік 30 днів', icon: '💎' },
  { id: 'perfect_5',      title: 'Ідеальна сесія', description: '5/5 правильних', icon: '⭐' },
  { id: 'course_done',    title: 'Курс завершено', description: 'Пройшов всі 50 питань', icon: '🏆' },
] as const
```

---

## 10. Firestore структура

```
users/{uid}
  displayName: string
  email: string
  photoURL: string
  createdAt: number
  xp: number
  level: number
  streak: {
    current: number
    longest: number
    lastActivity: number    // Unix timestamp (дата останньої відповіді)
  }
  achievements: string[]    # масив id розблокованих досягнень

courses/{courseId}
  userId: string
  title: string
  description: string
  createdAt: number
  updatedAt: number
  completedAt?: number
  questions: Question[]     # вбудований масив (до 50 питань)

chatHistory/{uid}_{courseId}_{questionId}
  messages: Message[]
  updatedAt: number
```

**Правила Firestore:**
- Питання зберігаються як вбудований масив у документі курсу (не окрема колекція)
- Це оптимально до 50 питань (Firestore ліміт документу 1MB)
- Chat history — окремий документ, щоб не роздувати курс

---

## 11. UI/UX стандарти

### 11.1 Mobile-first

- Всі компоненти розробляються спочатку для мобільного (375px+)
- Десктоп — адаптація через `md:` та `lg:` префікси Tailwind
- Максимальна ширина контенту: `max-w-md mx-auto` (448px) — як мобільний додаток
- Bottom Navigation — фіксована знизу, height: 64px + safe-area-inset-bottom

### 11.2 Навігація

```
Bottom Nav: [Головна] [Курси] [Статистика] [Профіль]
Side Drawer: Налаштування, Про додаток, Вийти
```

### 11.3 Екран питання (split screen)

```
┌─────────────────────────┐
│ ← 12/50 [назва]  [Skip] │  header (fixed)
│═════════════════════════│
│                         │
│  Питання тут            │  ~30% висоти (scrollable якщо довге)
│                         │
│═════════════════════════│
│  AI: відповідь...       │
│                         │  ~70% висоти (scrollable)
│  Ти: твоя відповідь     │
│                         │
│─────────────────────────│
│ [Чат] [Приклади]        │  tabs (fixed)
│ [Введи відповідь...  ↑] │  input (fixed above keyboard)
└─────────────────────────┘
```

### 11.4 Анімації (Framer Motion)

- Page transitions: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- XP popup: spring анімація знизу вгору, потім fade out
- Стрік вогонь: пульсуюча анімація при новому рекорді
- Skeleton loaders — замість спінерів для контенту
- Тривалість: fast=150ms, normal=250ms, slow=400ms

---

## 12. Змінні середовища (.env.local)

```bash
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server — ніколи NEXT_PUBLIC_)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Gemini AI
GEMINI_API_KEY=

# Web Push (опційно, для нотіфікейшинів)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

**Правила:**
- `NEXT_PUBLIC_` — тільки для некритичних даних (Firebase client config)
- API ключі без `NEXT_PUBLIC_` — ніколи не потрапляють у браузер
- `.env.local` — в `.gitignore`
- `.env.local.example` — комітити з placeholder значеннями

---

## 13. Правила розробки

### ✅ DO
- Читай цей файл перед кожною новою фічею
- Шукай існуючий компонент/хук перед створенням нового
- Типізуй все через `@/types`
- Промпти — тільки в `config/ai.ts`
- Gamification константи — тільки в `config/gamification.ts`
- Design tokens — тільки в `globals.css` + `tailwind.config.ts`
- Бізнес-логіка — в Server Actions або hooks, не в компонентах
- Mobile-first: спочатку мобільна верстка, потім адаптація

### ❌ DON'T
- Не хардкодь кольори напряму (`#cc785c` → використовуй `var(--accent)` або `text-accent`)
- Не створюй новий компонент якщо потрібна лише нова `variant`
- Не пиши бізнес-логіку в JSX-компонентах
- Не використовуй `any` в TypeScript
- Не роби прямі виклики Gemini з клієнту (тільки через Server Actions)
- Не зберігай API ключі в клієнтських змінних (`NEXT_PUBLIC_`)
- Не додавай `console.log` в production код
- Не використовуй inline styles (`style={{}}`) — тільки Tailwind

---

## 14. Контрольний список перед PR/комітом

- [ ] TypeScript без помилок (`npm run build`)
- [ ] Нові компоненти відповідають атомарному дизайну
- [ ] Нові кольори/відступи через CSS variables
- [ ] Нові типи додані в `types/` і експортовані з `types/index.ts`
- [ ] Промпти у `config/ai.ts`
- [ ] Gamification константи у `config/gamification.ts`
- [ ] Mobile-first верстка
- [ ] Анімації через Framer Motion (не CSS transitions для складних)
- [ ] Server Actions для всіх серверних операцій
