import { useEffect, useId, useRef, useState } from 'react'
import { BookOpen, Gift } from 'lucide-react'
import { letter } from '../../data/content.js'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { goToChapter } from '../../lib/navigation.js'
import { cx } from '../../lib/cx.js'
import { Chapter, ChapterHeading } from '../common/Chapter.jsx'
import { Reveal } from '../common/Reveal.jsx'
import styles from './LetterBook.module.css'

/*
 * The letter lives inside a hardcover book (the original "Ciptaan Tuhan
 * Untukku" cover). The cover is the only toggle; the "Buka!" button inside
 * the letter is a separate control, so it can never re-close the book
 * through event bubbling (a bug in the original page).
 */
export function LetterBook() {
  const reduced = useReducedMotionPreference()
  const [open, setOpen] = useState(false)
  const coverRef = useRef(null)
  const letterTitleRef = useRef(null)
  const pendingFocusRef = useRef(null)
  const letterId = useId()
  const coverDescriptionId = useId()

  useEffect(() => {
    const target = pendingFocusRef.current
    if (!target) return
    pendingFocusRef.current = null
    const element = target === 'letter' ? letterTitleRef.current : coverRef.current
    element?.focus({ preventScroll: target === 'cover' })
  }, [open])

  function openBook() {
    pendingFocusRef.current = 'letter'
    setOpen(true)
  }

  function closeBook() {
    pendingFocusRef.current = 'cover'
    setOpen(false)
  }

  return (
    <Chapter id="surat" tone="day">
      <div className="container">
        <ChapterHeading id="surat" number={2} eyebrow={letter.eyebrow} title={letter.sectionTitle} lead={letter.lead} />

        <Reveal className={styles.stage}>
          <div className={cx(styles.book, open && styles.open)}>
            <span className={styles.bookmark} aria-hidden="true" />

            <article
              id={letterId}
              className={styles.page}
              aria-labelledby={`${letterId}-title`}
              inert={!open}
              aria-hidden={!open}
            >
              <div className={styles.paper}>
                <button type="button" className={cx('btn btn--ghost btn--sm', styles.close)} onClick={closeBook}>
                  <BookOpen aria-hidden="true" />
                  {letter.closeLabel}
                </button>

                <h3 id={`${letterId}-title`} ref={letterTitleRef} tabIndex={-1} className={styles.title}>
                  {letter.title}
                </h3>
                <p className={styles.greeting}>{letter.greeting}</p>
                {letter.paragraphs.map((paragraph) => (
                  <p key={paragraph} className={styles.paragraph}>
                    {paragraph}
                  </p>
                ))}

                <div className={styles.cta}>
                  <button type="button" className="btn btn--primary" onClick={() => goToChapter('hadiah', { reduced })}>
                    <Gift aria-hidden="true" />
                    {letter.cta}
                  </button>
                </div>

                <p className={styles.signOff}>
                  {letter.signOff}
                  <svg className={styles.flourish} viewBox="0 0 120 40" aria-hidden="true" focusable="false">
                    <path d="M4 30 C 30 36, 52 34, 74 22 C 84 16, 86 6, 78 6 C 70 6, 72 18, 82 22 C 94 27, 106 22, 116 14" />
                  </svg>
                </p>
              </div>
            </article>

            <button
              ref={coverRef}
              type="button"
              className={styles.cover}
              aria-expanded={open}
              aria-controls={letterId}
              aria-describedby={coverDescriptionId}
              aria-label={letter.openLabel}
              tabIndex={open ? -1 : 0}
              aria-hidden={open || undefined}
              onClick={openBook}
            >
              <span className={styles.coverFront}>
                <img
                  src={letter.cover.src}
                  width={letter.cover.width}
                  height={letter.cover.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
                <span className={styles.coverSheen} />
              </span>
              <span className={styles.coverInside}>
                <span className={styles.monogram}>A</span>
              </span>
            </button>
            <span id={coverDescriptionId} className="visually-hidden">
              {letter.cover.alt}
            </span>
          </div>

          <p className={cx(styles.hint, open && styles.hintHidden)} aria-hidden="true">
            Ketuk sampulnya ✦
          </p>
        </Reveal>
      </div>
    </Chapter>
  )
}
