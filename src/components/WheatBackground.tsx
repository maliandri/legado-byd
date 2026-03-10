'use client'

import { useEffect, useState } from 'react'

// threshold: scrollY mínimo para que aparezca cada espiga
const WHEAT_ITEMS = [
  { top: '12%', left: '1.5%',  scale: 1.1,  rotate: -15, threshold: 0,   delay: 0.2 },
  { top: '18%', left: '91%',   scale: 0.9,  rotate: 14,  threshold: 0,   delay: 0.4 },
  { top: '55%', left: '2%',    scale: 1.0,  rotate: -8,  threshold: 200, delay: 0.1 },
  { top: '60%', left: '92%',   scale: 1.2,  rotate: 22,  threshold: 200, delay: 0.3 },
  { top: '30%', left: '3%',    scale: 0.8,  rotate: -22, threshold: 400, delay: 0.2 },
  { top: '35%', left: '90%',   scale: 0.75, rotate: 18,  threshold: 400, delay: 0.1 },
  { top: '75%', left: '1%',    scale: 0.95, rotate: -12, threshold: 600, delay: 0.15 },
  { top: '80%', left: '93%',   scale: 0.85, rotate: 10,  threshold: 600, delay: 0.25 },
  { top: '45%', left: '46%',   scale: 0.5,  rotate: 5,   threshold: 300, delay: 0.3 },
  { top: '70%', left: '50%',   scale: 0.45, rotate: -6,  threshold: 500, delay: 0.2 },
]

function WheatSvg() {
  return (
    <svg viewBox="0 0 50 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <line x1="25" y1="125" x2="25" y2="8" stroke="#A0622A" strokeWidth="1.2" strokeLinecap="round"/>
      <ellipse cx="25" cy="12" rx="4" ry="9" fill="#C4A040" opacity="0.9"/>
      <ellipse cx="17" cy="28" rx="5.5" ry="9" fill="#C4A040" opacity="0.85" transform="rotate(-22 17 28)"/>
      <ellipse cx="15" cy="46" rx="5"   ry="8" fill="#C4A040" opacity="0.8"  transform="rotate(-26 15 46)"/>
      <ellipse cx="16" cy="63" rx="4.5" ry="7" fill="#C4A040" opacity="0.75" transform="rotate(-20 16 63)"/>
      <ellipse cx="17" cy="79" rx="4"   ry="6" fill="#C4A040" opacity="0.7"  transform="rotate(-15 17 79)"/>
      <ellipse cx="33" cy="36" rx="5.5" ry="9" fill="#C4A040" opacity="0.85" transform="rotate(22 33 36)"/>
      <ellipse cx="35" cy="54" rx="5"   ry="8" fill="#C4A040" opacity="0.8"  transform="rotate(26 35 54)"/>
      <ellipse cx="34" cy="71" rx="4.5" ry="7" fill="#C4A040" opacity="0.75" transform="rotate(20 34 71)"/>
      <ellipse cx="33" cy="87" rx="4"   ry="6" fill="#C4A040" opacity="0.7"  transform="rotate(15 33 87)"/>
      <line x1="25" y1="8"  x2="19" y2="2"  stroke="#A0622A" strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="25" y1="8"  x2="31" y2="2"  stroke="#A0622A" strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="17" y1="22" x2="10" y2="17" stroke="#A0622A" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="33" y1="30" x2="40" y2="25" stroke="#A0622A" strokeWidth="0.6" strokeLinecap="round"/>
    </svg>
  )
}

export default function WheatBackground() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    // Mostrar las de threshold:0 de inmediato
    setScrollY(0)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {WHEAT_ITEMS.map((item, i) => {
        const visible = scrollY >= item.threshold
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              width: `${60 * item.scale}px`,
              height: `${160 * item.scale}px`,
              transform: `rotate(${item.rotate}deg)`,
              opacity: visible ? 0.28 : 0,
              filter: visible ? 'blur(0px)' : 'blur(3px)',
              transition: `opacity 1.4s ease ${item.delay}s, filter 1.4s ease ${item.delay}s`,
              mixBlendMode: 'multiply',
            }}
          >
            <WheatSvg />
          </div>
        )
      })}
    </div>
  )
}
