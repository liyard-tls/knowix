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
    modeLabel: 'What type of course?',
    modes: {
      tech: {
        label: 'Tech / IT',
        description: 'Coding, system design, interviews',
        emoji: '💻',
      },
      language: {
        label: 'Language',
        description: 'Grammar, vocabulary, writing',
        emoji: '🗣️',
      },
      general: {
        label: 'General',
        description: 'Science, business, any topic',
        emoji: '🧠',
      },
    },
    label: 'What do you want to learn or improve?',
    placeholders: {
      tech: 'e.g. Move from Unity C# to backend development, prepare for React interviews...',
      language: 'e.g. Improve my English writing skills, learn formal business vocabulary...',
      general: 'e.g. Learn the basics of macroeconomics, understand stoic philosophy...',
    },
    hint: 'AI will generate 50 questions tailored to your request',
    errorMinLength: 'Please describe what you want to learn (at least 10 characters)',
    examplesLabel: 'Or pick an example:',
    examples: {
      tech: [
        'Move from Unity C# to C# backend developer',
        'Learn ASP.NET Core from scratch',
        'Prepare for a React interview',
        'Understand Docker and Kubernetes',
        'SQL for backend developers',
      ],
      language: [
        'Improve my English writing for professional emails',
        'Learn formal vs informal English registers',
        'Practice English grammar — conditionals and tenses',
        'Expand vocabulary for business meetings',
        'Prepare for IELTS writing and speaking',
      ],
      general: [
        'Understand the basics of macroeconomics',
        'Learn stoic philosophy and its practical applications',
        'Prepare for a product management interview',
        'Understand UX design principles',
        'Learn the fundamentals of personal finance',
      ],
    },
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

  courses: {
    title: 'Courses',
    wip: {
      title: 'Coming Soon',
      description: 'Browse and discover courses created by other learners. Share your knowledge and explore new topics.',
      badge: 'Work in Progress',
    },
    myCoursesSection: 'My Courses',
    exploreSection: 'Explore',
    explore: {
      empty: 'No public courses yet. Be the first to share one!',
      likes: (n: number) => `${n}`,
      forks: (n: number) => `${n}`,
      makePublic: 'Share publicly',
      makePrivate: 'Make private',
      fork: 'Add to my courses',
      forked: 'Added',
      questionsCount: (n: number) => `${n} questions`,
      learners: (n: number) => `${n} learner${n === 1 ? '' : 's'}`,
      join: 'Join Course',
      alreadyJoined: 'Open My Copy',
      goToCourse: 'Go to Course',
      like: 'Like',
      liked: 'Liked',
    },
  },

  profile: {
    title: 'Profile',
    signOut: 'Sign Out',
    editProfile: 'Edit Profile',
    joinedLabel: 'Joined',
    statsSection: 'Your Stats',
    coursesSection: 'My Courses',
    coursesCount: (n: number) => `${n} ${n === 1 ? 'course' : 'courses'}`,
    questionsAnswered: (n: number) => `${n} questions answered`,
    memberSince: (date: string) => `Member since ${date}`,
  },

  settings: {
    title: 'Settings',
    geminiKeys: {
      sectionTitle: 'Gemini API Keys',
      description: 'Add your own Gemini API keys. When one hits its rate limit, the app automatically tries the next one.',
      getKeyLink: 'Get your API key at aistudio.google.com',
      addKey: 'Add Key',
      saveKey: 'Save',
      placeholder: 'Paste your API key (AIza...)',
      empty: 'No keys added. The app will use the default server key.',
      remove: 'Remove',
      keyMasked: (key: string) => `${key.slice(0, 8)}...${key.slice(-4)}`,
    },
  },

  friends: {
    title: 'Friends',
    copyLink: 'Copy My Link',
    linkCopied: 'Link copied!',
    addFriend: 'Add Friend',
    requestSent: 'Request Sent',
    alreadyFriends: 'Friends ✓',
    acceptRequest: 'Accept Request',
    incomingRequests: 'Friend Requests',
    accept: 'Accept',
    decline: 'Decline',
    remove: 'Remove Friend',
    empty: {
      title: 'No friends yet',
      description: 'Copy your profile link and share it with people you know',
    },
  },
} as const

export type Translations = typeof en
