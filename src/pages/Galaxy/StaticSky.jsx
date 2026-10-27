import { photos } from '../../data/content.js'
import { createRng, range } from '../../lib/random.js'
import { cx } from '../../lib/cx.js'
import styles from './StaticSky.module.css'

/*
 * CSS-only night sky: star layers, a glowing planet with rings and (when
 * `withPhotos`) the ten photos orbiting it. Used behind the secret door and
 * as the finale when WebGL is unavailable or reduced motion is on.
 */

function starShadows(seed, count, spread = 1600) {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => {
    const x = Math.round(range(rng, 0, spread))
    const y = Math.round(range(rng, 0, spread))
    const alpha = range(rng, 0.35, 1).toFixed(2)
    return `${x}px ${y}px rgba(235, 243, 255, ${alpha})`
  }).join(', ')
}

const LAYERS = {
  low: [starShadows(11, 70), starShadows(12, 30)],
  high: [starShadows(21, 160), starShadows(22, 70), starShadows(23, 26)],
}

const ORBIT = photos.map((photo, index) => {
  const angle = (index / photos.length) * Math.PI * 2 - Math.PI / 2
  return { photo, x: 50 + Math.cos(angle) * 40, y: 50 + Math.sin(angle) * 36, delay: -index * 0.7 }
})

export function StaticSky({ className, withPhotos = false, density = 'high' }) {
  return (
    <div className={cx(styles.sky, className)} aria-hidden="true">
      {LAYERS[density].map((shadow, index) => (
        <span key={index} className={cx(styles.stars, styles[`layer${index}`])} style={{ boxShadow: shadow }} />
      ))}
      <span className={styles.band} />
      {withPhotos ? (
        <>
          <span className={styles.planet}>
            <span className={styles.ringA} />
            <span className={styles.ringB} />
          </span>
          {ORBIT.map(({ photo, x, y, delay }) => (
            <span key={photo.id} className={styles.photo} style={{ left: `${x}%`, top: `${y}%`, '--delay': `${delay}s` }}>
              <img src={photo.thumb} alt="" loading="lazy" decoding="async" style={{ objectPosition: photo.focus }} />
            </span>
          ))}
        </>
      ) : null}
    </div>
  )
}
