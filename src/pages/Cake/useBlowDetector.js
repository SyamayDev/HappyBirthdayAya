import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * OPTIONAL microphone blow detection for the cake. The microphone is only
 * requested when the visitor presses the microphone button; audio is
 * analysed in the browser (AnalyserNode) and never recorded or sent.
 * Everything is released when stopped, when the candles are out, and on
 * unmount.
 *
 * Blowing into a microphone produces loud, broadband low-frequency noise.
 * A "gust" fires while the average energy of the lowest quarter of the
 * spectrum stays above THRESHOLD for SUSTAIN_MS. (The original page used an
 * average > 25 over all bins, which also triggered on normal speech.)
 */
export const THRESHOLD = 55
const SUSTAIN_MS = 150
const GUST_INTERVAL_MS = 130

export function isMicrophoneSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
}

function release(resources) {
  if (!resources) return
  cancelAnimationFrame(resources.frame)
  resources.stream?.getTracks().forEach((track) => track.stop())
  if (resources.context && resources.context.state !== 'closed') {
    resources.context.close().catch(() => {})
  }
}

/**
 * @param {{ onGust: (strength: number) => void }} options
 * @returns {{ state: 'off'|'requesting'|'listening'|'denied'|'unsupported'|'error', level: number, start: () => Promise<void>, stop: () => void }}
 */
export function useBlowDetector({ onGust }) {
  const [state, setState] = useState('off')
  const [level, setLevel] = useState(0)
  const resourcesRef = useRef(null)
  const mountedRef = useRef(true)
  const onGustRef = useRef(onGust)

  useEffect(() => {
    onGustRef.current = onGust
  }, [onGust])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      release(resourcesRef.current)
      resourcesRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    release(resourcesRef.current)
    resourcesRef.current = null
    setState('off')
    setLevel(0)
  }, [])

  const start = useCallback(async () => {
    if (resourcesRef.current) return
    if (!isMicrophoneSupported()) {
      setState('unsupported')
      return
    }
    setState('requesting')
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (error) {
      if (!mountedRef.current) return
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError'
      setState(denied ? 'denied' : 'error')
      return
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      stream.getTracks().forEach((track) => track.stop())
      setState('unsupported')
      return
    }

    const context = new AudioContextClass()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.25
    context.createMediaStreamSource(stream).connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const bins = Math.max(1, Math.floor(data.length / 4))
    const resources = { stream, context, frame: 0, blowingSince: 0, lastGust: 0, lastLevel: 0 }
    resourcesRef.current = resources
    setState('listening')

    const tick = (now) => {
      if (resourcesRef.current !== resources) return
      analyser.getByteFrequencyData(data)
      let sum = 0
      for (let i = 0; i < bins; i += 1) sum += data[i]
      const average = sum / bins
      const strength = Math.min(1, average / 120)

      if (average > THRESHOLD) {
        if (!resources.blowingSince) resources.blowingSince = now
        if (now - resources.blowingSince >= SUSTAIN_MS && now - resources.lastGust >= GUST_INTERVAL_MS) {
          resources.lastGust = now
          onGustRef.current?.(strength)
        }
      } else {
        resources.blowingSince = 0
      }

      if (now - resources.lastLevel > 100) {
        resources.lastLevel = now
        setLevel(strength)
      }
      resources.frame = requestAnimationFrame(tick)
    }
    resources.frame = requestAnimationFrame(tick)
  }, [])

  return { state, level, start, stop }
}
