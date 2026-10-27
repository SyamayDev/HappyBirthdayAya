import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll } from 'motion/react'
import { Check, ChevronUp, Gauge, Loader2, Lock, Music, Pause, VolumeX } from 'lucide-react'
import { chapters } from '../../data/content.js'
import { useJourney } from '../../context/Journey.jsx'
import { useMusic } from '../../context/Music.jsx'
import { useMotionPreference } from '../../context/MotionPreference.jsx'
import { useAnnounce } from '../../context/Announcer.jsx'
import { useActiveChapter } from '../../hooks/useActiveChapter.js'
import { goToChapter } from '../../lib/navigation.js'
import { cx } from '../../lib/cx.js'
import { EASE_OUT } from '../../lib/motion.js'
import styles from './Dock.module.css'

/*
 * Always-available controls once the gate is open: where am I (chapter
 * menu), music on/off reflecting the real media state, and a reduced
 * motion toggle. Plus a thin reading-progress line at the top.
 */

const CHAPTER_IDS = chapters.map((chapter) => chapter.id)
const MILESTONE_FOR = { hadiah: 'puzzleSolved', kue: 'candlesOut', bintang: 'finaleUnlocked' }
const LAST_NUMBER = chapters[chapters.length - 1].number

export function Dock() {
  return (
    <>
      <ScrollProgress />
      <nav className={styles.dock} aria-label="Kontrol perjalanan">
        <ChapterMenu />
        <span className={styles.divider} aria-hidden="true" />
        <MusicButton />
        <MotionToggle />
      </nav>
    </>
  )
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  return <motion.div className={styles.progress} style={{ scaleX: scrollYProgress }} aria-hidden="true" />
}

function ChapterMenu() {
  const { progress } = useJourney()
  const { reduced } = useMotionPreference()
  const activeId = useActiveChapter(CHAPTER_IDS)
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef(null)
  const toggleRef = useRef(null)

  const active = chapters.find((chapter) => chapter.id === activeId) ?? chapters[0]

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function select(event, id) {
    event.preventDefault()
    setOpen(false)
    goToChapter(id, { reduced })
  }

  return (
    <div className={styles.menuRoot} ref={rootRef}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.chapterButton}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.chapterNumber} aria-hidden="true">
          {active.number === 0 ? '✦' : active.number}
        </span>
        <span className={styles.chapterText}>
          <span className="visually-hidden">Daftar bab. Sekarang: </span>
          <span className={styles.chapterKicker} aria-hidden="true">
            {active.number === 0 ? 'Awal' : `Bab ${active.number}/${LAST_NUMBER}`}
          </span>
          <span className={styles.chapterLabel}>{active.label}</span>
        </span>
        <ChevronUp className={cx(styles.chevron, open && styles.chevronOpen)} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            className={styles.menu}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            <p className={styles.menuTitle}>Perjalanan</p>
            <ol className={styles.menuList}>
              {chapters.map((chapter) => {
                const milestone = MILESTONE_FOR[chapter.id]
                const done = milestone ? progress[milestone] : false
                const locked = chapter.id === 'bintang' && !done
                const current = chapter.id === active.id
                return (
                  <li key={chapter.id}>
                    <a
                      href={`#${chapter.id}`}
                      className={cx(styles.menuLink, current && styles.menuLinkCurrent)}
                      aria-current={current ? 'location' : undefined}
                      onClick={(event) => select(event, chapter.id)}
                    >
                      <span className={styles.menuNumber} aria-hidden="true">
                        {chapter.number === 0 ? '✦' : chapter.number}
                      </span>
                      <span className={styles.menuLabel}>{chapter.label}</span>
                      {done ? (
                        <span className={styles.menuState}>
                          <Check aria-hidden="true" />
                          <span className="visually-hidden">(selesai)</span>
                        </span>
                      ) : null}
                      {locked ? (
                        <span className={cx(styles.menuState, styles.menuLocked)}>
                          <Lock aria-hidden="true" />
                          <span className="visually-hidden">(terkunci)</span>
                        </span>
                      ) : null}
                    </a>
                  </li>
                )
              })}
            </ol>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const MUSIC_LABELS = {
  idle: 'Putar musik',
  paused: 'Putar musik',
  blocked: 'Putar musik',
  loading: 'Memuat musik, ketuk untuk membatalkan',
  playing: 'Jeda musik',
  unavailable: 'Musik tidak tersedia, coba lagi',
}

function MusicButton() {
  const { status, toggle, play } = useMusic()
  const announce = useAnnounce()
  const previous = useRef(status)

  useEffect(() => {
    if (previous.current === status) return
    previous.current = status
    if (status === 'unavailable') announce('Musik tidak dapat dimuat. Halaman tetap bisa dinikmati tanpa musik.')
    if (status === 'blocked') announce('Browser menahan musik. Ketuk tombol musik untuk memutarnya.')
  }, [status, announce])

  const playing = status === 'playing'
  const loading = status === 'loading'
  const unavailable = status === 'unavailable'
  const visibleText = playing ? 'Musik' : unavailable ? 'Tidak ada musik' : status === 'blocked' ? 'Ketuk untuk memutar' : 'Musik'

  return (
    <button
      type="button"
      className={cx(styles.iconButton, styles.musicButton, playing && styles.isOn, unavailable && styles.isMuted)}
      aria-label={MUSIC_LABELS[status] ?? 'Putar musik'}
      aria-busy={loading || undefined}
      onClick={unavailable ? play : toggle}
    >
      {loading ? (
        <Loader2 className={styles.spin} aria-hidden="true" />
      ) : playing ? (
        <span className={styles.equalizer} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      ) : unavailable ? (
        <VolumeX aria-hidden="true" />
      ) : (
        <Music aria-hidden="true" />
      )}
      <span className={styles.buttonText} aria-hidden="true">
        {visibleText}
      </span>
      {playing ? <Pause className={styles.pauseHint} aria-hidden="true" /> : null}
    </button>
  )
}

function MotionToggle() {
  const { reduced, toggleReduced } = useMotionPreference()
  return (
    <button
      type="button"
      className={cx(styles.iconButton, reduced && styles.isOn)}
      aria-pressed={reduced}
      aria-label="Animasi hemat"
      title={reduced ? 'Animasi hemat aktif' : 'Kurangi animasi'}
      onClick={toggleReduced}
    >
      <Gauge aria-hidden="true" />
      <span className={styles.buttonText} aria-hidden="true">
        Hemat
      </span>
    </button>
  )
}
