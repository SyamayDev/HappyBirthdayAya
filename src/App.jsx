import { useEffect } from 'react'
import { chapters } from './data/content.js'
import { useJourney } from './context/Journey.jsx'
import { chapterFromHash } from './lib/navigation.js'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'
import { SkyBackdrop } from './components/SkyBackdrop/SkyBackdrop.jsx'
import { OpeningGate } from './components/OpeningGate/OpeningGate.jsx'
import { Hero } from './components/Hero/Hero.jsx'
import { MemoryCarousel } from './components/MemoryCarousel/MemoryCarousel.jsx'
import { LetterBook } from './components/LetterBook/LetterBook.jsx'
import { PhotoPuzzle } from './components/PhotoPuzzle/PhotoPuzzle.jsx'
import { BirthdayCake } from './components/BirthdayCake/BirthdayCake.jsx'
import { GalaxyFinale } from './components/GalaxyFinale/GalaxyFinale.jsx'
import { Dock } from './components/Dock/Dock.jsx'
import { SparkleTrail } from './components/SparkleTrail/SparkleTrail.jsx'

const CHAPTER_IDS = chapters.map((chapter) => chapter.id)

export default function App() {
  const { started, resetCount } = useJourney()

  // After the gate opens: honour a #chapter in the URL, then move focus to
  // that chapter's heading so keyboard and screen-reader users land inside.
  useEffect(() => {
    if (!started) return undefined
    const frame = requestAnimationFrame(() => {
      const id = chapterFromHash(CHAPTER_IDS)
      const section = document.getElementById(id ?? CHAPTER_IDS[0])
      if (!section) return
      if (id) section.scrollIntoView({ block: 'start' })
      section.querySelector('[data-chapter-heading]')?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [started])

  return (
    <>
      <SkyBackdrop />
      <OpeningGate />

      <div inert={!started}>
        <a className="skip-link" href="#kenangan">
          Langsung ke galeri kenangan
        </a>
        <main id="main">
          <Hero />
          <ErrorBoundary label="Galeri kenangan">
            <MemoryCarousel />
          </ErrorBoundary>
          <ErrorBoundary label="Surat">
            <LetterBook />
          </ErrorBoundary>
          <ErrorBoundary label="Puzzle">
            <PhotoPuzzle key={`puzzle-${resetCount}`} />
          </ErrorBoundary>
          <ErrorBoundary label="Kue ulang tahun">
            <BirthdayCake key={`cake-${resetCount}`} />
          </ErrorBoundary>
          <ErrorBoundary label="Kejutan terakhir">
            <GalaxyFinale key={`finale-${resetCount}`} />
          </ErrorBoundary>
        </main>
      </div>

      {started ? <Dock /> : null}
      <SparkleTrail />
    </>
  )
}
