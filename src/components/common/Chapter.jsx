import { cx } from '../../lib/cx.js'
import styles from './Chapter.module.css'

/*
 * Section wrapper for every chapter: consistent spacing, background tone,
 * landmark labelling and a focusable heading for in-page navigation.
 *
 * tone: 'day' | 'dawn' | 'dusk' | 'night' | 'none'
 */
export function Chapter({ id, tone = 'day', className, children, ...rest }) {
  return (
    <section
      id={id}
      data-chapter={id}
      aria-labelledby={`${id}-title`}
      className={cx(styles.chapter, styles[tone], className)}
      {...rest}
    >
      {children}
    </section>
  )
}

/**
 * Chapter heading. Renders `Bab N · eyebrow`, an <h2 id="{id}-title">
 * (focus target for navigation) and an optional lead paragraph.
 */
export function ChapterHeading({ id, number, eyebrow, title, lead, align = 'center', tone = 'day', className }) {
  return (
    <header className={cx(styles.heading, styles[`align-${align}`], tone === 'night' && styles.onNight, className)}>
      <p className={cx('eyebrow', styles.eyebrow)}>
        <span className={styles.eyebrowMark} aria-hidden="true" />
        {typeof number === 'number' ? `Bab ${number} · ${eyebrow}` : eyebrow}
      </p>
      <h2 id={`${id}-title`} tabIndex={-1} data-chapter-heading className={styles.title}>
        {title}
      </h2>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </header>
  )
}
