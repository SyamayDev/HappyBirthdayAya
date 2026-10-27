import { useId, useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import { Music } from 'lucide-react'
import { welcome } from '../../data/content.js'
import { useJourney } from '../../context/Journey.jsx'
import { useMusic } from '../../context/Music.jsx'
import { Modal } from '../Modal/Modal.jsx'
import styles from './WelcomeModal.module.css'

/*
 * The original "Selamat Datang!" card. It used to ask for microphone access
 * (and froze the page if refused); now one tap starts the song, because the
 * tap itself is the user gesture browsers require for audio.
 */
export function WelcomeModal() {
  const { started } = useJourney()
  return <AnimatePresence>{started ? null : <WelcomeCard key="welcome" />}</AnimatePresence>
}

function WelcomeCard() {
  const { start } = useJourney()
  const { play } = useMusic()
  const openedRef = useRef(false)
  const titleId = useId()
  const textId = useId()

  function open(withMusic) {
    if (openedRef.current) return
    openedRef.current = true
    if (withMusic) play() // inside the click: counts as a user gesture
    start()
  }

  return (
    <Modal labelledBy={titleId} describedBy={textId} onDismiss={() => open(false)}>
      <h2 id={titleId} className={styles.title}>
        {welcome.title}
      </h2>
      <p id={textId} className={styles.text}>
        {welcome.description}
      </p>
      <button type="button" className={`btn ${styles.start}`} onClick={() => open(true)}>
        <Music aria-hidden="true" />
        {welcome.start}
      </button>
      <button type="button" className="btn btn--text" onClick={() => open(false)}>
        {welcome.startWithoutMusic}
      </button>
    </Modal>
  )
}
