import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { pageTitles } from './data/content.js'
import { useRoute } from './lib/router.js'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'
import { HeartsBackground } from './components/HeartsBackground/HeartsBackground.jsx'
import { HeartTrail } from './components/HeartTrail/HeartTrail.jsx'
import { MusicButton } from './components/MusicButton/MusicButton.jsx'
import { WelcomeModal } from './components/WelcomeModal/WelcomeModal.jsx'
import { HomePage } from './pages/Home/HomePage.jsx'
import { PuzzlePage } from './pages/Puzzle/PuzzlePage.jsx'
import { CakePage } from './pages/Cake/CakePage.jsx'
import { GalaxyPage } from './pages/Galaxy/GalaxyPage.jsx'

/*
 * Same journey as the original four HTML pages:
 *   #/        home   — photo ring + book with the letter
 *   #/puzzle  puzzle — jigsaw of Ayil & Aya
 *   #/kue     cake   — candles, blow, secret word
 *   #/galaksi galaxy — the final surprise
 */
const PAGES = { beranda: HomePage, puzzle: PuzzlePage, kue: CakePage, galaksi: GalaxyPage }
const BACKGROUNDS = { beranda: 'home', puzzle: 'puzzle', kue: 'cake' }

export default function App() {
  const route = useRoute()
  const Page = PAGES[route]

  useEffect(() => {
    document.title = pageTitles[route]
    window.scrollTo(0, 0)
  }, [route])

  return (
    <>
      {BACKGROUNDS[route] ? <HeartsBackground variant={BACKGROUNDS[route]} /> : null}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={route}
          id="main"
          className="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ErrorBoundary label="Halaman ini">
            <Page />
          </ErrorBoundary>
        </motion.main>
      </AnimatePresence>
      <MusicButton />
      <HeartTrail />
      <WelcomeModal />
    </>
  )
}
