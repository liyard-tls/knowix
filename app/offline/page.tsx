export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6 text-center bg-[var(--bg-base)]">
      <div className="text-5xl">📡</div>
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">You&apos;re offline</h1>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">
        Check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
