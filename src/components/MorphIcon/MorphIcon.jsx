import { useId } from 'react'
import { motion } from 'motion/react'
import { useReducedMotionPreference } from '../../context/MotionPreference.jsx'
import { HEART, SPARKLE } from '../../lib/morphShapes.js'
import styles from './MorphIcon.module.css'

/*
 * The heart that sat on top of every card in the original site — now it
 * breathes and MORPHS: heart → sparkle → heart, forever (static heart under
 * reduced motion).
 */
export function MorphIcon({ className, size = 64, tone = 'blue' }) {
  const reduced = useReducedMotionPreference()
  const gradientId = useId().replace(/:/g, '')
  return (
    <span className={`${styles.icon} ${className ?? ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={tone === 'light' ? '#ffffff' : '#bfe3ff'} />
            <stop offset="0.45" stopColor={tone === 'light' ? '#e3f1ff' : '#4aa3f7'} />
            <stop offset="1" stopColor={tone === 'light' ? '#9fd1ff' : '#2161c4'} />
          </linearGradient>
        </defs>
        {reduced ? (
          <path d={HEART} fill={`url(#${gradientId})`} />
        ) : (
          <motion.path
            fill={`url(#${gradientId})`}
            initial={{ d: HEART }}
            animate={{ d: [HEART, HEART, SPARKLE, SPARKLE, HEART], rotate: [0, 0, 45, 45, 0] }}
            transition={{ duration: 4.2, times: [0, 0.35, 0.55, 0.8, 1], ease: 'easeInOut', repeat: Infinity }}
            style={{ originX: '50%', originY: '50%' }}
          />
        )}
        <ellipse cx="34" cy="30" rx="9" ry="6" fill="rgba(255,255,255,0.65)" transform="rotate(-30 34 30)" />
      </svg>
    </span>
  )
}
