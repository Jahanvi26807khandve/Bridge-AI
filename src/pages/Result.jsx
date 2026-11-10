import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'bridgeai-last-result'

function isValidResult(value) {
  return (
    value &&
    typeof value.summary === 'string' &&
    typeof value.whoItAffects === 'string' &&
    typeof value.deadlines === 'string' &&
    Array.isArray(value.actionSteps) &&
    value.actionSteps.every((step) => typeof step === 'string')
  )
}

const speechLanguages = {
  english: { locale: 'en-IN', name: 'English' },
  hindi: { locale: 'hi-IN', name: 'Hindi' },
  marathi: { locale: 'mr-IN', name: 'Marathi' },
}

function getSavedResult() {
  try {
    const savedResult = window.sessionStorage.getItem(STORAGE_KEY)
    if (!savedResult) return null

    const result = JSON.parse(savedResult)
    return isValidResult(result) ? result : null
  } catch {
    return null
  }
}

const cards = [
  {
    title: 'Summary',
    key: 'summary',
    icon: (
      <>
        <path d="M5 4.75h14a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.75a2 2 0 0 1 2-2Z" />
        <path d="M7 9h10M7 12.5h10M7 16h6" />
      </>
    ),
  },
  {
    title: 'Who it affects',
    key: 'whoItAffects',
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19ZM16 5.3a3 3 0 0 1 0 5.8m1 2h.5a4 4 0 0 1 4 4V19h-2" />
      </>
    ),
  },
  {
    title: 'Deadlines',
    key: 'deadlines',
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h3v3H8z" />
      </>
    ),
  },
  {
    title: 'What you should do',
    key: 'actionSteps',
    icon: (
      <>
        <path d="m5 12 4 4L19 6" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1" />
      </>
    ),
  },
]

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const stateResult = location.state?.result
  const result = isValidResult(stateResult) ? stateResult : getSavedResult()
  const speechUtterance = useRef(null)
  const copyTimeout = useRef(null)
  const [feedback, setFeedback] = useState(
    location.state?.storageWarning
      ? 'This result could not be saved for refresh. Keep this page open or copy the summary.'
      : location.state?.historyWarning
        ? 'This result could not be saved to your history on this device.'
        : '',
  )
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(
    () => () => {
      window.clearTimeout(copyTimeout.current)
      speechUtterance.current = null
      window.speechSynthesis?.cancel()
    },
    [],
  )

  if (!result) {
    return <Navigate to="/" replace />
  }

  const plainText = [
    `Summary\n${result.summary}`,
    `Who it affects\n${result.whoItAffects}`,
    `Deadlines\n${result.deadlines}`,
    `What you should do\n${result.actionSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`,
  ].join('\n\n')

  async function handleCopy() {
    try {
      await window.navigator.clipboard.writeText(plainText)
      setFeedback('Copied!')
      window.clearTimeout(copyTimeout.current)
      copyTimeout.current = window.setTimeout(() => setFeedback(''), 2000)
    } catch {
      setFeedback("Couldn't copy the summary. Please try again.")
    }
  }

  function handleReadAloud() {
    if (isSpeaking) {
      speechUtterance.current = null
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      setFeedback('Read aloud is not supported in this browser.')
      return
    }

    const language = speechLanguages[result.language] ?? speechLanguages.english
    const voice = window.speechSynthesis
      .getVoices()
      .find((availableVoice) => availableVoice.lang.toLowerCase() === language.locale.toLowerCase())
    if (!voice) {
      setFeedback(`No ${language.name} voice is available on this device.`)
      return
    }

    const utterance = new window.SpeechSynthesisUtterance(plainText)
    utterance.lang = language.locale
    utterance.voice = voice
    speechUtterance.current = utterance
    utterance.onend = () => {
      if (speechUtterance.current !== utterance) return
      speechUtterance.current = null
      setIsSpeaking(false)
    }
    utterance.onerror = () => {
      if (speechUtterance.current !== utterance) return
      speechUtterance.current = null
      setIsSpeaking(false)
      setFeedback('Read aloud could not start. Please try again.')
    }
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
    setFeedback('')
  }

  function handleSimplifyAnother() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      setFeedback('Could not clear the saved result in this browser.')
    }
    speechUtterance.current = null
    window.speechSynthesis?.cancel()
    navigate('/', { replace: true })
  }

  return (
    <main className="main-content result-content mx-auto w-full">
      <section className="intro" aria-labelledby="result-title">
        <p className="eyebrow">Your plain-language explanation</p>
        <h1 id="result-title">Your simplified notice</h1>
      </section>

      <div className="result-grid">
        {cards.map(({ title, key, icon }, index) => (
          <section
            className="result-card"
            style={{ '--card-index': index }}
            aria-labelledby={`result-${key}-title`}
            key={key}
          >
            <div className="result-card-heading">
              <span className="result-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {icon}
                </svg>
              </span>
              <h2 id={`result-${key}-title`}>{title}</h2>
            </div>
            {key === 'actionSteps' ? (
              result.actionSteps.length ? (
                <ol className="result-steps">
                  {result.actionSteps.map((step, index) => (
                    <li key={`${index}-${step}`}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="result-card-copy">No action steps were provided.</p>
              )
            ) : (
              <p className="result-card-copy">{result[key]}</p>
            )}
          </section>
        ))}
      </div>

      <p className="result-disclaimer">
        This is a simplified explanation, not legal advice.
      </p>

      <div className="result-actions" aria-label="Result actions">
        <button className="result-button" type="button" onClick={handleCopy}>
          Copy summary
        </button>
        <button className="result-button result-button-secondary" type="button" onClick={() => window.print()}>
          Print
        </button>
        <button
          className="result-button result-button-secondary"
          type="button"
          onClick={handleReadAloud}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? 'Stop' : 'Read aloud'}
        </button>
        <button
          className="result-button result-button-secondary"
          type="button"
          onClick={handleSimplifyAnother}
        >
          Simplify another notice
        </button>
      </div>
      <p className="result-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
    </main>
  )
}

export default Result
