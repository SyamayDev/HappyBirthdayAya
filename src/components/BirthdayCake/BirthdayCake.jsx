import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, CircleHelp, Flame, Mic, MicOff, Plus, RotateCcw, Sparkles, Wind } from 'lucide-react'
import { cake, meta } from '../../data/content.js'
import { useJourney } from '../../context/Journey.jsx'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { useAnnounce } from '../../context/Announcer.jsx'
import { celebrate } from '../../lib/celebrate.js'
import { goToChapter } from '../../lib/navigation.js'
import { cx } from '../../lib/cx.js'
import { EASE_OUT } from '../../lib/motion.js'
import { Chapter, ChapterHeading } from '../common/Chapter.jsx'
import { CakeArt } from './CakeArt.jsx'
import { SURFACE } from './cakeGeometry.js'
import { addCandle, fillCandles, litCount } from './candles.js'
import { isMicrophoneSupported, useBlowDetector } from './useBlowDetector.js'
import styles from './BirthdayCake.module.css'

/*
 * Legacy: candles could only be blown out with a microphone (permission
 * requested up-front, stream never released) and the next page opened via
 * speech recognition. Now: tap, keyboard and a "blow" button always work;
 * the microphone is an explicit, optional extra that is released afterwards.
 */

const MAX = cake.maxCandles

function finishedCandles() {
  let counter = 0
  return fillCandles([], MAX, () => `c${(counter += 1)}`).map((candle) => ({ ...candle, lit: false, outCount: 0 }))
}

export function BirthdayCake() {
  const { progress, complete } = useJourney()
  const reduced = useReducedMotionPreference()
  const announce = useAnnounce()
  const alreadyDone = progress.candlesOut

  const [started, setStarted] = useState(alreadyDone)
  const [candles, setCandles] = useState(() => (alreadyDone ? finishedCandles() : []))
  const [done, setDone] = useState(alreadyDone)
  const [notice, setNotice] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const nextIdRef = useRef(alreadyDone ? MAX : 0)
  const celebratedRef = useRef(alreadyDone)
  const controlsRef = useRef(null)
  const helpId = useId()

  const lit = litCount(candles)
  const count = candles.length

  const makeId = () => `c${(nextIdRef.current += 1)}`
  const stopMicRef = useRef(null)

  // Every way of blowing ends here, so "all out" is handled in one place.
  function applyCandles(next) {
    setCandles(next)
    if (next.length > 0 && litCount(next) === 0 && !done) {
      setDone(true)
      stopMicRef.current?.()
      complete('candlesOut')
      announce(`Semua lilin padam. ${meta.legacyTitle}`)
      if (!celebratedRef.current) {
        celebratedRef.current = true
        celebrate({ reduced, origin: { y: 0.5 } })
      }
    }
  }

  const extinguish = (list, ids) =>
    list.map((candle) => (ids.has(candle.id) && candle.lit ? { ...candle, lit: false, outCount: candle.outCount + 1 } : candle))

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
    setStarted(true)
    requestAnimationFrame(() => controlsRef.current?.querySelector('button')?.focus())
  }

  const withOutCount = (list) => list.map((candle) => ({ outCount: 0, ...candle }))

  function place(point) {
    if (!started) return
    if (count >= MAX) {
      setNotice(`Sudah ${MAX} lilin, pas sekali untuk umur ${MAX} tahun ✨`)
      return
    }
    const next = addCandle(candles, MAX, point, makeId())
    setNotice(next === candles ? 'Tidak ada ruang lagi di situ, coba sisi lain ya.' : '')
    if (next !== candles) {
      setDone(false)
      setCandles(withOutCount(next))
    }
  }

  function handleSurfaceClick(event) {
    // Keyboard activation (detail === 0) uses the next tidy slot.
    if (event.detail === 0) {
      place(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    place({
      u: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      v: ((event.clientY - rect.top) / rect.height) * 2 - 1,
    })
  }

  function fill() {
    setNotice('')
    setDone(false)
    setCandles(withOutCount(fillCandles(candles, MAX, makeId)))
  }

  function blowOne(id) {
    applyCandles(extinguish(candles, new Set([id])))
  }

  function blowAll() {
    if (count === 0) {
      setNotice('Taruh lilinnya dulu, ya 🕯️')
      return
    }
    setNotice('')
    applyCandles(extinguish(candles, new Set(candles.map((candle) => candle.id))))
  }

  function relight() {
    celebratedRef.current = false
    setDone(false)
    setNotice('')
    setCandles((current) => current.map((candle) => ({ ...candle, lit: true })))
    announce('Lilin menyala lagi. Silakan tiup sekali lagi.')
  }

  // Back-to-front so nearer candles overlap farther ones.
  const ordered = [...candles].sort((a, b) => a.v - b.v)

  return (
    <Chapter id="kue" tone="dusk">
      <div className="container">
        <ChapterHeading id="kue" number={4} eyebrow={cake.eyebrow} title={cake.title} />

        <div className={styles.layout}>
          <div className={styles.cakeColumn}>
            <div className={styles.cake} style={{ '--glow': Math.min(1, lit / 10) }}>
              <div className={styles.roomGlow} aria-hidden="true" />
              <CakeArt className={styles.art} />

              <button
                type="button"
                className={styles.surface}
                style={{ left: `${SURFACE.left}%`, top: `${SURFACE.top}%`, width: `${SURFACE.width}%`, height: `${SURFACE.height}%` }}
                aria-label="Taruh lilin di sini"
                aria-disabled={!started || count >= MAX}
                onClick={handleSurfaceClick}
              />

              <ul className={styles.candles} aria-label="Lilin di atas kue">
                {ordered.map((candle, index) => {
                  const depth = (candle.v + 1) / 2
                  const number = candles.indexOf(candle) + 1
                  return (
                    <li
                      key={candle.id}
                      className={cx(styles.candle, !candle.lit && styles.out)}
                      style={{
                        left: `${50 + candle.u * (SURFACE.width / 2)}%`,
                        top: `${SURFACE.top + SURFACE.height / 2 + candle.v * (SURFACE.height / 2)}%`,
                        '--depth': (0.84 + depth * 0.16).toFixed(3),
                        '--delay': `${(index % 9) * 55}ms`,
                        zIndex: 10 + index,
                      }}
                    >
                      <span className={styles.stick} aria-hidden="true" />
                      {candle.lit ? (
                        <button type="button" className={styles.flameButton} aria-label={`Tiup lilin ${number}`} onClick={() => blowOne(candle.id)}>
                          <span className={styles.halo} />
                          <span className={styles.flame} />
                        </button>
                      ) : (
                        <span className={styles.smokeWrap} aria-hidden="true">
                          {candle.outCount > 0 && !reduced ? (
                            <span key={candle.outCount} className={styles.smoke}>
                              <span />
                              <span />
                              <span />
                            </span>
                          ) : null}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <p className={styles.counter} aria-live="polite" aria-atomic="true">
              {cake.counterLabel} <strong>{count}</strong>
              {count > 0 ? <span className={styles.litCount}> · {lit} menyala</span> : null}
            </p>
          </div>

          <div className={styles.panel}>
            {!started ? (
              <motion.div
                className={styles.card}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
              >
                <h3 className={styles.cardTitle}>{cake.instructions.heading}</h3>
                <ol className={styles.steps}>
                  {cake.instructions.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <button type="button" className="btn btn--primary btn--lg" onClick={begin}>
                  <Sparkles aria-hidden="true" />
                  {cake.instructions.start}
                </button>
              </motion.div>
            ) : (
              <>
                {done ? (
                  <motion.div
                    className={cx(styles.card, styles.doneCard)}
                    initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE_OUT }}
                  >
                    <p className={styles.doneKicker}>
                      <Wind aria-hidden="true" /> Semua lilin padam
                    </p>
                    <h3 className={styles.cardTitle}>{meta.legacyTitle}</h3>
                    <p className={styles.secret}>{cake.guidance.secret}</p>
                    <div className={styles.actions}>
                      <button type="button" className="btn btn--primary" onClick={() => goToChapter('bintang', { reduced })}>
                        Lanjut ke kejutan terakhir
                        <ArrowRight aria-hidden="true" />
                      </button>
                      <button type="button" className="btn btn--ghost" onClick={relight}>
                        <RotateCcw aria-hidden="true" />
                        Nyalakan lagi
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className={styles.card} ref={controlsRef}>
                    <p className={styles.hint}>{count === 0 ? cake.guidance.place : 'Buat permohonan dulu, lalu tiup lilinnya ✨'}</p>
                    <div className={styles.actions}>
                      <button type="button" className="btn btn--sm" onClick={() => place(null)} disabled={count >= MAX}>
                        <Plus aria-hidden="true" />
                        Tambah lilin
                      </button>
                      <button type="button" className="btn btn--sm" onClick={fill} disabled={count >= MAX}>
                        <Flame aria-hidden="true" />
                        Pasang {MAX} lilin
                      </button>
                    </div>
                    <button type="button" className={cx('btn btn--primary btn--lg', styles.blow)} onClick={blowAll}>
                      <Wind aria-hidden="true" />
                      Tiup lilinnya
                    </button>
                    {notice ? (
                      <p className={styles.notice} role="status">
                        {notice}
                      </p>
                    ) : null}

                    {isMicrophoneSupported() ? <MicPanel mic={mic} disabled={lit === 0} /> : null}

                    <details className={styles.howTo}>
                      <summary>Cara main</summary>
                      <ol className={styles.steps}>
                        {cake.instructions.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </details>
                  </div>
                )}

                <div className={styles.help}>
                  <button type="button" className="btn btn--ghost btn--sm" aria-expanded={helpOpen} aria-controls={helpId} onClick={() => setHelpOpen((value) => !value)}>
                    <CircleHelp aria-hidden="true" />
                    {cake.help.title}
                  </button>
                  <div id={helpId} hidden={!helpOpen} className={styles.helpBody}>
                    <p>{cake.help.text}</p>
                    <button type="button" className="btn btn--sm" onClick={() => goToChapter('bintang', { reduced })}>
                      {cake.help.cta}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Chapter>
  )
}

const MIC_MESSAGES = {
  requesting: 'Menunggu izin mikrofon…',
  listening: 'Tiup ke arah mikrofon! 🌬️',
  denied: 'Izin mikrofon tidak diberikan. Tidak apa-apa: ketuk apinya atau tekan “Tiup lilinnya”.',
  unsupported: 'Mikrofon tidak tersedia di perangkat ini. Ketuk apinya saja, ya.',
  error: 'Mikrofon tidak bisa dipakai sekarang. Ketuk apinya saja, ya.',
}

function MicPanel({ mic, disabled }) {
  const listening = mic.state === 'listening'
  const busy = mic.state === 'requesting'
  return (
    <div className={styles.mic}>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        aria-pressed={listening}
        disabled={busy || (disabled && !listening)}
        onClick={listening ? mic.stop : mic.start}
      >
        {listening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
        {listening ? 'Matikan mikrofon' : 'Tiup lewat mikrofon (opsional)'}
      </button>
      {mic.state !== 'off' ? (
        <p className={styles.micStatus} role="status">
          {MIC_MESSAGES[mic.state]}
        </p>
      ) : null}
      {listening ? (
        <>
          <p className={styles.micNote}>{cake.instructions.micTip} Suara hanya dianalisis di perangkat ini, tidak direkam atau dikirim.</p>
          <div className={styles.meter} aria-hidden="true">
            <span style={{ transform: `scaleX(${mic.level})` }} />
          </div>
        </>
      ) : null}
    </div>
  )
}
