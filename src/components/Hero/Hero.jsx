import { motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { hero, people } from '../../data/content.js'
import { useJourney } from '../../context/Journey.jsx'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { goToChapter } from '../../lib/navigation.js'
import { EASE_OUT } from '../../lib/motion.js'
import { Balloons } from './Balloons.jsx'
import styles from './Hero.module.css'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
}

const name = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.1, ease: EASE_OUT } },
}

export function Hero() {
  const { started } = useJourney()
  const reduced = useReducedMotionPreference()

  return (
    <section id="pembuka" data-chapter="pembuka" aria-labelledby="pembuka-title" className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <Balloons className={styles.balloons} />

      <motion.div
        className={styles.content}
        variants={container}
        initial={started ? false : 'hidden'}
        animate={started ? 'visible' : 'hidden'}
      >
        <motion.p className={styles.date} variants={item}>
          <span className={styles.dateDot} aria-hidden="true" />
          {hero.eyebrow}
        </motion.p>

        <h1 id="pembuka-title" tabIndex={-1} data-chapter-heading className={styles.title} aria-label={`${hero.titleLine}, ${hero.name}`}>
          <motion.span className={styles.line} variants={item} aria-hidden="true">
            {hero.titleLine}
          </motion.span>
          <motion.span className={styles.nameWrap} variants={name} aria-hidden="true">
            <span className={`${styles.name} text-gradient`}>{hero.name}</span>
            <span className={styles.badge}>
              <span className={styles.badgeText}>{hero.ageBadge}</span>
            </span>
          </motion.span>
        </h1>

        <motion.p className={styles.ribbon} variants={item}>
          <span className={styles.ribbonText}>{hero.greetingVerbatim}</span>
        </motion.p>

        <motion.p className={styles.lead} variants={item}>
          {hero.lead}
        </motion.p>

        <motion.div className={styles.actions} variants={item}>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => goToChapter('kenangan', { reduced })}>
            {hero.cta}
            <ArrowDown aria-hidden="true" />
          </button>
          <p className={styles.from}>
            dari <span className={styles.fromName}>{people.sender}</span>
          </p>
        </motion.div>
      </motion.div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollDot} />
      </div>
    </section>
  )
}
