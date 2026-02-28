import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const cardVariants = cva(
  'rounded-[var(--radius-lg)] border border-[var(--border)] transition-all duration-[var(--duration-normal)]',
  {
    variants: {
      variant: {
        default:  'bg-[var(--bg-surface)]',
        elevated: 'bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]',
        gradient: 'border-transparent bg-gradient-to-br',
        glass:    'bg-[rgba(26,26,30,0.8)] backdrop-blur-xl border-[var(--border)]',
      },
      padding: {
        none: '',
        sm:   'p-3',
        md:   'p-4',
        lg:   'p-6',
      },
      interactive: {
        true:  'cursor-pointer hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)] active:scale-[0.99]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  gradient?: string // наприклад 'from-purple-900/40 to-blue-900/40'
}

export function Card({
  className,
  variant,
  padding,
  interactive,
  gradient,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, padding, interactive }), gradient, className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}
