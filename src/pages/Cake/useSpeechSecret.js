import { useCallback, useEffect, useRef, useState } from 'react'
import { matchesSecret } from '../Galaxy/secret.js'

/*
 * Optional voice input for the secret phrase (the original page listened for
 * "sayang" with the Web Speech API). Only starts when the visitor presses
 * the microphone button; typing always works too. Note: in Chrome, speech
 * recognition is processed by the browser vendor's online service.
 */

export function isSpeechSupported() {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function useSpeechSecret({ keyword, onMatch }) {
  const [state, setState] = useState('idle') // idle | listening | error
  const [heard, setHeard] = useState('')
  const recognitionRef = useRef(null)
  const onMatchRef = useRef(onMatch)

  useEffect(() => {
    onMatchRef.current = onMatch
  }, [onMatch])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const start = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    recognitionRef.current?.abort()
    const recognition = new Recognition()
    recognition.lang = 'id-ID'
    recognition.interimResults = true
    recognition.maxAlternatives = 3
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcripts = []
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        for (let j = 0; j < event.results[i].length; j += 1) transcripts.push(event.results[i][j].transcript)
      }
      setHeard(transcripts[0] ?? '')
      if (transcripts.some((text) => matchesSecret(text, keyword))) {
        recognition.abort()
        setState('idle')
        onMatchRef.current?.()
      }
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setState('error')
    }
    recognition.onend = () => setState((current) => (current === 'listening' ? 'idle' : current))
    recognitionRef.current = recognition
    setHeard('')
    setState('listening')
    try {
      recognition.start()
    } catch {
      setState('error')
    }
  }, [keyword])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    setState('idle')
  }, [])

  return { state, heard, start, stop }
}
