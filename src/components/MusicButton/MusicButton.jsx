import { useEffect, useRef } from 'react'
import { Loader2, Music, VolumeX } from 'lucide-react'
import { useMusic } from '../../context/Music.jsx'
import { useAnnounce } from '../../context/Announcer.jsx'
import { cx } from '../../lib/cx.js'
import styles from './MusicButton.module.css'

/*
 * Small floating music control (the original had none: music started on its
 * own or not at all). It mirrors the real audio state.
 */

const LABELS = {
  idle: 'Putar musik',
  paused: 'Putar musik',
  blocked: 'Putar musik',
  loading: 'Memuat musik',
  playing: 'Jeda musik',
  unavailable: 'Musik tidak tersedia, coba lagi',
}

export function MusicButton({ className }) {
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
  return (
    <button
      type="button"
      className={cx(styles.button, playing && styles.playing, className)}
      aria-label={LABELS[status] ?? 'Putar musik'}
      aria-busy={status === 'loading' || undefined}
      onClick={status === 'unavailable' ? play : toggle}
    >
      {status === 'loading' ? (
        <Loader2 className={styles.spin} aria-hidden="true" />
      ) : playing ? (
        <span className={styles.bars} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      ) : status === 'unavailable' ? (
        <VolumeX aria-hidden="true" />
      ) : (
        <Music aria-hidden="true" />
      )}
      {!playing && status !== 'unavailable' && status !== 'loading' ? <span className={styles.slash} aria-hidden="true" /> : null}
    </button>
  )
}
