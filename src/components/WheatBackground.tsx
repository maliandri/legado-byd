'use client'

import { useEffect, useRef } from 'react'

const WHEAT_POSITIONS = [
  { top: '8%',  left: '2%',   scale: 1.1, rotate: -18, delay: 0 },
  { top: '18%', left: '91%',  scale: 0.85, rotate: 14, delay: 0.1 },
  { top: '32%', left: '4%',   scale: 0.7,  rotate: -8, delay: 0.15 },
  { top: '44%', left: '94%',  scale: 1.2,  rotate: 22, delay: 0.05 },
  { top: '56%', left: '1%',   scale: 0.9,  rotate: -25, delay: 0.2 },
  { top: '66%', left: '89%',  scale: 0.75, rotate: 10, delay: 0.1 },
  { top: '78%', left: '6%',   scale: 1.0,  rotate: -12, delay: 0.25 },
  { top: '88%', left: '92%',  scale: 0.8,  rotate: 18, delay: 0.05 },
  { top: '22%', left: '48%',  scale: 0.5,  rotate: 5,  delay: 0.3 },
  { top: '62%', left: '52%',  scale: 0.45, rotate: -6, delay: 0.2 },
]

function WheatSvg() {
  return (
    <svg viewBox="0 0 50 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Tallo principal */}
      <line x1="25" y1="125" x2="25" y2="8" stroke="#A0622A" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Espiga superior */}
      <ellipse cx="25" cy="12" rx="4" ry="9" fill="#C4A040" opacity="0.9"/>
      {/* Granos izquierda */}
      <ellipse cx="17" cy="28" rx="5.5" ry="9" fill="#C4A040" opacity="0.85" transform="rotate(-22 17 28)"/>
      <ellipse cx="15" cy="46" rx="5"   ry="8" fill="#C4A040" opacity="0.8"  transform="rotate(-26 15 46)"/>
      <ellipse cx="16" cy="63" rx="4.5" ry="7" fill="#C4A040" opacity="0.75" transform="rotate(-20 16 63)"/>
      <ellipse cx="17" cy="79" rx="4"   ry="6" fill="#C4A040" opacity="0.7"  transform="rotate(-15 17 79)"/>
      {/* Granos derecha */}
      <ellipse cx="33" cy="36" rx="5.5" ry="9" fill="#C4A040" opacity="0.85" transform="rotate(22 33 36)"/>
      <ellipse cx="35" cy="54" rx="5"   ry="8" fill="#C4A040" opacity="0.8"  transform="rotate(26 35 54)"/>
      <ellipse cx="34" cy="71" rx="4.5" ry="7" fill="#C4A040" opacity="0.75" transform="rotate(20 34 71)"/>
      <ellipse cx="33" cy="87" rx="4"   ry="6" fill="#C4A040" opacity="0.7"  transform="rotate(15 33 87)"/>
      {/* Barbas (bigotes) */}
      <line x1="25" y1="8"  x2="19" y2="2"  stroke="#A0622A" strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="25" y1="8"  x2="31" y2="2"  stroke="#A0622A" strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="17" y1="22" x2="10" y2="17" stroke="#A0622A" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="33" y1="30" x2="40" y2="25" stroke="#A0622A" strokeWidth="0.6" strokeLinecap="round"/>
    </svg>
  )
}

export default function WheatBackground() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    refs.current.forEach((el) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('wheat-visible')
            obs.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {WHEAT_POSITIONS.map((pos, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className="wheat-item"
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            width: `${60 * pos.scale}px`,
            height: `${160 * pos.scale}px`,
            transform: `rotate(${pos.rotate}deg)`,
            transitionDelay: `${pos.delay}s`,
          }}
        >
          <WheatSvg />
        </div>
      ))}
    </div>
  )
}
