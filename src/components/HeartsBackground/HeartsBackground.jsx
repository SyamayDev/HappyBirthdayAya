import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { createRng, range } from '../../lib/random.js'
import { cx } from '../../lib/cx.js'
import styles from './HeartsBackground.module.css'

/*
 * The original page's signature: a full-screen gradient with dozens of
 * hearts drifting in slow circles. The old version moved 80 emoji hearts
 * with left/top every frame; here each heart orbits with a single CSS
 * transform animation (compositor only), fewer on phones, frozen when the
 * visitor prefers reduced motion.
 *
 * variant: 'home' | 'puzzle' | 'cake' (background gradient + heart tones)
 */

const rng = createRng(18052026)
const HEARTS = Array.from({ length: 44 }, (_, index) => ({
  id: index,
  x: range(rng, -4, 100),
  y: range(rng, -4, 100),
  radius: range(rng, 30, 140),
  duration: range(rng, 16, 38),
  delay: -range(rng, 0, 38),
  size: range(rng, 12, 30),
  opacity: range(rng, 0.35, 0.85),
  tone: index % 4,
  reverse: index % 3 === 0,
}))

function Heart() {
  return (
    <svg viewBox="0 0 24 22" focusable="false">
      <path d="M12 21.6S1.2 14.8.2 7.9C-.6 2.6 5.2-1.6 9.6 2.2c1 .9 1.8 1.9 2.4 2.9.6-1 1.4-2 2.4-2.9 4.4-3.8 10.2.4 9.4 5.7-1 6.9-11.8 13.7-11.8 13.7z" />
    </svg>
  )
}

export function HeartsBackground({ variant = 'home' }) {
  const small = useMediaQuery('(max-width: 640px)')
  const visible = small ? HEARTS.slice(0, 24) : HEARTS
  return (
    <div className={cx(styles.background, styles[variant])} aria-hidden="true">
      <span className={styles.glow} />
      {visible.map((heart) => (
        <span
          key={heart.id}
          className={styles.anchor}
          style={{ left: `${heart.x}%`, top: `${heart.y}%` }}
        >
          <span
            className={cx(styles.orbit, heart.reverse && styles.reverse)}
            style={{ '--r': `${heart.radius}px`, '--d': `${heart.duration}s`, '--delay': `${heart.delay}s` }}
          >
            <span
              className={cx(styles.heart, styles[`tone${heart.tone}`])}
              style={{ '--s': `${heart.size}px`, '--o': heart.opacity, '--beat': `${1.4 + (heart.id % 5) * 0.25}s` }}
            >
              <Heart />
            </span>
          </span>
        </span>
      ))}
    </div>
  )
}
