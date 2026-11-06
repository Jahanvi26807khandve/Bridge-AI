import { useState } from 'react'

const MAX_NOTICE_LENGTH = 5000

function App() {
  const [notice, setNotice] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasError, setHasError] = useState(false)

  function handleSubmit(event) {
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

    setFeedback('The text is within the limit. It has not been sent or analyzed.')
    setHasError(false)
  }

  function handleNoticeChange(event) {
    setNotice(event.target.value)
    setFeedback('')
    setHasError(false)
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
            Start with the text of a notice you have received. This first version
            only checks that your text is ready for a future explanation.
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

            <button className="submit-button" type="submit">
              Check input
            </button>
            <p
              className={`feedback${hasError ? ' feedback-error' : ''}`}
              role="status"
              aria-live="polite"
            >
              {feedback}
            </p>
          </form>
        </section>

        <aside className="privacy-note" aria-label="Privacy and prototype limits">
          <h2>What happens to your text?</h2>
          <p>
            This screen checks the text in your browser only. It does not send
            your notice to a server or AI service, and it does not save it.
            Explanations are not available yet.
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
