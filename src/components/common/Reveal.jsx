import { motion } from 'motion/react'
import { EASE_OUT } from '../../lib/motion.js'

/*
 * Fades content up the first time it scrolls into view. Without
 * IntersectionObserver the content renders immediately (never stuck hidden).
 * Under reduced motion <MotionConfig> drops the movement and keeps a fade.
 */
const supportsInView = typeof window !== 'undefined' && 'IntersectionObserver' in window

const TAGS = {
  div: motion.div,
  section: motion.section,
  header: motion.header,
  li: motion.li,
  p: motion.p,
  figure: motion.figure,
  article: motion.article,
}

export function Reveal({ as = 'div', delay = 0, y = 24, amount = 0.25, children, ...rest }) {
  const Tag = TAGS[as] ?? motion.div
  if (!supportsInView) {
    return <Tag {...rest}>{children}</Tag>
  }
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
