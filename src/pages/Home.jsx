import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context.js'
import {
  createHistoryEntry,
  readHistory,
  readSettings,
  writeHistory,
} from '../utils/account-storage.js'

const MAX_NOTICE_LENGTH = 5000
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const examples = [
  {
    label: 'Water shutdown',
    text: 'The City Water Department will shut off water on Cedar Lane from 9 a.m. to 1 p.m. on Tuesday, June 9, for pipe maintenance. Please store water ahead of time.',
  },
  {
    label: 'Road repair (no dates)',
    text: 'The Public Works Department will repair the road near Pine Street. Expect lane closures and follow posted signs. Work dates have not yet been announced.',
  },
  {
    label: 'Property tax deadline',
    text: 'Property tax payments are due by September 30. Pay online or at the city office. A late fee may apply to payments received after the deadline.',
  },
]

function Home() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [notice, setNotice] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clipboardFeedback, setClipboardFeedback] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!notice.trim()) {
      setFeedback('Paste the text of a notice before checking it.')
      setHasError(true)
      return
    }

    if (notice.length > MAX_NOTICE_LENGTH) {
      setFeedback(`Use ${MAX_NOTICE_LENGTH.toLocaleString()} characters or fewer.`)
      setHasError(true)
      return
    }

    setIsLoading(true)
    setFeedback('')
    setHasError(false)

    const savedSettings = user?.uid && !authLoading ? readSettings(user.uid) : null
    const language = savedSettings?.settings.language.toLowerCase() ?? 'english'
    const level = savedSettings?.settings.readingLevel.toLowerCase() ?? 'simple'

    try {
      const sendRequest = (token) => fetch(`${API_BASE_URL}/api/simplify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: notice, language, level }),
      })

      let accessToken = user ? await user.getIdToken() : null
      let response = await sendRequest(accessToken)

      if (response.status === 401 && user) {
        try {
          accessToken = await user.getIdToken(true)
        } catch {
          setFeedback('Please sign in again.')
          setHasError(true)
          return
        }
        response = await sendRequest(accessToken)
      }

      if (response.status === 429) {
        const errorData = await response.json().catch(() => null)
        setFeedback(
          typeof errorData?.error === 'string'
            ? errorData.error
            : 'Too many requests. Please try again in a few minutes.',
        )
        setHasError(true)
        return
      }

      if (response.status === 401) {
        setFeedback('Please sign in again.')
        setHasError(true)
        return
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()

      if (
        typeof data.summary !== 'string' ||
        typeof data.whoItAffects !== 'string' ||
        typeof data.deadlines !== 'string' ||
        !Array.isArray(data.actionSteps) ||
        !data.actionSteps.every((step) => typeof step === 'string')
      ) {
        throw new Error('The response did not contain a valid explanation')
      }

      const result = { ...data, language }
      let storageWarning = false
      let historyWarning = false
      try {
        window.sessionStorage.setItem('bridgeai-last-result', JSON.stringify(result))
      } catch {
        storageWarning = true
      }

      if (savedSettings) {
        if (savedSettings.error) {
          historyWarning = true
        } else if (savedSettings.settings.saveHistory) {
          const { history, error } = readHistory(user.uid)
          historyWarning = error || !writeHistory(
            user.uid,
            [createHistoryEntry(result), ...history].slice(0, 20),
          )
        }
      }

      navigate('/result', {
        state: { result, storageWarning, historyWarning },
      })
    } catch {
      setFeedback("We couldn't simplify this notice right now. Please try again.")
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  function handleNoticeChange(event) {
    setNotice(event.target.value)
    setFeedback('')
    setHasError(false)
  }

  async function handlePasteFromClipboard() {
    setClipboardFeedback('')
    if (!navigator.clipboard?.readText) {
      setClipboardFeedback('Clipboard access is unavailable. Paste your notice manually.')
      return
    }

    try {
      const clipboardText = await navigator.clipboard.readText()
      if (!clipboardText) {
        setClipboardFeedback('Your clipboard is empty.')
        return
      }
      setNotice(clipboardText)
      setFeedback('')
      setHasError(false)
      setClipboardFeedback('Notice pasted from clipboard.')
    } catch {
      setClipboardFeedback(
        'Clipboard permission was denied. Allow access or paste your notice manually.',
      )
    }
  }

  function applyExample(text) {
    setNotice(text)
    setFeedback('')
    setHasError(false)
    setClipboardFeedback('')
  }

  return (
    <main className="main-content mx-auto w-full">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Public notice explainer</p>
        <h1 id="page-title">Make a public notice easier to understand.</h1>
        <p className="intro-copy">
          Paste the text of a notice you have received to get a plain-language
          explanation.
        </p>
      </section>

      <section className="input-panel" aria-labelledby="input-heading">
        <h2 id="input-heading">Add the notice text</h2>
        <p className="panel-copy">
          Paste plain text from a public-service notice. Do not include personal
          or sensitive information.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="notice-label-row">
            <label htmlFor="notice-text">Notice text</label>
            <button
              className="utility-button clipboard-button"
              type="button"
              onClick={handlePasteFromClipboard}
              disabled={isLoading}
            >
              Paste from clipboard
            </button>
          </div>
          <textarea
            id="notice-text"
            name="notice"
            value={notice}
            onChange={handleNoticeChange}
            aria-describedby="notice-help notice-count"
            aria-invalid={hasError}
            disabled={isLoading}
            placeholder="Paste the notice here..."
            rows={9}
          />
          <p className="sr-only" role="status" aria-live="polite">
            {clipboardFeedback}
          </p>
          <div className="input-meta">
            <p id="notice-help" className="help-text">
              Maximum {MAX_NOTICE_LENGTH.toLocaleString()} characters.
            </p>
            <p id="notice-count" className="character-count" aria-live="polite">
              {notice.length.toLocaleString()} / {MAX_NOTICE_LENGTH.toLocaleString()}
            </p>
          </div>

          <div className="example-group" aria-labelledby="example-heading">
            <p id="example-heading" className="example-heading">Try an example</p>
            <div className="example-buttons">
              {examples.map(({ label, text }) => (
                <button
                  className="utility-button"
                  key={label}
                  type="button"
                  disabled={isLoading}
                  onClick={() => applyExample(text)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button className="submit-button" type="submit" disabled={isLoading}>
            Simplify notice
          </button>
          <p
            className={`feedback${hasError ? ' feedback-error' : ''}`}
            role="status"
            aria-live="polite"
          >
            {isLoading ? '' : feedback}
          </p>
        </form>
      </section>

      {isLoading && (
        <section
          className="loading-preview"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Reading your notice"
        >
          <h2>Reading your notice...</h2>
          <div className="loading-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <div className="loading-card" key={item}>
                <span className="loading-placeholder loading-title" />
                <span className="loading-placeholder loading-line" />
                <span className="loading-placeholder loading-line loading-line-short" />
              </div>
            ))}
          </div>
        </section>
      )}

      <aside className="privacy-note" aria-label="Privacy and prototype limits">
        <h2>What happens to your text?</h2>
        <p>
          Your notice is sent to our simplification service to generate an
          explanation. Do not include personal or sensitive information.
        </p>
      </aside>
    </main>
  )
}

export default Home
