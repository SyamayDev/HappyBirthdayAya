import { useEffect, useRef } from 'react'
import { motion, useIsPresent } from 'motion/react'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import { cx } from '../../lib/cx.js'
import { MorphIcon } from '../MorphIcon/MorphIcon.jsx'
import styles from './Modal.module.css'

/*
 * The original site's floating card (white-pink card with a heart on top),
 * now blue, on a native <dialog>: the browser traps focus and makes the page
 * behind inert. Render it inside <AnimatePresence> so it can animate out.
 *
 * variant: 'card' (light card, legacy permission/instruction modal)
 *          'blue' (blue gradient card, legacy puzzle intro)
 */
export function Modal({ labelledBy, describedBy, onDismiss, variant = 'card', icon = true, children, className }) {
  const dialogRef = useRef(null)
  const isPresent = useIsPresent()
  useScrollLock(isPresent)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  // While animating out, stop being modal at once so the page is usable
  // immediately (a closing modal dialog would keep everything inert).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!isPresent && dialog?.open) {
      dialog.close()
      dialog.show()
    }
  }, [isPresent])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      style={isPresent ? undefined : { pointerEvents: 'none' }}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss?.()
      }}
    >
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />
      <motion.div
        className={cx(styles.card, styles[variant], className)}
        initial={{ opacity: 0, scale: 0.86, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.92, y: -12, filter: 'blur(6px)' }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {icon ? <MorphIcon className={styles.icon} size={62} tone={variant === 'blue' ? 'light' : 'blue'} /> : null}
        {children}
      </motion.div>
    </dialog>
  )
}
