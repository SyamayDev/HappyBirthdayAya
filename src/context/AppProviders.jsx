import { AnnouncerProvider } from './Announcer.jsx'
import { JourneyProvider } from './Journey.jsx'
import { MotionPreferenceProvider } from './MotionPreference.jsx'
import { MusicProvider } from './Music.jsx'
import { TransitionProvider } from './Transition.jsx'

/** All app-wide providers, in dependency order. Also used by tests. */
export function AppProviders({ children, initialStarted, initialMotionPreference }) {
  return (
    <MotionPreferenceProvider initialPreference={initialMotionPreference}>
      <AnnouncerProvider>
        <MusicProvider>
          <JourneyProvider initialStarted={initialStarted}>
            <TransitionProvider>{children}</TransitionProvider>
          </JourneyProvider>
        </MusicProvider>
      </AnnouncerProvider>
    </MotionPreferenceProvider>
  )
}
