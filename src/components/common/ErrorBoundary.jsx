import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

/*
 * Catches render errors. `variant="page"` shows a full-screen fallback with
 * reload; `variant="section"` keeps the rest of the journey usable when one
 * chapter fails (e.g. the 3D finale on an unusual device).
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { children, variant = 'section', label = 'Bagian ini' } = this.props
    if (!error) return children

    if (variant === 'page') {
      return (
        <main className={styles.page} role="alert">
          <div className={styles.card}>
            <p className={styles.icon} aria-hidden="true">☁️</p>
            <h1 className={styles.title}>Ups, ada yang tersangkut di awan.</h1>
            <p className={styles.text}>Halaman ini gagal dimuat dengan benar. Coba muat ulang, ya.</p>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Muat ulang halaman
            </button>
          </div>
        </main>
      )
    }

    return (
      <div className={styles.section} role="alert">
        <p className={styles.text}>{label} gagal ditampilkan.</p>
        <button type="button" className="btn btn--sm" onClick={this.handleRetry}>
          Coba lagi
        </button>
      </div>
    )
  }
}
