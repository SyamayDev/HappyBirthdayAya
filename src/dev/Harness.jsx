import { Suspense, lazy } from 'react'
import { AppProviders } from '../context/AppProviders.jsx'
import { ErrorBoundary } from '../components/common/ErrorBoundary.jsx'
import { MILESTONES } from '../context/Journey.jsx'

/*
 * DEVELOPMENT ONLY — never included in production builds (see main.jsx).
 *
 * Renders one or more chapters in isolation so they can be built and
 * screenshotted independently:
 *   /?harness=kenangan
 *   /?harness=hero,kenangan&motion=reduced
 *   /?harness=bintang&progress=candlesOut,finaleUnlocked
 *   /?harness=gate&started=0
 * Each chapter is lazy-loaded, so a broken one cannot break the others.
 */

const named = (loader, exportName) => lazy(() => loader().then((module) => ({ default: module[exportName] })))

const CHAPTERS = {
  sky: named(() => import('../components/SkyBackdrop/SkyBackdrop.jsx'), 'SkyBackdrop'),
  gate: named(() => import('../components/OpeningGate/OpeningGate.jsx'), 'OpeningGate'),
  hero: named(() => import('../components/Hero/Hero.jsx'), 'Hero'),
  kenangan: named(() => import('../components/MemoryCarousel/MemoryCarousel.jsx'), 'MemoryCarousel'),
  surat: named(() => import('../components/LetterBook/LetterBook.jsx'), 'LetterBook'),
  hadiah: named(() => import('../components/PhotoPuzzle/PhotoPuzzle.jsx'), 'PhotoPuzzle'),
  kue: named(() => import('../components/BirthdayCake/BirthdayCake.jsx'), 'BirthdayCake'),
  bintang: named(() => import('../components/GalaxyFinale/GalaxyFinale.jsx'), 'GalaxyFinale'),
  dock: named(() => import('../components/Dock/Dock.jsx'), 'Dock'),
  trail: named(() => import('../components/SparkleTrail/SparkleTrail.jsx'), 'SparkleTrail'),
}

export default function Harness({ name }) {
  const params = new URLSearchParams(window.location.search)
  const names = name.split(',').filter((key) => key in CHAPTERS)
  const started = params.get('started') !== '0'
  const flags = (params.get('progress') ?? '').split(',')
  const progress = Object.fromEntries(MILESTONES.map((key) => [key, flags.includes(key)]))
  const motion = params.get('motion') ?? 'system'
  const withSky = params.get('sky') !== '0' && !names.includes('sky')
  const Sky = CHAPTERS.sky

  return (
    <AppProviders initialStarted={started} initialProgress={progress} initialMotionPreference={motion}>
      <Suspense fallback={null}>
        {withSky ? <Sky /> : null}
        <main id="main">
          {names.map((key) => {
            const Chapter = CHAPTERS[key]
            return (
              <ErrorBoundary key={key} label={`Harness: ${key}`}>
                <Suspense fallback={<p style={{ padding: 24 }}>Memuat {key}…</p>}>
                  <Chapter />
                </Suspense>
              </ErrorBoundary>
            )
          })}
        </main>
      </Suspense>
      {names.length === 0 ? <p style={{ padding: 24 }}>Unknown harness “{name}”. Options: {Object.keys(CHAPTERS).join(', ')}</p> : null}
    </AppProviders>
  )
}
