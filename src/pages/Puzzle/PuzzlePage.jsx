import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Eye, EyeOff, Gift, Shuffle, WandSparkles } from 'lucide-react'
import { pageTitles, puzzle } from '../../data/content.js'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { useAnnounce } from '../../context/Announcer.jsx'
import { usePageTransition } from '../../context/Transition.jsx'
import { celebrate } from '../../lib/celebrate.js'
import { Modal } from '../../components/Modal/Modal.jsx'
import { Envelope } from './Envelope.jsx'
import { Jigsaw } from './Jigsaw.jsx'
import styles from './PuzzlePage.module.css'

/*
 * The original puzzle page: "Sebelum Mulai, Aya…" card → jigsaw → the
 * envelope opens with confetti → "Tuhkan Cayang Pasti Bisa!" → cake page.
 * phases: intro → playing → complete (photo glows) → envelope → message
 */
export function PuzzlePage() {
  const reduced = useReducedMotionPreference()
  const announce = useAnnounce()
  const { navigate } = usePageTransition()
  const [phase, setPhase] = useState('intro')
  const [progress, setProgress] = useState(0)
  const [peek, setPeek] = useState(false)
  const jigsawRef = useRef(null)
  const introTitleId = useId()
  const introTextId = useId()
  const doneTitleId = useId()
  const doneTextId = useId()
  const total = puzzle.cols * puzzle.rows

  function begin() {
    setPhase('playing')
    jigsawRef.current?.scatter()
  }

  function handleComplete() {
    announce(`${puzzle.success.title} Puzzle selesai.`)
    if (reduced) showEnvelope()
    else setPhase('complete')
  }

  function showEnvelope() {
    setPhase('envelope')
    celebrate({ reduced, intensity: 'grand' })
  }

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <h1 className={styles.title}>{pageTitles.puzzle}</h1>
        <p className={styles.count} aria-hidden="true">
          {progress}/{total}
        </p>
        <div className={styles.tools}>
          <button type="button" className={styles.tool} aria-label="Intip foto" aria-pressed={peek} onClick={() => setPeek((value) => !value)} disabled={phase !== 'playing'}>
            {peek ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            <span aria-hidden="true">Intip foto</span>
          </button>
          <button type="button" className={styles.tool} aria-label="Acak keping" onClick={() => jigsawRef.current?.scatter()} disabled={phase !== 'playing'}>
            <Shuffle aria-hidden="true" />
            <span aria-hidden="true">Acak</span>
          </button>
          <button type="button" className={styles.tool} aria-label="Bantu pasang satu keping" onClick={() => jigsawRef.current?.help()} disabled={phase !== 'playing'}>
            <WandSparkles aria-hidden="true" />
            <span aria-hidden="true">Bantu</span>
          </button>
        </div>
      </header>

      <motion.div
        className={styles.play}
        animate={phase === 'envelope' || phase === 'message' ? { opacity: 0, scale: 0.94 } : phase === 'complete' ? { scale: [1, 1.03, 1] } : { opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0 : phase === 'complete' ? 1.3 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => {
          if (phase === 'complete') showEnvelope()
        }}
      >
        <Jigsaw
          ref={jigsawRef}
          image={puzzle.image.src}
          cols={puzzle.cols}
          rows={puzzle.rows}
          status={phase === 'playing' ? 'playing' : phase === 'intro' ? 'idle' : 'complete'}
          peek={peek}
          reduced={reduced}
          onProgress={(done) => setProgress(done)}
          onComplete={handleComplete}
        />
      </motion.div>

      {phase === 'envelope' || phase === 'message' ? (
        <div className={styles.envelopeLayer}>
          <Envelope reduced={reduced} onOpened={() => setPhase('message')} />
        </div>
      ) : null}

      <AnimatePresence>
        {phase === 'intro' ? (
          <Modal key="intro" variant="blue" labelledBy={introTitleId} describedBy={introTextId} onDismiss={begin}>
            <h2 id={introTitleId} className={styles.introTitle}>
              {puzzle.intro.heading}
            </h2>
            <p id={introTextId} className={styles.introText}>
              {puzzle.intro.message}
            </p>
            <blockquote className={styles.quote}>
              <p>“{puzzle.intro.quote}”</p>
            </blockquote>
            <button type="button" className={`btn btn--light ${styles.wide}`} onClick={begin}>
              {puzzle.intro.start}
            </button>
          </Modal>
        ) : null}

        {phase === 'message' ? (
          <Modal key="done" labelledBy={doneTitleId} describedBy={doneTextId} className={styles.doneCard}>
            <p className={styles.badge}>{puzzle.success.badge}</p>
            <h2 id={doneTitleId} className={styles.doneTitle}>
              {puzzle.success.title}
            </h2>
            <p id={doneTextId} className={styles.doneText}>
              {puzzle.success.description}
            </p>
            <button type="button" className="btn" onClick={(event) => navigate('kue', event)}>
              <Gift aria-hidden="true" />
              {puzzle.success.cta}
            </button>
          </Modal>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
