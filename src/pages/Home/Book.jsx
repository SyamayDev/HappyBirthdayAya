import { useEffect, useId, useRef } from 'react'
import { motion } from 'motion/react'
import { Gift, X } from 'lucide-react'
import { home, letter } from '../../data/content.js'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { usePageTransition } from '../../context/Transition.jsx'
import { cx } from '../../lib/cx.js'
import styles from './Book.module.css'

/*
 * The original book: lying tilted under the photo ring, it lifts up and its
 * cover swings open to show the letter. The cover is the only toggle, so the
 * "Buka!" button can no longer re-close the book by click bubbling.
 * The letter's lines are revealed one by one (blur → sharp) once it opens.
 */

const reveal = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  shown: (i) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { delay: 0.55 + i * 0.12, duration: 0.6 } }),
}

export function Book({ open, onOpenChange }) {
  const reduced = useReducedMotionPreference()
  const { navigate } = usePageTransition()
  const bookRef = useRef(null)
  const titleRef = useRef(null)
  const coverRef = useRef(null)
  const wasOpenRef = useRef(open)
  const letterId = useId()

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      titleRef.current?.focus({ preventScroll: true })
      bookRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    } else if (!open && wasOpenRef.current) {
      coverRef.current?.focus({ preventScroll: true })
    }
    wasOpenRef.current = open
  }, [open, reduced])

  const lines = [letter.greeting, ...letter.paragraphs]

  return (
    <div className={styles.stage}>
      <div ref={bookRef} className={cx(styles.book, open && styles.open)}>
        <article id={letterId} className={styles.page} aria-labelledby={`${letterId}-title`} inert={!open} aria-hidden={!open}>
          <button type="button" className={styles.close} aria-label={letter.closeLabel} onClick={() => onOpenChange(false)}>
            <X aria-hidden="true" />
          </button>
          <motion.h2
            id={`${letterId}-title`}
            ref={titleRef}
            tabIndex={-1}
            className={styles.title}
            variants={reveal}
            custom={0}
            initial={false}
            animate={open ? 'shown' : 'hidden'}
          >
            {letter.title}
          </motion.h2>
          {lines.map((line, index) => (
            <motion.p
              key={line}
              className={styles.line}
              variants={reveal}
              custom={index + 1}
              initial={false}
              animate={open ? 'shown' : 'hidden'}
            >
              {line}
            </motion.p>
          ))}
          <motion.div className={styles.cta} variants={reveal} custom={lines.length + 1} initial={false} animate={open ? 'shown' : 'hidden'}>
            <button type="button" className="btn" onClick={(event) => navigate('puzzle', event)}>
              <Gift aria-hidden="true" />
              {letter.cta}
            </button>
          </motion.div>
          <motion.p className={styles.signOff} variants={reveal} custom={lines.length + 2} initial={false} animate={open ? 'shown' : 'hidden'}>
            {letter.signOff}
          </motion.p>
        </article>

        <button
          ref={coverRef}
          type="button"
          className={styles.cover}
          aria-expanded={open}
          aria-controls={letterId}
          aria-label={letter.openLabel}
          tabIndex={open ? -1 : 0}
          onClick={() => onOpenChange(true)}
        >
          <span className={styles.coverFront}>
            <img src={letter.cover.src} width={letter.cover.width} height={letter.cover.height} alt={letter.cover.alt} draggable="false" />
            <span className={styles.shine} />
          </span>
          <span className={styles.coverBack} />
        </button>
      </div>

      <p className={cx(styles.hint, open && styles.hintHidden)} aria-hidden="true">
        {home.bookHint}
      </p>
    </div>
  )
}
