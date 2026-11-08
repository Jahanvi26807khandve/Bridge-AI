import { useState } from 'react'

const MAX_NOTICE_LENGTH = 5000

function App() {
  const [notice, setNotice] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

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
    setResult(null)
    setFeedback('')
    setHasError(false)

    try {
      const response = await fetch('/api/simplify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: notice }),
      })

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

      setResult(data)
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
    setResult(null)
  }

  return (
    <div className="page-shell min-h-screen">
      <header className="topbar flex items-center justify-between">
        <a className="wordmark" href="/" aria-label="BridgeAI home">
          BridgeAI
        </a>
        <span className="prototype-label">Prototype</span>
      </header>

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
            <label htmlFor="notice-text">Notice text</label>
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
            <div className="input-meta">
              <p id="notice-help" className="help-text">
                Maximum {MAX_NOTICE_LENGTH.toLocaleString()} characters.
              </p>
              <p id="notice-count" className="character-count" aria-live="polite">
                {notice.length.toLocaleString()} / {MAX_NOTICE_LENGTH.toLocaleString()}
              </p>
            </div>

            <button className="submit-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Simplifying...' : 'Simplify notice'}
            </button>
            <p
              className={`feedback${hasError ? ' feedback-error' : ''}`}
              role="status"
              aria-live="polite"
            >
              {isLoading ? 'Simplifying your notice...' : feedback}
            </p>
          </form>
        </section>

        {result && (
          <section className="input-panel mt-6" aria-labelledby="results-heading">
            <h2 id="results-heading">Your simplified notice</h2>
            <div className="mt-5 space-y-5">
              <section>
                <h3 className="mb-2 font-semibold">Summary</h3>
                <p className="mb-0 leading-relaxed">{result.summary}</p>
              </section>
              <section className="border-t border-[var(--color-border)] pt-5">
                <h3 className="mb-2 font-semibold">Who it affects</h3>
                <p className="mb-0 leading-relaxed">{result.whoItAffects}</p>
              </section>
              <section className="border-t border-[var(--color-border)] pt-5">
                <h3 className="mb-2 font-semibold">Deadlines</h3>
                <p className="mb-0 leading-relaxed">{result.deadlines}</p>
              </section>
              <section className="border-t border-[var(--color-border)] pt-5">
                <h3 className="mb-2 font-semibold">What you should do</h3>
                <ul className="mb-0 list-disc space-y-2 pl-5">
                  {result.actionSteps.map((step, index) => (
                    <li key={`${index}-${step}`}>{step}</li>
                  ))}
                </ul>
              </section>
            </div>
            <aside className="privacy-note" aria-label="Legal advice disclaimer">
              <p>This is a simplified explanation, not legal advice.</p>
            </aside>
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

      <footer className="site-footer">
        BridgeAI is a prototype. It does not provide verified guidance.
      </footer>
    </div>
  )
}

export default App
