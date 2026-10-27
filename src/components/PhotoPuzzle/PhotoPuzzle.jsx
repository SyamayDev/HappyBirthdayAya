import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Eye, EyeOff, Gift, RefreshCw, RotateCcw, Shuffle, SlidersHorizontal, WandSparkles } from 'lucide-react'
import { people, puzzle } from '../../data/content.js'
import { STORAGE_KEYS, useJourney } from '../../context/Journey.jsx'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { useAnnounce } from '../../context/Announcer.jsx'
import { readStorage, removeStorage, writeStorage } from '../../lib/storage.js'
import { celebrate } from '../../lib/celebrate.js'
import { goToChapter } from '../../lib/navigation.js'
import { cx } from '../../lib/cx.js'
import { EASE_OUT, SPRING } from '../../lib/motion.js'
import { Chapter, ChapterHeading } from '../common/Chapter.jsx'
import { Reveal } from '../common/Reveal.jsx'
import { countCorrect, createSolved, isSolved, isValidSaved, neighbourSlot, shuffleOrder, swap } from './puzzleLogic.js'
import { useImageStatus } from './useImageStatus.js'
import styles from './PhotoPuzzle.module.css'

/*
 * Legacy: a drag-only canvas jigsaw (no keyboard, no reset, blurry on
 * phones, started twice per click, dead-ended if a CDN failed). Now: a swap
 * puzzle that works by tap, mouse drag and keyboard, survives a refresh,
 * and ends with the original success message.
 */

const DIFFICULTIES = puzzle.difficulties

function difficultyById(id) {
  return DIFFICULTIES.find((item) => item.id === id) ?? DIFFICULTIES[0]
}

function initialState(puzzleSolved) {
  if (puzzleSolved) return { phase: 'solved', difficulty: DIFFICULTIES[0].id, order: null, moves: 0, round: 0, fromGame: false }
  const saved = readStorage(STORAGE_KEYS.puzzle, (value) => isValidSaved(value, DIFFICULTIES), null)
  if (saved) return { phase: 'playing', difficulty: saved.difficulty, order: saved.order, moves: saved.moves, round: 0, fromGame: false }
  return { phase: 'intro', difficulty: DIFFICULTIES[0].id, order: null, moves: 0, round: 0, fromGame: false }
}

export function PhotoPuzzle() {
  const { progress, complete } = useJourney()
  const reduced = useReducedMotionPreference()
  const announce = useAnnounce()
  const image = useImageStatus(puzzle.image.src)
  const [game, setGame] = useState(() => initialState(progress.puzzleSolved))
  const celebratedRef = useRef(false)

  // Keep an in-progress game across refreshes; forget it once finished.
  useEffect(() => {
    if (game.phase === 'playing') {
      writeStorage(STORAGE_KEYS.puzzle, { difficulty: game.difficulty, order: game.order, moves: game.moves })
    } else {
      removeStorage(STORAGE_KEYS.puzzle)
    }
  }, [game])

  function start(difficultyId) {
    const { cols, rows } = difficultyById(difficultyId)
    setGame((current) => ({
      phase: 'playing',
      difficulty: difficultyId,
      order: shuffleOrder(cols * rows),
      moves: 0,
      round: current.round + 1,
      fromGame: false,
    }))
  }

  function finish() {
    setGame((current) => ({ ...current, phase: 'solved', fromGame: true }))
  }

  function handleSolved() {
    complete('puzzleSolved')
    announce(`${puzzle.success.title} Puzzle selesai.`)
    if (!celebratedRef.current) {
      celebratedRef.current = true
      celebrate({ reduced })
    }
    if (reduced) finish()
    else setGame((current) => ({ ...current, phase: 'assembled' }))
  }

  function updateBoard(order, moves) {
    setGame((current) => ({ ...current, order, moves }))
    if (isSolved(order)) handleSolved()
  }

  function playAgain() {
    celebratedRef.current = false
    setGame((current) => ({ ...current, phase: 'intro', order: null, moves: 0, fromGame: true }))
  }

  return (
    <Chapter id="hadiah" tone="day">
      <div className="container">
        <ChapterHeading id="hadiah" number={3} eyebrow={puzzle.eyebrow} title={puzzle.title} />

        {game.phase === 'intro' ? (
          <PuzzleIntro
            image={image}
            difficulty={game.difficulty}
            onStart={start}
            focusOnMount={game.fromGame}
          />
        ) : null}

        {game.phase === 'playing' || game.phase === 'assembled' ? (
          <PuzzleGame
            key={game.round}
            image={image}
            game={game}
            reduced={reduced}
            onBoardChange={updateBoard}
            onAssembled={finish}
            onReshuffle={() => start(game.difficulty)}
            onChangeDifficulty={() => setGame((current) => ({ ...current, phase: 'intro', order: null, moves: 0 }))}
          />
        ) : null}

        {game.phase === 'solved' ? <PuzzleSuccess reduced={reduced} focusOnMount={game.fromGame} onPlayAgain={playAgain} /> : null}
      </div>
    </Chapter>
  )
}

/* ── Intro ──────────────────────────────────────────────── */
function PuzzleIntro({ image, difficulty, onStart, focusOnMount }) {
  const [choice, setChoice] = useState(difficulty)
  const [starting, setStarting] = useState(false)
  const headingRef = useRef(null)

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus()
  }, [focusOnMount])

  return (
    <Reveal className={styles.intro}>
      <div className={styles.mystery} aria-hidden="true">
        <div className={styles.mysteryPhoto} data-status={image.status}>
          {image.status !== 'error' ? <img src={puzzle.image.src} alt="" width={puzzle.image.width} height={puzzle.image.height} /> : null}
          <span className={styles.mysteryMark}>?</span>
        </div>
      </div>

      <div className={styles.introCard}>
        <h3 ref={headingRef} tabIndex={-1} className={styles.introHeading}>
          {puzzle.intro.heading}
        </h3>
        <p className={styles.introMessage}>{puzzle.intro.message}</p>
        <blockquote className={styles.quote}>
          <p>{puzzle.intro.quote}</p>
        </blockquote>

        <fieldset className={styles.levels}>
          <legend className={styles.levelsLegend}>Pilih tingkat</legend>
          {DIFFICULTIES.map((item) => (
            <label key={item.id} className={cx(styles.level, choice === item.id && styles.levelActive)}>
              <input
                type="radio"
                name="puzzle-level"
                value={item.id}
                checked={choice === item.id}
                onChange={() => setChoice(item.id)}
                className="visually-hidden"
              />
              <span className={styles.levelName}>{item.label}</span>
              <span className={styles.levelMeta}>{item.cols * item.rows} keping</span>
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          className="btn btn--primary btn--lg"
          disabled={starting}
          onClick={() => {
            setStarting(true)
            onStart(choice)
          }}
        >
          <WandSparkles aria-hidden="true" />
          {puzzle.intro.start}
        </button>
      </div>
    </Reveal>
  )
}

/* ── Game ───────────────────────────────────────────────── */
function PuzzleGame({ image, game, reduced, onBoardChange, onAssembled, onReshuffle, onChangeDifficulty }) {
  const { cols, rows } = difficultyById(game.difficulty)
  const total = cols * rows
  const order = game.order
  const assembled = game.phase === 'assembled'
  const [selected, setSelected] = useState(null)
  const [focusSlot, setFocusSlot] = useState(0)
  const [peek, setPeek] = useState(false)
  const [status, setStatus] = useState('')
  const [drag, setDrag] = useState(null)
  const boardRef = useRef(null)
  const pendingFocusRef = useRef(false)
  const suppressClickRef = useRef(false)

  const correct = countCorrect(order)

  useEffect(() => {
    if (!pendingFocusRef.current) return
    pendingFocusRef.current = false
    // DOM order always matches slot order, so the slot's element is board.children[slot].
    boardRef.current?.children[focusSlot]?.focus({ preventScroll: true })
  }, [focusSlot, order])

  function commitSwap(a, b) {
    const next = swap(order, a, b)
    const nextCorrect = countCorrect(next)
    setSelected(null)
    setStatus(`${nextCorrect} dari ${total} potongan sudah pas. Langkah ke-${game.moves + 1}.`)
    onBoardChange(next, game.moves + 1)
  }

  function activate(slot) {
    if (assembled) return
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setFocusSlot(slot)
    if (selected === null) {
      setSelected(slot)
      setStatus(`Potongan ${order[slot] + 1} dipilih. Pilih potongan lain untuk ditukar.`)
    } else if (selected === slot) {
      setSelected(null)
      setStatus('Pilihan dibatalkan.')
    } else {
      pendingFocusRef.current = document.activeElement === boardRef.current?.children[slot]
      commitSwap(selected, slot)
    }
  }

  function handleKeyDown(event, slot) {
    if (event.key === 'Escape' && selected !== null) {
      event.preventDefault()
      setSelected(null)
      setStatus('Pilihan dibatalkan.')
      return
    }
    const next = neighbourSlot(slot, event.key, cols, rows)
    if (next !== slot) {
      event.preventDefault()
      pendingFocusRef.current = true
      setFocusSlot(next)
    }
  }

  function slotFromPoint(x, y) {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null
    const col = Math.min(cols - 1, Math.floor(((x - rect.left) / rect.width) * cols))
    const row = Math.min(rows - 1, Math.floor(((y - rect.top) / rect.height) * rows))
    return row * cols + col
  }

  // Mouse/pen drag-and-drop. Touch uses tap-to-swap so page scrolling stays free.
  function handlePointerDown(event, slot) {
    if (assembled || event.pointerType === 'touch' || event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrag({ slot, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, active: false, over: null })
  }

  function handlePointerMove(event) {
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    const active = drag.active || Math.hypot(dx, dy) > 6
    setDrag({ ...drag, dx, dy, active, over: active ? slotFromPoint(event.clientX, event.clientY) : null })
  }

  function handlePointerUp(event) {
    if (!drag) return
    const current = drag
    setDrag(null)
    if (!current.active) return
    suppressClickRef.current = true
    const target = slotFromPoint(event.clientX, event.clientY)
    if (target !== null && target !== current.slot) {
      setFocusSlot(target)
      commitSwap(current.slot, target)
    }
  }

  function autoSolve() {
    setSelected(null)
    setStatus('Puzzle disusun otomatis.')
    onBoardChange(createSolved(total), game.moves)
  }

  return (
    <div className={styles.game}>
      <div className={styles.boardColumn}>
        <motion.div
          className={cx(styles.boardFrame, assembled && styles.boardAssembled)}
          animate={assembled ? { scale: [1, 1.025, 1] } : { scale: 1 }}
          transition={{ duration: reduced ? 0 : 1.1, ease: EASE_OUT }}
          onAnimationComplete={() => {
            if (assembled) onAssembled()
          }}
        >
          {image.status === 'error' ? (
            <div className={styles.imageError} role="alert">
              <p>Foto puzzle gagal dimuat.</p>
              <button type="button" className="btn btn--sm" onClick={image.retry}>
                <RefreshCw aria-hidden="true" />
                Coba lagi
              </button>
            </div>
          ) : (
            <div
              ref={boardRef}
              className={cx(styles.board, image.status === 'loading' && styles.boardLoading)}
              style={{ '--cols': cols, '--rows': rows }}
              role="group"
              aria-label={`Papan puzzle, ${total} potongan`}
              aria-describedby="puzzle-help"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => setDrag(null)}
            >
              {order.map((piece, slot) => {
                const row = Math.floor(slot / cols)
                const col = slot % cols
                const isCorrect = piece === slot
                const pieceRow = Math.floor(piece / cols)
                const pieceCol = piece % cols
                const dragging = Boolean(drag?.active && drag.slot === slot)
                return (
                  <motion.button
                    key={piece}
                    layout
                    transition={SPRING.snappy}
                    type="button"
                    tabIndex={slot === focusSlot ? 0 : -1}
                    aria-pressed={selected === slot}
                    aria-label={`Potongan ${piece + 1}, di baris ${row + 1} kolom ${col + 1}${isCorrect ? ', sudah pas' : ''}`}
                    className={cx(
                      styles.piece,
                      selected === slot && styles.selected,
                      isCorrect && styles.correct,
                      dragging && styles.dragging,
                      drag?.active && drag.over === slot && drag.slot !== slot && styles.dropTarget,
                    )}
                    onClick={() => activate(slot)}
                    onKeyDown={(event) => handleKeyDown(event, slot)}
                    onFocus={() => setFocusSlot(slot)}
                    onPointerDown={(event) => handlePointerDown(event, slot)}
                  >
                    <span
                      className={styles.face}
                      style={{
                        backgroundImage: `url(${puzzle.image.src})`,
                        backgroundSize: `${cols * 100}% ${rows * 100}%`,
                        backgroundPosition: `${cols > 1 ? (pieceCol / (cols - 1)) * 100 : 0}% ${rows > 1 ? (pieceRow / (rows - 1)) * 100 : 0}%`,
                        '--dx': dragging ? `${drag.dx}px` : '0px',
                        '--dy': dragging ? `${drag.dy}px` : '0px',
                      }}
                    >
                      {isCorrect && !assembled ? (
                        <span className={styles.check} aria-hidden="true">
                          <Check />
                        </span>
                      ) : null}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          )}

          <div className={cx(styles.peek, peek && styles.peekVisible)} aria-hidden="true">
            <img src={puzzle.image.src} alt="" />
          </div>
        </motion.div>
      </div>

      <div className={styles.panel}>
        <p id="puzzle-help" className={styles.help}>
          Ketuk satu potongan, lalu ketuk potongan lain untuk menukarnya. Di komputer bisa juga digeser, atau pakai tombol panah dan Enter.
        </p>

        <div className={styles.meter} aria-hidden="true">
          <div className={styles.meterTrack}>
            <div className={styles.meterFill} style={{ transform: `scaleX(${correct / total})` }} />
          </div>
          <p className={styles.meterText}>
            <span className={styles.meterNumber}>{correct}</span> dari {total} potongan sudah pas · {game.moves} langkah
          </p>
        </div>

        <p className="visually-hidden" aria-live="polite" aria-atomic="true">
          {status}
        </p>

        <div className={styles.toolbar}>
          <button type="button" className="btn btn--sm" aria-pressed={peek} onClick={() => setPeek((value) => !value)} disabled={assembled}>
            {peek ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            Intip foto
          </button>
          <button type="button" className="btn btn--sm" onClick={onReshuffle} disabled={assembled}>
            <Shuffle aria-hidden="true" />
            Acak ulang
          </button>
          <button type="button" className="btn btn--sm" onClick={autoSolve} disabled={assembled}>
            <WandSparkles aria-hidden="true" />
            Bantu susun
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onChangeDifficulty} disabled={assembled}>
            <SlidersHorizontal aria-hidden="true" />
            Ganti tingkat
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Success ────────────────────────────────────────────── */
function PuzzleSuccess({ reduced, focusOnMount, onPlayAgain }) {
  const titleRef = useRef(null)

  useEffect(() => {
    // Solving removes the focused piece; move focus to the result instead.
    if (focusOnMount) titleRef.current?.focus({ preventScroll: true })
  }, [focusOnMount])

  const enter = (delay) =>
    reduced
      ? { initial: false }
      : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE_OUT, delay } }

  return (
    <div className={styles.success}>
      <motion.figure className={styles.polaroid} {...enter(0)}>
        <div className={styles.polaroidPhoto}>
          <img src={puzzle.image.src} alt={puzzle.image.alt} width={puzzle.image.width} height={puzzle.image.height} />
          <span className={styles.shine} aria-hidden="true" />
        </div>
        <figcaption className={styles.polaroidCaption}>{people.couple}</figcaption>
      </motion.figure>

      <div className={styles.successText}>
        <motion.div className={styles.note} {...enter(0.35)}>
          <span className={styles.noteEnvelope} aria-hidden="true">
            <span className={styles.noteFlap} />
          </span>
          <p className={styles.noteText}>{puzzle.success.envelopeNote}</p>
        </motion.div>

        <motion.div className={styles.message} {...enter(0.7)}>
          <p className={styles.badge}>{puzzle.success.badge}</p>
          <h3 ref={titleRef} tabIndex={-1} className={styles.successTitle}>
            {puzzle.success.title}
          </h3>
          <p className={styles.successDescription}>{puzzle.success.description}</p>
          <div className={styles.successActions}>
            <button type="button" className="btn btn--primary btn--lg" onClick={() => goToChapter('kue', { reduced })}>
              <Gift aria-hidden="true" />
              {puzzle.success.cta}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onPlayAgain}>
              <RotateCcw aria-hidden="true" />
              Main lagi
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
