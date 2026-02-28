/**
 * English UI strings — single source of truth for all UI text.
 * All components MUST use this file instead of hardcoding strings.
 *
 * Future i18n: replace with next-intl or react-i18next without touching components.
 */
export const en = {
  common: {
    loading: 'Loading',
    error: 'Something went wrong. Please try again.',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    days: 'days',
    questions: 'questions',
    xp: 'XP',
  },

  nav: {
    home: 'Home',
    courses: 'Courses',
    stats: 'Stats',
    profile: 'Profile',
  },

  drawer: {
    menu: 'Menu',
    closeMenu: 'Close menu',
    settings: 'Settings',
    about: 'About',
    signOut: 'Sign out',
  },

  login: {
    tagline: 'Learn through AI interviews',
    features: [
      { emoji: '🎯', text: 'AI generates 50 questions tailored to your goal' },
      { emoji: '🔥', text: 'Daily streaks and XP system' },
      { emoji: '💡', text: 'Instant feedback and code examples' },
    ],
    signInButton: 'Sign in with Google',
    disclaimer: 'Free. Your data is tied to your Google account.',
  },

  dashboard: {
    greeting: (name: string) => `Hey, ${name}!`,
    greetingFallback: 'Hey!',
    subtitle: 'Continue learning',
    streakDays: (n: number) => `${n} day streak`,
    myCourses: 'My Courses',
    newCourse: 'New Course',
    questionsProgress: (done: number, total: number) => `${done}/${total} questions`,
    empty: {
      title: 'No courses yet',
      description: 'Describe what you want to learn — AI will generate 50 questions',
      cta: 'Create your first course',
    },
    xpToNextLevel: (current: number, needed: number) => `${current} / ${needed} XP to next level`,
  },

  newCourse: {
    title: 'New Course',
    label: 'What do you want to learn or improve?',
    placeholder:
      "e.g. I want to move from Unity C# to backend development and prepare for interviews...",
    hint: 'AI will generate 50 questions tailored to your request',
    errorMinLength: 'Please describe what you want to learn (at least 10 characters)',
    examplesLabel: 'Or pick an example:',
    examples: [
      'Move from Unity C# to C# backend developer',
      'Learn ASP.NET Core from scratch',
      'Prepare for a React interview',
      'Understand Docker and Kubernetes',
      'SQL for backend developers',
    ],
    generating: {
      title: 'AI is generating questions...',
      subtitle: 'This usually takes 10–20 seconds',
    },
    submitButton: 'Generate 50 Questions',
  },

  stats: {
    title: 'Stats',
    streak: 'Streak',
    streakRecord: (n: number) => `Record: ${n} days`,
    xpLabel: 'XP',
    level: (lvl: number, title: string) => `Level ${lvl} — ${title}`,
    xpProgress: (current: number, needed: number, nextLvl: number) =>
      `${current} / ${needed} XP to level ${nextLvl}`,
    achievements: (unlocked: number, total: number) => `Achievements (${unlocked}/${total})`,
  },

  course: {
    questionCounter: (current: number, total: number) => `${current}/${total}`,
    tabs: {
      chat: 'Chat',
      examples: 'Examples',
    },
    inputPlaceholder: 'Type your answer...',
    statusLabels: {
      pending: 'Not answered',
      correct: 'Correct',
      partial: 'Partial',
      incorrect: 'Incorrect',
    },
    difficultyLabels: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
  },

  ai: {
    modelMenuTitle: 'AI Model',
    modelStatus: {
      active: 'Active',
      rateLimited: 'Rate limited',
    },
  },
} as const

export type Translations = typeof en
