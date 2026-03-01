'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Key, Plus, Trash2, ExternalLink, Check } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUserContext } from '@/context'
import { AppShell } from '@/components/layout'
import { Button, Card } from '@/components/atoms'
import { t } from '@/lib/i18n'

function maskKey(key: string): string {
  return t.settings.geminiKeys.keyMasked(key)
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { profile } = useUserContext()

  const [keys, setKeys] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingIdx, setRemovingIdx] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  // Sync keys from profile
  useEffect(() => {
    if (profile?.geminiKeys) setKeys(profile.geminiKeys)
  }, [profile?.geminiKeys])

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  if (authLoading || !user) return null

  const saveKeys = async (updatedKeys: string[]) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { geminiKeys: updatedKeys })
  }

  const handleAddKey = async () => {
    const trimmed = newKey.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const updated = [...keys, trimmed]
      await saveKeys(updated)
      setKeys(updated)
      setNewKey('')
      setAdding(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (idx: number) => {
    setRemovingIdx(idx)
    try {
      const updated = keys.filter((_, i) => i !== idx)
      await saveKeys(updated)
      setKeys(updated)
    } finally {
      setRemovingIdx(null)
    }
  }

  return (
    <AppShell showNav={false}>
      <div className="min-h-dvh flex flex-col px-4 pt-safe pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t.settings.title}</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Gemini API Keys section */}
          <Card variant="elevated" padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {t.settings.geminiKeys.sectionTitle}
              </h2>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto flex items-center gap-1 text-xs text-[var(--success)]"
                >
                  <Check className="h-3 w-3" />
                  Saved
                </motion.span>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t.settings.geminiKeys.description}
            </p>

            {/* Keys list */}
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {keys.length === 0 && !adding ? (
                  <p className="text-xs text-[var(--text-disabled)] py-1">
                    {t.settings.geminiKeys.empty}
                  </p>
                ) : (
                  keys.map((key, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border)]"
                    >
                      <span className="text-xs font-mono text-[var(--text-secondary)] truncate">
                        {maskKey(key)}
                      </span>
                      <button
                        onClick={() => handleRemove(idx)}
                        disabled={removingIdx === idx}
                        className="flex-shrink-0 p-1 rounded text-[var(--text-disabled)] hover:text-[var(--error)] transition-colors disabled:opacity-50"
                        aria-label={t.settings.geminiKeys.remove}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}

                {/* Add key input */}
                {adding && (
                  <motion.div
                    key="add-input"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2"
                  >
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder={t.settings.geminiKeys.placeholder}
                      autoFocus
                      className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] text-xs font-mono focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddKey()
                        if (e.key === 'Escape') { setAdding(false); setNewKey('') }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={handleAddKey}
                        loading={saving}
                        disabled={!newKey.trim()}
                      >
                        {t.settings.geminiKeys.saveKey}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setAdding(false); setNewKey('') }}
                        disabled={saving}
                      >
                        {t.common.cancel}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add key button */}
            {!adding && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setAdding(true)}
                className="self-start"
              >
                {t.settings.geminiKeys.addKey}
              </Button>
            )}

            {/* Link to Google AI Studio */}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {t.settings.geminiKeys.getKeyLink}
            </a>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
