import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { KeyRound, Mic, MicOff, Plus, Wind } from 'lucide-react'
import { cake, finale, pageTitles } from '../../data/content.js'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { useAnnounce } from '../../context/Announcer.jsx'
import { usePageTransition } from '../../context/Transition.jsx'
import { celebrate } from '../../lib/celebrate.js'
import { Modal } from '../../components/Modal/Modal.jsx'
import { matchesSecret } from '../Galaxy/secret.js'
import { Cake } from './Cake.jsx'
import { addCandle, litCount } from './candles.js'
import { isMicrophoneSupported, useBlowDetector } from './useBlowDetector.js'
import { isSpeechSupported, useSpeechSecret } from './useSpeechSecret.js'
import styles from './CakePage.module.css'

/*
 * The original cake page, same ritual:
 *   "Hai Cayaang! 🎂" → tap the cake to place candles → blow into the
 *   microphone → say "ayil sayang aya" → the final surprise.
 * Improvements: candles can also be blown by tapping their flame or the
 * "Tiup" button (the microphone is never required), the secret phrase can be
 * typed, and the microphone is always released afterwards.
 */
export function CakePage() {
  const reduced = useReducedMotionPreference()
  const announce = useAnnounce()
  const { navigate } = usePageTransition()
  const [phase, setPhase] = useState('instructions') // instructions | candles | secret
  const [candles, setCandles] = useState([])
  const [notice, setNotice] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const nextIdRef = useRef(0)
  const stopMicRef = useRef(null)
  const ids = { intro: useId(), introText: useId(), help: useId(), helpText: useId() }

  const lit = litCount(candles)
  const count = candles.length

  function applyCandles(next) {
    setCandles(next)
    if (next.length > 0 && litCount(next) === 0 && phase === 'candles') {
      setPhase('secret')
      stopMicRef.current?.()
      announce(`Semua lilin padam. ${cake.guidance.secret}`)
      celebrate({ reduced, origin: { y: 0.45 } })
    }
  }

  const extinguish = (list, ids) => list.map((candle) => (ids.has(candle.id) && candle.lit ? { ...candle, lit: false, outCount: candle.outCount + 1 } : candle))

  function onGust(strength) {
    const litOnes = candles.filter((candle) => candle.lit)
    if (litOnes.length === 0) return
    const howMany = strength > 0.75 ? 3 : strength > 0.5 ? 2 : 1
    applyCandles(extinguish(candles, new Set(litOnes.slice(-howMany).map((candle) => candle.id))))
  }

  const mic = useBlowDetector({ onGust })
  useEffect(() => {
    stopMicRef.current = mic.stop
  }, [mic.stop])

  function begin() {
    setPhase('candles')
    // The instructions explain the microphone step, so it starts here (as in
    // the original). If it is refused, tapping still works.
    if (isMicrophoneSupported()) mic.start()
  }

  function place(point) {
    if (phase !== 'candles') return
    if (count >= cake.maxCandles) {
      setNotice(`Sudah ${cake.maxCandles} lilin, pas untuk umur ${cake.maxCandles} tahun ✨`)
      return
    }
    nextIdRef.current += 1
    const next = addCandle(candles, cake.maxCandles, point, `c${nextIdRef.current}`)
    if (next === candles) {
      setNotice('Tidak ada ruang di situ, coba sisi lain ya.')
      return
    }
    setNotice('')
    setCandles(next.map((candle) => ({ outCount: 0, ...candle })))
  }

  function blowAll() {
    if (count === 0) {
      setNotice('Taruh lilinnya dulu, ya 🕯️')
      return
    }
    applyCandles(extinguish(candles, new Set(candles.map((candle) => candle.id))))
  }

  const goToGalaxy = (event) => {
    mic.stop()
    navigate('galaksi', event)
  }

  const micListening = mic.state === 'listening'
  const guidance =
    phase !== 'candles' ? '' : count === 0 ? cake.guidance.place : micListening ? cake.guidance.blow : 'Ketuk apinya atau tekan "Tiup" untuk meniup lilinnya'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{pageTitles.kue}</h1>
        <p className={styles.counter} aria-live="polite" aria-atomic="true">
          {cake.counterLabel} <strong>{count}</strong>
        </p>
      </header>

      <button type="button" className={`round-btn ${styles.help}`} aria-label={cake.help.title} onClick={() => setHelpOpen(true)}>
        ?
      </button>

      <div className={styles.stage}>
        <div className={styles.glow} style={{ opacity: Math.min(1, lit / 8) }} aria-hidden="true" />
        <Cake
          candles={candles}
          interactive={phase === 'candles'}
          reduced={reduced}
          onPlace={place}
          onBlow={(id) => applyCandles(extinguish(candles, new Set([id])))}
        />
      </div>

      <div className={styles.panel}>
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'candles' ? (
            <motion.div key="candles" className={styles.controls} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <p className={styles.guidance}>{guidance}</p>
              {notice ? (
                <p className={styles.notice} role="status">
                  {notice}
                </p>
              ) : null}
              <div className={styles.row}>
                <button type="button" className={styles.chip} onClick={() => place(null)} disabled={count >= cake.maxCandles}>
                  <Plus aria-hidden="true" />
                  Tambah lilin
                </button>
                <button type="button" className="btn btn--light" onClick={blowAll}>
                  <Wind aria-hidden="true" />
                  Tiup
                </button>
                {isMicrophoneSupported() ? (
                  <button
                    type="button"
                    className={styles.chip}
                    aria-pressed={micListening}
                    onClick={micListening ? mic.stop : mic.start}
                    disabled={mic.state === 'requesting'}
                  >
                    {micListening ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
                    {micListening ? 'Mikrofon aktif' : 'Pakai mikrofon'}
                  </button>
                ) : null}
              </div>
              {micListening ? (
                <div className={styles.meter} aria-hidden="true">
                  <span style={{ transform: `scaleX(${mic.level})` }} />
                </div>
              ) : null}
              {mic.state === 'denied' || mic.state === 'error' || mic.state === 'unsupported' ? (
                <p className={styles.micNote} role="status">
                  Mikrofon tidak aktif, tidak apa-apa: ketuk apinya atau tekan "Tiup" ya.
                </p>
              ) : null}
            </motion.div>
          ) : null}

          {phase === 'secret' ? <SecretPanel key="secret" reduced={reduced} onUnlock={goToGalaxy} onRelight={() => {
            setCandles((current) => current.map((candle) => ({ ...candle, lit: true })))
            setPhase('candles')
          }} /> : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === 'instructions' ? (
          <Modal key="instructions" labelledBy={ids.intro} describedBy={ids.introText} onDismiss={begin}>
            <h2 id={ids.intro} className={styles.cardTitle}>
              {cake.instructions.heading}
            </h2>
            <ol id={ids.introText} className={styles.steps}>
              {cake.instructions.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
              <li>
                {cake.instructions.secretStep.before}
                <strong className={styles.phrase}>{cake.instructions.secretStep.phrase}</strong>
                {cake.instructions.secretStep.after}
              </li>
            </ol>
            <button type="button" className="btn" onClick={begin}>
              {cake.instructions.start}
            </button>
          </Modal>
        ) : null}

        {helpOpen ? (
          <Modal key="help" labelledBy={ids.help} describedBy={ids.helpText} onDismiss={() => setHelpOpen(false)}>
            <button type="button" className={styles.close} aria-label="Tutup" onClick={() => setHelpOpen(false)}>
              ✕
            </button>
            <h2 id={ids.help} className={styles.cardTitle}>
              {cake.help.title}
            </h2>
            <p id={ids.helpText}>{cake.help.text}</p>
            <button type="button" className="btn" onClick={goToGalaxy}>
              {cake.help.cta}
            </button>
          </Modal>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function SecretPanel({ reduced, onUnlock, onRelight }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const inputId = useId()
  const errorId = useId()
  const onUnlockRef = useRef(null)
  const speech = useSpeechSecret({ keyword: finale.secret.keyword, onMatch: () => onUnlockRef.current?.() })

  useEffect(() => {
    onUnlockRef.current = () => onUnlock()
  }, [onUnlock])

  function submit(event) {
    event.preventDefault()
    if (matchesSecret(value, finale.secret.keyword)) {
      onUnlock(event.nativeEvent?.submitter ? { currentTarget: event.nativeEvent.submitter } : undefined)
    } else {
      setError(true)
    }
  }

  return (
    <motion.form
      className={styles.secret}
      onSubmit={submit}
      initial={reduced ? false : { opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      noValidate
    >
      <p className={styles.secretTitle}>{cake.guidance.secret}</p>
      <label htmlFor={inputId} className="visually-hidden">
        Kata rahasia
      </label>
      <div className={styles.inputRow}>
        <input
          id={inputId}
          className={styles.input}
          value={value}
          placeholder="Ketik kata rahasianya…"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          enterKeyHint="go"
          aria-invalid={error || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value)
            setError(false)
          }}
        />
        <button type="submit" className="btn">
          <KeyRound aria-hidden="true" />
          Buka
        </button>
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          Hmm, belum tepat. Coba lagi ya 💙
        </p>
      ) : null}
      <div className={styles.row}>
        {isSpeechSupported() ? (
          <button type="button" className={styles.chip} aria-pressed={speech.state === 'listening'} onClick={speech.state === 'listening' ? speech.stop : speech.start}>
            <Mic aria-hidden="true" />
            {speech.state === 'listening' ? 'Mendengarkan…' : 'Ucapkan'}
          </button>
        ) : null}
        <button type="button" className={styles.chip} onClick={onRelight}>
          Nyalakan lilin lagi
        </button>
      </div>
      {speech.heard ? <p className={styles.heard}>“{speech.heard}”</p> : null}
      {speech.state === 'error' ? (
        <p className={styles.micNote} role="status">
          Suara tidak tertangkap. Ketik saja kata rahasianya ya.
        </p>
      ) : null}
    </motion.form>
  )
}
