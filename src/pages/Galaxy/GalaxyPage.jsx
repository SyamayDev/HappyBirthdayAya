import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { House, RotateCcw, SkipForward } from 'lucide-react'
import { finale, pageTitles, people, photos } from '../../data/content.js'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { usePageTransition } from '../../context/Transition.jsx'
import { StaticSky } from './StaticSky.jsx'
import { supportsWebGL } from './secret.js'
import styles from './GalaxyPage.module.css'

/*
 * "Kejutan Terakhir!" — the original full-screen galaxy: touch the planet,
 * the camera flies out, and a galaxy made of Aya's photos appears with the
 * message rings around the planet. Every message also exists as real text.
 * Without WebGL (or with reduced motion) a static night sky with the same
 * photos and messages is shown instead.
 */
const SCENE_LABEL = `Galaksi biru berisi foto-foto ${people.recipient} yang mengelilingi planet bercahaya dengan cincin bertuliskan ${finale.rings.join(', ')}.`

export function GalaxyPage() {
  const reduced = useReducedMotionPreference()
  const [webgl] = useState(() => supportsWebGL())
  const [failed, setFailed] = useState(false)
  const use3D = webgl && !reduced && !failed

  return (
    <div className={styles.page}>
      <h1 className="visually-hidden">{pageTitles.galaksi}</h1>
      {use3D ? <GalaxyStage onFail={() => setFailed(true)} /> : <StaticFinale />}
    </div>
  )
}

function GalaxyStage({ onFail }) {
  const hostRef = useRef(null)
  const controllerRef = useRef(null)
  const onFailRef = useRef(onFail)
  const { navigate } = usePageTransition()
  const [phase, setPhase] = useState('loading') // loading | waiting | flying | done

  useEffect(() => {
    onFailRef.current = onFail
  }, [onFail])

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    import('./GalaxyScene.js')
      .then(({ createGalaxyScene }) => {
        if (cancelled || !host) return
        controllerRef.current = createGalaxyScene(host, {
          photos,
          rings: finale.rings,
          fontFamily: "'Nunito Variable', 'Nunito', system-ui, sans-serif",
          onPlanetTap: () => {
            controllerRef.current?.start()
            setPhase('flying')
          },
          onIntroEnd: () => setPhase('done'),
          onContextLost: () => onFailRef.current?.(),
        })
        setPhase('waiting')
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn('[GalaxyPage] 3D unavailable, showing the static sky', error)
        if (!cancelled) onFailRef.current?.()
      })
    return () => {
      cancelled = true
      controllerRef.current?.dispose()
      controllerRef.current = null
    }
  }, [])

  function start() {
    controllerRef.current?.start()
    setPhase('flying')
  }

  return (
    <>
      <div ref={hostRef} className={styles.canvasHost} role="img" aria-label={SCENE_LABEL} />

      <AnimatePresence>
        {phase === 'waiting' || phase === 'loading' ? (
          <motion.div key="hint" className={styles.hintLayer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.6 }}>
            <p className={styles.greeting}>{finale.planetGreeting}</p>
            <button type="button" className={styles.planetButton} onClick={start} disabled={phase === 'loading'} aria-label={`${finale.tapHint} untuk memulai`}>
              <span className={styles.ring} aria-hidden="true" />
              <span className={styles.ring} aria-hidden="true" />
            </button>
            <p className={styles.tapText} aria-hidden="true">
              {phase === 'loading' ? 'Menyiapkan galaksi…' : `${finale.tapHint} ✨`}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {phase === 'flying' ? (
        <button type="button" className={`${styles.pill} ${styles.skip}`} onClick={() => controllerRef.current?.skipIntro()}>
          <SkipForward aria-hidden="true" />
          Lewati
        </button>
      ) : null}

      <AnimatePresence>
        {phase === 'done' ? (
          <motion.div key="end" className={styles.endLayer} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <p className={styles.couple}>{finale.couple}</p>
            <ul className="visually-hidden">
              {finale.rings.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.pill}
                onClick={() => {
                  controllerRef.current?.restart()
                  setPhase('flying')
                }}
              >
                <RotateCcw aria-hidden="true" />
                Putar ulang
              </button>
              <button type="button" className={styles.pill} onClick={(event) => navigate('beranda', event)}>
                <House aria-hidden="true" />
                Kembali ke awal
              </button>
            </div>
            <p className={styles.hint} aria-hidden="true">
              Geser untuk memutar · cubit untuk zoom
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

function StaticFinale() {
  const { navigate } = usePageTransition()
  return (
    <div className={styles.static}>
      <StaticSky className={styles.staticSky} withPhotos />
      <div className={styles.staticText}>
        <p className={styles.greeting}>{finale.planetGreeting}</p>
        <p className={styles.couple}>{finale.couple}</p>
      </div>
      <div className={styles.staticBottom}>
        <ul className={styles.chips}>
          {finale.rings.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <button type="button" className={styles.pill} onClick={(event) => navigate('beranda', event)}>
          <House aria-hidden="true" />
          Kembali ke awal
        </button>
      </div>
    </div>
  )
}
