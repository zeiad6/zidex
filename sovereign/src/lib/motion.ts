import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

/**
 * One registration point. GSAP 3.13+ ships every plugin free, so SplitText
 * is the real plugin — not a hand-rolled word splitter.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

// Mobile browsers fire resize when the URL bar collapses; without this the
// pinned timeline re-measures mid-scroll and jumps.
ScrollTrigger.config({ ignoreMobileResize: true })

gsap.defaults({ ease: 'power3.out' })

export const EASE = {
  expo: 'expo.out',
  power: 'power3.out',
  spring: 'back.out(1.5)',
} as const

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function finePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
