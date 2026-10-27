import { useEffect, useRef } from 'react'
import { useAnimate } from 'motion/react'
import { puzzle } from '../../data/content.js'
import styles from './Envelope.module.css'

/*
 * The envelope from the original success screen, in blue. A small timeline
 * plays in order: the envelope pops in → the heart seal bursts → the flap
 * MORPHS from closed (pointing down) to open (pointing up) → the note with
 * the finished photo slides out → `onOpened()` shows the message card.
 */
const FLAP_CLOSED = 'M4 6 Q100 76 196 6 L196 4 Q100 2 4 4 Z'
const FLAP_OPEN = 'M4 6 Q100 -110 196 6 L196 4 Q100 2 4 4 Z'
const EASE = [0.22, 1, 0.36, 1]

export function Envelope({ reduced, onOpened }) {
  const [scope, animate] = useAnimate()
  const onOpenedRef = useRef(onOpened)

  useEffect(() => {
    onOpenedRef.current = onOpened
  }, [onOpened])

  useEffect(() => {
    let cancelled = false
    async function play() {
      const root = scope.current
      const part = (name) => root.querySelector(`[data-part="${name}"]`)
      if (reduced) {
        part('flap-path').setAttribute('d', FLAP_OPEN)
        part('flap').style.zIndex = '1'
        part('seal').style.opacity = '0'
        part('letter').style.transform = 'translateY(-62%)'
      } else {
        await animate(root, { opacity: [0, 1], scale: [0.6, 1], y: [60, 0] }, { type: 'spring', stiffness: 180, damping: 18 })
        await animate(part('seal'), { scale: [1, 1.7], opacity: [1, 0] }, { duration: 0.35 })
        await animate(part('flap-path'), { d: [FLAP_CLOSED, FLAP_OPEN] }, { duration: 0.6, ease: EASE })
        part('flap').style.zIndex = '1'
        await animate(part('letter'), { y: ['0%', '-62%'] }, { duration: 0.9, ease: EASE })
      }
      if (!cancelled) onOpenedRef.current?.()
    }
    play()
    return () => {
      cancelled = true
    }
  }, [animate, scope, reduced])

  return (
    <div ref={scope} className={styles.envelope} aria-hidden="true">
      <div className={styles.back} />
      <div className={styles.letter} data-part="letter">
        <img src={puzzle.image.src} alt="" className={styles.photo} />
        <p className={styles.note}>{puzzle.success.envelopeNote}</p>
      </div>
      <svg className={styles.pocket} viewBox="0 0 200 130" preserveAspectRatio="none">
        <path d="M0 10 L100 80 L200 10 L200 130 L0 130 Z" />
        <path d="M0 130 L84 70 M200 130 L116 70" className={styles.fold} />
      </svg>
      <svg className={styles.flap} data-part="flap" viewBox="0 -80 200 160" preserveAspectRatio="none">
        <path data-part="flap-path" d={FLAP_CLOSED} />
      </svg>
      <span className={styles.seal} data-part="seal">
        ♥
      </span>
    </div>
  )
}
