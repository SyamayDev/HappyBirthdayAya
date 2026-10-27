import { useEffect, useId, useRef, useState } from 'react'
import { motion, useAnimate, useInView } from 'motion/react'
import { Compass, Images, KeyRound, Lightbulb, Lock, RotateCcw, SkipForward, Flame } from 'lucide-react'
import { birthday, finale, people, photos } from '../../data/content.js'
import { useJourney } from '../../context/Journey.jsx'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { useAnnounce } from '../../context/Announcer.jsx'
import { celebrate } from '../../lib/celebrate.js'
import { goToChapter } from '../../lib/navigation.js'
import { cx } from '../../lib/cx.js'
import { EASE_OUT } from '../../lib/motion.js'
import { Chapter, ChapterHeading } from '../common/Chapter.jsx'
import { StaticSky } from './StaticSky.jsx'
import { matchesSecret, supportsWebGL } from './secret.js'
import styles from './GalaxyFinale.module.css'

/*
 * "Kejutan Terakhir!" — the original finale was a three.js galaxy reached by
 * saying "sayang" into the microphone. Now the secret phrase is typed at a
 * starry door, and the galaxy is loaded only after it opens. Every message
 * also exists as real text, and a static night sky replaces the 3D scene
 * when WebGL is missing or reduced motion is on.
 */
export function GalaxyFinale() {
  const { progress, complete } = useJourney()
  const reduced = useReducedMotionPreference()
  const announce = useAnnounce()
  const [justUnlocked, setJustUnlocked] = useState(false)

  function unlock() {
    complete('finaleUnlocked')
    setJustUnlocked(true)
    announce('Kejutan terakhir terbuka!')
    celebrate({ reduced, intensity: 'grand' })
  }

  return (
    <Chapter id="bintang" tone="night" className="on-night">
      <div className="container">
        <ChapterHeading id="bintang" number={5} eyebrow={finale.eyebrow} title={finale.title} tone="night" />
        {progress.finaleUnlocked ? <Finale reduced={reduced} focusOnMount={justUnlocked} /> : <SecretDoor reduced={reduced} onUnlock={unlock} />}
      </div>
    </Chapter>
  )
}

/* ── Locked door ────────────────────────────────────────── */
function SecretDoor({ reduced, onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [rowRef, animateRow] = useAnimate()
  const inputId = useId()
  const errorId = useId()
  const hintId = useId()
  const inputRef = useRef(null)

  function submit(event) {
    event.preventDefault()
    if (matchesSecret(value, finale.secret.keyword)) {
      setError(false)
      onUnlock()
    } else {
      setError(true)
      inputRef.current?.focus()
      if (!reduced && rowRef.current) animateRow(rowRef.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.45, ease: EASE_OUT })
    }
  }

  return (
    <div className={styles.door}>
      <StaticSky className={styles.doorSky} density="low" />
      <div className={styles.seal} aria-hidden="true">
        <svg viewBox="0 0 120 120" className={styles.constellation}>
          <path d="M60 18 L84 40 L100 66 L76 96 L44 96 L20 66 L36 40 Z M60 18 L60 52 M36 40 L60 52 L84 40 M60 52 L76 96 M60 52 L44 96" />
          {[
            [60, 18], [84, 40], [100, 66], [76, 96], [44, 96], [20, 66], [36, 40], [60, 52],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.2" />
          ))}
        </svg>
        <span className={styles.lockBadge}>
          <Lock />
        </span>
      </div>

      <form className={styles.form} onSubmit={submit} noValidate>
        <p className={styles.prompt}>{finale.secret.prompt}</p>
        <label htmlFor={inputId} className={styles.label}>
          Kata rahasia
        </label>
        <div ref={rowRef} className={styles.inputRow}>
          <input
            ref={inputRef}
            id={inputId}
            className={styles.input}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            enterKeyHint="go"
            value={value}
            aria-invalid={error || undefined}
            aria-describedby={cx(error && errorId, hintOpen && hintId) || undefined}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError(false)
            }}
          />
          <button type="submit" className="btn btn--primary">
            <KeyRound aria-hidden="true" />
            Buka
          </button>
        </div>
        {error ? (
          <p id={errorId} className={styles.error} role="alert">
            Hmm, belum tepat. Coba lagi ya 💙
          </p>
        ) : null}

        <div className={styles.doorLinks}>
          <button type="button" className={cx('btn btn--ghost btn--sm', styles.nightGhost)} aria-expanded={hintOpen} aria-controls={hintId} onClick={() => setHintOpen((open) => !open)}>
            <Lightbulb aria-hidden="true" />
            Lihat petunjuk
          </button>
          <button type="button" className={cx('btn btn--ghost btn--sm', styles.nightGhost)} onClick={onUnlock}>
            Buka tanpa kata rahasia
          </button>
        </div>
        <p id={hintId} className={styles.hint} hidden={!hintOpen}>
          Petunjuk: “{finale.secret.hint}”
        </p>
      </form>
    </div>
  )
}

/* ── Unlocked finale ────────────────────────────────────── */
function Finale({ reduced, focusOnMount }) {
  const { resetJourney } = useJourney()
  const greetingRef = useRef(null)
  const [webgl] = useState(() => supportsWebGL())
  const [sceneFailed, setSceneFailed] = useState(false)
  const use3D = webgl && !reduced && !sceneFailed

  useEffect(() => {
    if (focusOnMount) greetingRef.current?.focus({ preventScroll: true })
  }, [focusOnMount])

  function replay() {
    resetJourney()
    requestAnimationFrame(() => goToChapter('pembuka', { reduced }))
  }

  return (
    <div className={styles.finale}>
      <motion.div
        className={styles.stage}
        initial={reduced ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: EASE_OUT }}
      >
        {use3D ? <GalaxyCanvas onFail={() => setSceneFailed(true)} /> : <StaticSky className={styles.staticSky} withPhotos />}

        <div className={styles.overlay}>
          <h3 ref={greetingRef} tabIndex={-1} className={styles.greeting}>
            {finale.planetGreeting}
          </h3>
          <p className={styles.couple}>{finale.couple}</p>
        </div>
      </motion.div>

      <div className={styles.closing}>
        <ul className={styles.rings} aria-label="Pesan di cincin planet">
          {finale.rings.map((text) => (
            <li key={text} className={styles.ringChip}>
              {text}
            </li>
          ))}
        </ul>

        <p className={styles.signOff}>
          {finale.closing.signOff}
          <span className={styles.heart} aria-hidden="true">
            ♥
          </span>
        </p>

        <div className={styles.actions}>
          <button type="button" className="btn btn--night" onClick={() => goToChapter('kenangan', { reduced })}>
            <Images aria-hidden="true" />
            Lihat kenangan lagi
          </button>
          <button type="button" className="btn btn--night" onClick={() => goToChapter('kue', { reduced })}>
            <Flame aria-hidden="true" />
            Nyalakan lilin lagi
          </button>
          <button type="button" className="btn btn--night" onClick={replay}>
            <RotateCcw aria-hidden="true" />
            Putar ulang dari awal
          </button>
        </div>

        <p className={styles.footer}>
          Dibuat dengan 💙 oleh {people.sender} untuk {people.recipient} · {birthday.ringDate}
        </p>
      </div>
    </div>
  )
}

const SCENE_LABEL = `Galaksi biru berisi foto-foto ${people.recipient} yang berputar mengelilingi planet bercahaya dengan cincin bertuliskan ${finale.rings.join(', ')}.`

function GalaxyCanvas({ onFail }) {
  const hostRef = useRef(null)
  const controllerRef = useRef(null)
  const inView = useInView(hostRef, { margin: '300px 0px', once: true })
  const [phase, setPhase] = useState('loading') // loading | intro | ready
  const [exploring, setExploring] = useState(false)
  const onFailRef = useRef(onFail)

  useEffect(() => {
    onFailRef.current = onFail
  }, [onFail])

  useEffect(() => {
    if (!inView) return undefined
    let cancelled = false
    const host = hostRef.current
    import('./GalaxyScene.js')
      .then(({ createGalaxyScene }) => {
        if (cancelled || !host) return
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || 'Georgia, serif'
        controllerRef.current = createGalaxyScene(host, {
          photos,
          rings: finale.rings,
          fontFamily,
          onIntroEnd: () => setPhase('ready'),
          onContextLost: () => onFailRef.current?.(),
        })
        setPhase('intro')
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn('[GalaxyFinale] 3D scene unavailable, using the static sky', error)
        if (!cancelled) onFailRef.current?.()
      })
    return () => {
      cancelled = true
      controllerRef.current?.dispose()
      controllerRef.current = null
    }
  }, [inView])

  function toggleExplore() {
    const next = !exploring
    setExploring(next)
    controllerRef.current?.setInteractive(next)
  }

  return (
    <>
      <div ref={hostRef} className={cx(styles.canvasHost, exploring && styles.exploring)} role="img" aria-label={SCENE_LABEL} />
      {phase === 'loading' ? (
        <p className={styles.loading} role="status">
          Menyiapkan galaksi…
        </p>
      ) : null}
      <div className={styles.sceneControls}>
        {phase === 'intro' ? (
          <button type="button" className="btn btn--night btn--sm" onClick={() => controllerRef.current?.skipIntro()}>
            <SkipForward aria-hidden="true" />
            Lewati animasi
          </button>
        ) : null}
        {phase === 'ready' ? (
          <button type="button" className="btn btn--night btn--sm" aria-pressed={exploring} onClick={toggleExplore}>
            <Compass aria-hidden="true" />
            {exploring ? 'Selesai menjelajah' : 'Jelajahi galaksi'}
          </button>
        ) : null}
      </div>
      {exploring ? (
        <p className={styles.exploreHint} aria-hidden="true">
          Seret untuk memutar · cubit atau gulir untuk zoom
        </p>
      ) : null}
    </>
  )
}
