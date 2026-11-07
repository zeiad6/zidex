import { cn } from '@/lib/cn'

/**
 * The mark: a hexagon seal (sovereignty, a bounded system) with a Z cut
 * through it. Drawn rather than imported so it inherits currentColor and
 * stays crisp at 20px in the navbar and 40px in the footer.
 */
export function Logo({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <path
        d="M12 2.2 20.6 7v10L12 21.8 3.4 17V7z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M12 4.6 18.3 8.2v7.6L12 19.4 5.7 15.8V8.2z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity="0.18"
      />
      <path
        d="M9.1 8.9h5.8l-5.8 6.2h5.8"
        stroke="var(--color-jade-2)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
