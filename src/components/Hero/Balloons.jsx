import { useId } from 'react'
import { cx } from '../../lib/cx.js'
import styles from './Balloons.module.css'

/* Decorative balloon bouquet (SVG). Each balloon floats on its own rhythm. */

const BALLOONS = [
  { cx: 150, cy: 120, rx: 58, ry: 70, from: '#cfe5ff', to: '#6fa9ef', knotY: 192, string: 'M150 196 C 138 250, 168 300, 150 360 S 140 440, 168 520', delay: 0 },
  { cx: 82, cy: 178, rx: 48, ry: 58, from: '#e6e8ff', to: '#8f98ee', knotY: 238, string: 'M82 240 C 96 290, 70 330, 104 380 S 150 470, 168 520', delay: -1.8 },
  { cx: 222, cy: 196, rx: 46, ry: 56, from: '#ffffff', to: '#bcd9fb', knotY: 254, string: 'M222 256 C 206 300, 232 350, 200 400 S 170 480, 168 520', delay: -3.1 },
  { cx: 160, cy: 262, rx: 38, ry: 46, from: '#fff9e0', to: '#ffd98a', knotY: 310, string: 'M160 312 C 172 350, 150 390, 166 440 S 170 500, 168 520', delay: -2.4 },
]

export function Balloons({ className }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className={cx(styles.balloons, className)} viewBox="0 0 300 540" aria-hidden="true" focusable="false">
      <defs>
        {BALLOONS.map((balloon, index) => (
          <radialGradient key={index} id={`${uid}-b${index}`} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor={balloon.from} />
            <stop offset="1" stopColor={balloon.to} />
          </radialGradient>
        ))}
      </defs>
      {BALLOONS.map((balloon, index) => (
        <g key={index} className={styles.balloon} style={{ '--delay': `${balloon.delay}s`, '--dur': `${6 + index * 0.9}s` }}>
          <path d={balloon.string} className={styles.string} />
          <ellipse cx={balloon.cx} cy={balloon.cy} rx={balloon.rx} ry={balloon.ry} fill={`url(#${uid}-b${index})`} />
          <ellipse
            cx={balloon.cx - balloon.rx * 0.38}
            cy={balloon.cy - balloon.ry * 0.42}
            rx={balloon.rx * 0.16}
            ry={balloon.ry * 0.24}
            className={styles.shine}
            transform={`rotate(-24 ${balloon.cx - balloon.rx * 0.38} ${balloon.cy - balloon.ry * 0.42})`}
          />
          <path
            d={`M${balloon.cx - 7} ${balloon.knotY + 4} L${balloon.cx} ${balloon.knotY - 4} L${balloon.cx + 7} ${balloon.knotY + 4} Z`}
            fill={balloon.to}
          />
        </g>
      ))}
      <path d="M150 512 c -18 -14 -40 -6 -36 8 c 4 14 30 10 36 -8 c 6 18 32 22 36 8 c 4 -14 -18 -22 -36 -8 z" className={styles.bow} />
    </svg>
  )
}
