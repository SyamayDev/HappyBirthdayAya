import { AnnouncerProvider } from './Announcer.jsx'
import { JourneyProvider } from './Journey.jsx'
import { MotionPreferenceProvider } from './MotionPreference.jsx'
import { MusicProvider } from './Music.jsx'

/** All app-wide providers, in dependency order. Also used by tests and the dev harness. */
export function AppProviders({ children, initialStarted, initialProgress, initialMotionPreference }) {
  return (
    <MotionPreferenceProvider initialPreference={initialMotionPreference}>
      <AnnouncerProvider>
        <MusicProvider>
          <JourneyProvider initialStarted={initialStarted} initialProgress={initialProgress}>
            {children}
          </JourneyProvider>
        </MusicProvider>
      </AnnouncerProvider>
    </MotionPreferenceProvider>
  )
}
