'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

// ─── Shiki singleton ──────────────────────────────────────────────────────────
// One highlighter instance shared across all CodeBlock components.

type Highlighter = Awaited<ReturnType<typeof import('shiki').createHighlighter>>

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-dark'],
        langs: [
          'typescript',
          'tsx',
          'javascript',
          'jsx',
          'csharp',
          'go',
          'python',
          'rust',
          'java',
          'bash',
          'shell',
          'sql',
          'json',
          'yaml',
          'html',
          'css',
        ],
      })
    )
  }
  return highlighterPromise
}

// ─── Language normalizer ──────────────────────────────────────────────────────

const LANG_ALIASES: Record<string, string> = {
  'c#': 'csharp',
  cs: 'csharp',
  ts: 'typescript',
  js: 'javascript',
  sh: 'bash',
  zsh: 'bash',
  py: 'python',
  yml: 'yaml',
}

const SUPPORTED = new Set([
  'typescript', 'tsx', 'javascript', 'jsx', 'csharp', 'go', 'python',
  'rust', 'java', 'bash', 'shell', 'sql', 'json', 'yaml', 'html', 'css',
])

function normalizeLang(raw: string): string {
  const lower = raw.toLowerCase()
  const mapped = LANG_ALIASES[lower] ?? lower
  return SUPPORTED.has(mapped) ? mapped : 'bash'
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CodeBlockProps {
  code: string
  lang?: string
  className?: string
}

export function CodeBlock({ code, lang = 'bash', className }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const language = normalizeLang(lang)

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((hl) => {
      if (cancelled) return
      try {
        const result = hl.codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        })
        setHtml(result)
      } catch {
        setHtml(null)
      }
    })
    return () => { cancelled = true }
  }, [code, language])

  if (!html) {
    return (
      <pre className={cn(
        'overflow-x-auto rounded-[var(--radius-md)] bg-[#0d1117]',
        'border border-[var(--border)]',
        className
      )}>
        <code className="block px-4 py-3 text-xs leading-relaxed font-mono text-[var(--text-secondary)] whitespace-pre">
          {code}
        </code>
      </pre>
    )
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]',
        '[&>pre]:!bg-[#0d1117] [&>pre]:!m-0 [&>pre]:px-4 [&>pre]:py-3',
        '[&>pre>code]:!font-mono [&>pre>code]:!text-xs [&>pre>code]:!leading-relaxed',
        className
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
