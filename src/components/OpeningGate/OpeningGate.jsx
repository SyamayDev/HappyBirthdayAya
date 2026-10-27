import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { Music, Sparkles } from 'lucide-react'
import { gate } from '../../data/content.js'
import { useJourney } from '../../context/Journey.jsx'
import { useMusic } from '../../context/Music.jsx'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import { EASE_OUT } from '../../lib/motion.js'
import styles from './OpeningGate.module.css'

/*
 * The invitation: a sealed envelope floating in the sky. Replaces the
 * legacy "allow microphone" modal. One click opens the experience; the
 * music variant calls play() synchronously inside the click handler so
 * the browser counts it as a user gesture. No permission prompt.
 */
export function OpeningGate() {
  const { started } = useJourney()
  return <AnimatePresence>{started ? null : <GateDialog key="gate" />}</AnimatePresence>
}

function GateDialog() {
  const { start } = useJourney()
  const { play } = useMusic()
  const reduced = useReducedMotionPreference()
  const isPresent = useIsPresent()
  const [opening, setOpening] = useState(false)
  const openedRef = useRef(false)
  const primaryRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useScrollLock(true)

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true })
  }, [])

  function open(withMusic) {
    if (openedRef.current) return
    openedRef.current = true
    setOpening(true)
    if (withMusic) play() // must run inside the click (user gesture)
    start()
  }

  const leave = reduced
    ? { opacity: 0, transition: { duration: 0.18 } }
    : { opacity: 0, transition: { delay: 0.55, duration: 0.55, ease: EASE_OUT } }

  const variants = {
    overlay: { shown: { opacity: 1 }, leaving: leave },
    stage: {
      shown: { y: 0, scale: 1 },
      leaving: reduced ? {} : { y: -36, scale: 1.04, transition: { delay: 0.45, duration: 0.7, ease: EASE_OUT } },
    },
    flap: {
      shown: { rotateX: 0 },
      leaving: reduced ? {} : { rotateX: 178, zIndex: 0, transition: { duration: 0.55, ease: EASE_OUT } },
    },
    seal: {
      shown: { scale: 1, opacity: 1 },
      leaving: reduced ? { opacity: 0 } : { scale: 1.5, opacity: 0, transition: { duration: 0.3 } },
    },
    card: {
      shown: { y: 0 },
      leaving: reduced ? {} : { y: '-42%', zIndex: 5, transition: { delay: 0.25, duration: 0.6, ease: EASE_OUT } },
    },
    copy: {
      shown: { opacity: 1, y: 0 },
      leaving: reduced ? { opacity: 0 } : { opacity: 0, y: 12, transition: { duration: 0.25 } },
    },
  }

  return (
    <motion.div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      style={isPresent ? undefined : { pointerEvents: 'none' }}
      variants={variants.overlay}
      initial={false}
      animate="shown"
      exit="leaving"
    >
      <motion.div className={styles.stage} variants={variants.stage}>
        <div className={styles.envelope} aria-hidden="true">
          <div className={styles.back} />
          <motion.div className={styles.card} variants={variants.card}>
            <span className={styles.cardLine} />
            <span className={styles.cardLine} />
            <span className={styles.cardHeart}>♥</span>
          </motion.div>
          <div className={styles.pocket} />
          <div className={styles.ribbon} />
          <motion.div className={styles.flap} variants={variants.flap} />
          <motion.div className={styles.seal} variants={variants.seal}>
            <span className={styles.sealLetter}>A</span>
          </motion.div>
          <Sparkles className={`${styles.spark} ${styles.sparkA}`} />
          <Sparkles className={`${styles.spark} ${styles.sparkB}`} />
        </div>

        <motion.div className={styles.copy} variants={variants.copy}>
          <p className="eyebrow">{gate.greeting}</p>
          <h1 id={titleId} className={styles.title}>
            {gate.to}
          </h1>
          <p id={descriptionId} className={styles.description}>
            {gate.description}
          </p>
          <div className={styles.actions}>
            <button
              ref={primaryRef}
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => open(true)}
              disabled={opening}
            >
              <Music aria-hidden="true" />
              {gate.openWithMusic}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => open(false)} disabled={opening}>
              {gate.openWithoutMusic}
            </button>
          </div>
          <p className={styles.note}>{gate.musicNote}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
