'use client'

import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number          // 0-100
  max?: number
  className?: string
  trackClassName?: string
  fillClassName?: string
  showLabel?: boolean
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'accent' | 'success' | 'xp'
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const variantMap = {
  accent:  'bg-[var(--accent)]',
  success: 'bg-[var(--success)]',
  xp:      'bg-gradient-to-r from-yellow-500 to-amber-400',
}

export function ProgressBar({
  value,
  max = 100,
  className,
  trackClassName,
  fillClassName,
  showLabel = false,
  animated = true,
  size = 'md',
  variant = 'accent',
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-[var(--radius-full)] bg-[var(--bg-elevated)] overflow-hidden',
          sizeMap[size],
          trackClassName
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-[var(--radius-full)]',
            variantMap[variant],
            animated && 'transition-[width] duration-[var(--duration-slow)] ease-out',
            fillClassName
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-[var(--text-muted)] text-right">
          {Math.round(percent)}%
        </p>
      )}
    </div>
  )
}
