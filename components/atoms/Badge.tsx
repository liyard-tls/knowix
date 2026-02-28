import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium rounded-[var(--radius-full)] whitespace-nowrap',
  {
    variants: {
      variant: {
        default:   'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
        accent:    'bg-[var(--accent-subtle)] text-[var(--accent)]',
        success:   'bg-[rgba(74,222,128,0.12)] text-[var(--success)]',
        warning:   'bg-[rgba(250,204,21,0.12)] text-[var(--warning)]',
        error:     'bg-[rgba(248,113,113,0.12)] text-[var(--error)]',
        partial:   'bg-[rgba(251,146,60,0.12)] text-[var(--partial)]',
        streak:    'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/20',
        xp:        'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/20',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {children}
    </span>
  )
}
