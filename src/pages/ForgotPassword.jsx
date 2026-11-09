import { useState } from 'react'
import { Link } from 'react-router-dom'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasError, setHasError] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    if (!emailPattern.test(email.trim())) {
      setFeedback('Enter a valid email address.')
      setHasError(true)
      return
    }

    setFeedback('Password reset is not connected yet. This is a design preview.')
    setHasError(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card forgot-card" aria-labelledby="forgot-heading">
        <p className="auth-eyebrow">BridgeAI</p>
        <h1 id="forgot-heading">Reset your password</h1>
        <p className="auth-intro">
          Enter your email address and we’ll send you a reset link.
        </p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="reset-email">Email</label>
            <input
              className="auth-input"
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setFeedback('')
                setHasError(false)
              }}
              aria-invalid={hasError}
              aria-describedby="reset-feedback"
            />
          </div>
          <button className="auth-submit" type="submit">
            Send reset link
          </button>
          <p
            className={`auth-feedback${hasError ? ' auth-feedback-error' : ''}`}
            id="reset-feedback"
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
        </form>
        <Link className="forgot-link back-to-signin" to="/signin">
          Back to sign in
        </Link>
      </section>
    </main>
  )
}

export default ForgotPassword
