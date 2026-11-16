export function MarkPaths() {
  return (
    <>
      <path d="M13 2v2.6M4.3 6.4l1.8 1.8M21.7 6.4l-1.8 1.8" />
      <path d="M5.5 16.5a7.5 7.5 0 0 1 15 0M1.5 16.5h23" />
      <path d="M3.5 22c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0M8 27.5c1.7-1.1 3.3-1.1 5 0s3.3 1.1 5 0" />
    </>
  )
}

export function LogoMark({ className = 'h-[26px] w-[22px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <MarkPaths />
    </svg>
  )
}
