import { useId } from 'react'
import { createRng, range } from '../../lib/random.js'
import styles from './SkyBackdrop.module.css'

/*
 * The fixed sky behind every chapter: pastel gradient, a soft sun halo,
 * slowly drifting clouds, twinkling sparkles and a few rising hearts.
 * Replaces the legacy 80 emoji hearts that were moved with left/top on
 * every animation frame — everything here is a CSS transform/opacity loop.
 * Purely decorative: aria-hidden, pointer-events: none.
 */

const rng = createRng(18052026)

const CLOUDS = [
  { x: -6, y: 6, w: 34, o: 0.95, d: 120, layer: 'far' },
  { x: 58, y: 3, w: 26, o: 0.8, d: 150, layer: 'far' },
  { x: 76, y: 30, w: 38, o: 0.9, d: 110, layer: 'mid' },
  { x: -10, y: 44, w: 30, o: 0.75, d: 135, layer: 'mid' },
  { x: 30, y: 70, w: 44, o: 0.7, d: 160, layer: 'near' },
  { x: 82, y: 78, w: 30, o: 0.6, d: 125, layer: 'near' },
]

const SPARKLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: range(rng, 2, 98),
  y: range(rng, 3, 92),
  size: range(rng, 8, 18),
  delay: -range(rng, 0, 6),
  duration: range(rng, 3.5, 7),
  tone: index % 3,
}))

const HEARTS = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  x: range(rng, 4, 96),
  size: range(rng, 12, 24),
  delay: -range(rng, 0, 26),
  duration: range(rng, 22, 34),
  sway: range(rng, 4, 7),
  tone: index % 3,
}))

function Cloud({ className, style }) {
  const gradientId = useId()
  return (
    <svg className={className} style={style} viewBox="0 0 240 112" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="8" x2="0" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f6faff" />
          <stop offset="1" stopColor="#dfeafc" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>
        <ellipse cx="120" cy="82" rx="112" ry="26" />
        <circle cx="72" cy="66" r="32" />
        <circle cx="122" cy="50" r="44" />
        <circle cx="170" cy="66" r="30" />
        <circle cx="200" cy="80" r="20" />
        <circle cx="38" cy="82" r="22" />
      </g>
    </svg>
  )
}

function SparkleShape() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 0c.9 6.6 4.7 10.6 12 12-7.3 1.4-11.1 5.4-12 12-.9-6.6-4.7-10.6-12-12C7.3 10.6 11.1 6.6 12 0z" />
    </svg>
  )
}

function HeartShape() {
  return (
    <svg viewBox="0 0 24 22" focusable="false">
      <path d="M12 21.6S1.2 14.8.2 7.9C-.6 2.6 5.2-1.6 9.6 2.2c1 .9 1.8 1.9 2.4 2.9.6-1 1.4-2 2.4-2.9 4.4-3.8 10.2.4 9.4 5.7-1 6.9-11.8 13.7-11.8 13.7z" />
    </svg>
  )
}

export function SkyBackdrop() {
  return (
    <div className={styles.sky} aria-hidden="true">
      <div className={styles.sun} />
      <div className={styles.haze} />

      {CLOUDS.map((cloud, index) => (
        <Cloud
          key={index}
          className={`${styles.cloud} ${styles[cloud.layer]}`}
          style={{
            '--x': `${cloud.x}%`,
            '--y': `${cloud.y}%`,
            '--w': `${cloud.w}vw`,
            '--o': cloud.o,
            '--d': `${cloud.d}s`,
            '--delay': `${-index * 13}s`,
          }}
        />
      ))}

      {SPARKLES.map((sparkle) => (
        <span
          key={sparkle.id}
          className={`${styles.sparkle} ${styles[`tone${sparkle.tone}`]}`}
          style={{
            '--x': `${sparkle.x}%`,
            '--y': `${sparkle.y}%`,
            '--s': `${sparkle.size}px`,
            '--delay': `${sparkle.delay}s`,
            '--d': `${sparkle.duration}s`,
          }}
        >
          <SparkleShape />
        </span>
      ))}

      <div className={styles.hearts}>
        {HEARTS.map((heart) => (
          <span
            key={heart.id}
            className={styles.heart}
            style={{
              '--x': `${heart.x}%`,
              '--s': `${heart.size}px`,
              '--delay': `${heart.delay}s`,
              '--d': `${heart.duration}s`,
              '--sway': `${heart.sway}s`,
            }}
          >
            <span className={`${styles.heartInner} ${styles[`tone${heart.tone}`]}`}>
              <HeartShape />
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
