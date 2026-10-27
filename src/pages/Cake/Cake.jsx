import { cx } from '../../lib/cx.js'
import styles from './Cake.module.css'

/*
 * The original CSS cake (three stacked layers, icing, drips, plate, candles
 * placed where you tap), recoloured in blue. It is drawn at its original
 * 250 × 200 size and scaled for the screen. Candle positions are normalised
 * to the icing ellipse: u (left→right) and v (back→front) in [-1, 1].
 */

const ICING = { cx: 125, cy: 45, rx: 100, ry: 34 }

export function Cake({ candles, interactive, onPlace, onBlow, reduced }) {
  function handleClick(event) {
    if (!interactive) return
    if (event.detail === 0) {
      onPlace(null) // keyboard: next tidy slot
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const scale = rect.width / 250
    if (!scale) {
      onPlace(null)
      return
    }
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale
    onPlace({ u: (x - ICING.cx) / ICING.rx, v: (y - ICING.cy) / ICING.ry })
  }

  const ordered = [...candles].sort((a, b) => a.v - b.v)

  return (
    <div className={styles.cake}>
      <div className={styles.plate} />
      <div className={cx(styles.layer, styles.layerBottom)} />
      <div className={cx(styles.layer, styles.layerMiddle)} />
      <div className={cx(styles.layer, styles.layerTop)} />
      <div className={styles.icing} />
      <div className={cx(styles.drip, styles.drip1)} />
      <div className={cx(styles.drip, styles.drip2)} />
      <div className={cx(styles.drip, styles.drip3)} />
      <span className={styles.sprinkles} aria-hidden="true" />

      <button
        type="button"
        className={styles.placer}
        aria-label="Taruh lilin di kue"
        aria-disabled={!interactive || undefined}
        onClick={handleClick}
      />

      <ul className={styles.candles} aria-label="Lilin">
        {ordered.map((candle, index) => {
          const x = ICING.cx + candle.u * ICING.rx * 0.9
          const y = ICING.cy + candle.v * ICING.ry * 0.85
          const number = candles.indexOf(candle) + 1
          return (
            <li
              key={candle.id}
              className={cx(styles.candle, !candle.lit && styles.out)}
              style={{ left: x - 6, top: y - 35, zIndex: 20 + index }}
            >
              {candle.lit ? (
                <button type="button" className={styles.flameButton} aria-label={`Tiup lilin ${number}`} onClick={() => onBlow(candle.id)}>
                  <span className={styles.flame} />
                </button>
              ) : candle.outCount > 0 && !reduced ? (
                <span key={candle.outCount} className={styles.smoke} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
