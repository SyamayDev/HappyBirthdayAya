import { useState } from 'react'
import { pageTitles } from '../../data/content.js'
import { Book } from './Book.jsx'
import { PhotoRing } from './PhotoRing.jsx'
import styles from './HomePage.module.css'

/* The original index.html: photo ring on top, the book underneath. */
export function HomePage() {
  const [bookOpen, setBookOpen] = useState(false)
  return (
    <div className={styles.home}>
      <h1 className="visually-hidden">{pageTitles.beranda}</h1>
      <PhotoRing paused={bookOpen} />
      <Book open={bookOpen} onOpenChange={setBookOpen} />
    </div>
  )
}
