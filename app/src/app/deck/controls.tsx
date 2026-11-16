'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export function DeckControls() {
  useEffect(() => {
    const go = (dir: number) => {
      const slides = [...document.querySelectorAll<HTMLElement>('.slide')]
      const mid = window.scrollY + window.innerHeight / 2
      const k = slides.findIndex((s) => s.offsetTop <= mid && s.offsetTop + s.offsetHeight > mid)
      slides[Math.min(slides.length - 1, Math.max(0, k + dir))]?.scrollIntoView({ behavior: 'smooth' })
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        go(1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="deck-controls">
      <Link href="/">Home</Link>
      <a href="/halcyon-deck.pdf" download>
        Download PDF
      </a>
    </div>
  )
}
