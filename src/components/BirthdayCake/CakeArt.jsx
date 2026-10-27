import { useId } from 'react'

/* The illustrated two-tier cake on a glass stand (decorative SVG). */

import { BASE, TOP } from './cakeGeometry.js'

const frontY = (x, tier) => tier.cy + tier.ry * Math.sqrt(Math.max(0, 1 - ((x - tier.cx) / tier.rx) ** 2))

const DRIPS = [126, 141, 156, 170, 184, 199, 214, 228, 243, 258, 272].map((x, i) => ({ x, len: [12, 22, 9, 26, 14, 30, 11, 24, 16, 20, 10][i] }))
const PEARLS = Array.from({ length: 23 }, (_, i) => 66 + i * 12)
const SPRINKLES = [
  [92, 258, 0], [128, 246, 1], [170, 262, 2], [214, 250, 0], [256, 264, 1], [298, 248, 2], [318, 268, 0],
  [80, 300, 1], [150, 306, 0], [236, 310, 2], [306, 300, 1], [112, 288, 2],
]

export function CakeArt({ className }) {
  const uid = useId().replace(/:/g, '')
  const id = (name) => `${uid}-${name}`
  return (
    <svg className={className} viewBox="0 0 400 380" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id('base')} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#a9c9f5" />
          <stop offset="0.45" stopColor="#dcebff" />
          <stop offset="0.6" stopColor="#e6f0ff" />
          <stop offset="1" stopColor="#a3c2f0" />
        </linearGradient>
        <linearGradient id={id('top')} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e3e9fb" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde4f8" />
        </linearGradient>
        <linearGradient id={id('ribbon')} x1="0" x2="1">
          <stop offset="0" stopColor="#8d98ec" />
          <stop offset="0.5" stopColor="#aab2f7" />
          <stop offset="1" stopColor="#7f8ae6" />
        </linearGradient>
        <linearGradient id={id('glass')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#d5e6fb" stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id={id('shadow')}>
          <stop offset="0" stopColor="#1f4a85" stopOpacity="0.28" />
          <stop offset="1" stopColor="#1f4a85" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* stand */}
      <ellipse cx="200" cy="374" rx="120" ry="7" fill={`url(#${id('shadow')})`} />
      <path d="M178 338 L168 366 Q200 374 232 366 L222 338 Z" fill={`url(#${id('glass')})`} stroke="#bcd3f3" strokeWidth="1.5" />
      <ellipse cx="200" cy="366" rx="56" ry="8" fill="#eef5ff" stroke="#bcd3f3" strokeWidth="1.5" />
      <ellipse cx="200" cy="334" rx="176" ry="24" fill={`url(#${id('glass')})`} stroke="#bcd3f3" strokeWidth="1.5" />
      <ellipse cx="200" cy="330" rx="160" ry="17" fill="#ffffff" opacity="0.6" />

      {/* bottom tier */}
      <path d={`M58 ${BASE.cy} L58 ${BASE.bottom} A${BASE.rx} ${BASE.ry} 0 0 0 342 ${BASE.bottom} L342 ${BASE.cy} Z`} fill={`url(#${id('base')})`} />
      <path d={`M58 282 A${BASE.rx} ${BASE.ry} 0 0 0 342 282 L342 298 A${BASE.rx} ${BASE.ry} 0 0 1 58 298 Z`} fill={`url(#${id('ribbon')})`} />
      <path d="M200 314 c-16 -12 -36 -4 -32 8 c4 10 26 6 32 -8 z M200 314 c16 -12 36 -4 32 8 c-4 10 -26 6 -32 -8 z" fill="#a5adf6" stroke="#7f8ae6" strokeWidth="1.5" />
      <circle cx="200" cy="313" r="5" fill="#7f8ae6" />
      {SPRINKLES.map(([x, y, tone], i) => (
        <circle key={i} cx={x} cy={y} r={tone === 2 ? 2.6 : 2.1} fill={tone === 0 ? '#ffffff' : tone === 1 ? '#fff1b8' : '#c5cbff'} />
      ))}
      <ellipse cx={BASE.cx} cy={BASE.cy} rx={BASE.rx} ry={BASE.ry} fill="#f2f7ff" />
      <path d={`M58 ${BASE.cy} A${BASE.rx} ${BASE.ry} 0 0 0 342 ${BASE.cy}`} fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" />
      {PEARLS.map((x) => (
        <circle key={x} cx={x} cy={frontY(x, BASE) + 5} r="3.6" fill="#ffffff" stroke="#d6e4fa" strokeWidth="1" />
      ))}

      {/* top tier */}
      <path d={`M118 ${TOP.cy} L118 ${TOP.bottom} A${TOP.rx} ${TOP.ry} 0 0 0 282 ${TOP.bottom} L282 ${TOP.cy} Z`} fill={`url(#${id('top')})`} />
      <ellipse cx={TOP.cx} cy={TOP.bottom} rx={TOP.rx} ry={TOP.ry} fill="none" stroke="#c9d6f3" strokeWidth="1" opacity="0.6" />
      {DRIPS.map(({ x, len }) => (
        <rect key={x} x={x - 5} y={frontY(x, TOP) - 4} width="10" height={len} rx="5" fill="#a5b4f4" />
      ))}
      <ellipse cx={TOP.cx} cy={TOP.cy} rx={TOP.rx} ry={TOP.ry} fill="#f7f9ff" />
      <path d={`M118 ${TOP.cy} A${TOP.rx} ${TOP.ry} 0 0 0 282 ${TOP.cy}`} fill="none" stroke="#a5b4f4" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx={TOP.cx} cy={TOP.cy - 1} rx={TOP.rx - 6} ry={TOP.ry - 4} fill="#ffffff" opacity="0.85" />
    </svg>
  )
}
