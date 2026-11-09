import { useState } from 'react'
import { Link } from 'react-router-dom'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function GoogleButton({ onClick }) {
  return (
    <button className="google-button" type="button" onClick={onClick}>
      <svg aria-hidden="true" viewBox="0 0 48 48" className="google-icon">
        <path
          fill="#4285F4"
          d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
        />
        <path
          fill="#34A853"
          d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20 20 0 0 0 24 44Z"
        />
        <path
          fill="#FBBC05"
          d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"
        />
        <path
          fill="#EA4335"
          d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.2l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
        />
      </svg>
      Continue with Google
    </button>
  )
}

function PasswordField({ id, value, onChange, describedBy, invalid = false }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="password-input-wrap">
      <input
        className="auth-input"
        id={id}
        name="password"
        type={isVisible ? 'text' : 'password'}
        autoComplete={id === 'signin-password' ? 'current-password' : 'new-password'}
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((visible) => !visible)}
      >
        {isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

function Divider() {
  return (
    <div className="auth-divider" aria-label="or">
      <span />
      <span>or</span>
      <span />
    </div>
  )
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasError, setHasError] = useState(false)
  const [invalidField, setInvalidField] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!emailPattern.test(email.trim())) {
      setFeedback('Enter a valid email address.')
      setHasError(true)
      setInvalidField('email')
      return
    }

    if (password.length < 8) {
      setFeedback('Password must be at least 8 characters.')
      setHasError(true)
      setInvalidField('password')
      return
    }

    // Real authentication will be added later.
    setFeedback('Sign-in is not connected yet. This is a design preview.')
    setHasError(false)
    setInvalidField('')
  }

  function handleGoogleClick() {
    setFeedback('Google sign-in is not connected yet. This is a design preview.')
    setHasError(false)
    setInvalidField('')
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="signin-email">Email</label>
        <input
          className="auth-input"
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFeedback('')
            setHasError(false)
            setInvalidField('')
          }}
          aria-invalid={invalidField === 'email'}
          aria-describedby="signin-feedback"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signin-password">Password</label>
        <PasswordField
          id="signin-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setFeedback('')
            setHasError(false)
            setInvalidField('')
          }}
          describedBy="signin-feedback"
          invalid={invalidField === 'password'}
        />
        <Link className="forgot-link" to="/forgot-password">
          Forgot password?
        </Link>
      </div>

      <button className="auth-submit" type="submit">
        Submit
      </button>
      <p
        className={`auth-feedback${hasError ? ' auth-feedback-error' : ''}`}
        id="signin-feedback"
        role="status"
        aria-live="polite"
      >
        {feedback}
      </p>
      <Divider />
      <GoogleButton onClick={handleGoogleClick} />
    </form>
  )
}

const passwordCharacters = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  number: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{}?',
}

function secureIndex(max) {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure password generation is not available in this browser.')
  }

  const limit = 256 - (256 % max)
  const value = new Uint8Array(1)
  do {
    cryptoApi.getRandomValues(value)
  } while (value[0] >= limit)

  return value[0] % max
}

function createStrongPassword() {
  const groups = Object.values(passwordCharacters)
  const allCharacters = groups.join('')
  const characters = groups.map((group) => group[secureIndex(group.length)])

  while (characters.length < 16) {
    characters.push(allCharacters[secureIndex(allCharacters.length)])
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1)
    ;[characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ]
  }

  return characters.join('')
}

function getPasswordStrength(password) {
  if (!password) return { label: 'Not set', level: 0 }

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 2) return { label: 'Weak', level: 1 }
  if (score <= 4) return { label: 'Good', level: 2 }
  return { label: 'Strong', level: 3 }
}

function CreateAccountForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hasError, setHasError] = useState(false)
  const [invalidField, setInvalidField] = useState('')
  const strength = getPasswordStrength(password)

  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      setFeedback('Enter your name.')
      setHasError(true)
      setInvalidField('name')
      return
    }

    if (!emailPattern.test(email.trim())) {
      setFeedback('Enter a valid email address.')
      setHasError(true)
      setInvalidField('email')
      return
    }

    if (password.length < 8) {
      setFeedback('Password must be at least 8 characters.')
      setHasError(true)
      setInvalidField('password')
      return
    }

    setFeedback('Sign-in is not connected yet. This is a design preview.')
    setHasError(false)
    setInvalidField('')
  }

  function suggestPassword() {
    try {
      setPassword(createStrongPassword())
      setFeedback('')
      setHasError(false)
      setInvalidField('')
    } catch (error) {
      setFeedback(error.message)
      setHasError(true)
    }
  }

  function handleGoogleClick() {
    setFeedback('Google sign-in is not connected yet. This is a design preview.')
    setHasError(false)
    setInvalidField('')
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="create-name">Name</label>
        <input
          className="auth-input"
          id="create-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setFeedback('')
            setHasError(false)
            setInvalidField('')
          }}
          aria-invalid={invalidField === 'name'}
          aria-describedby="create-feedback"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="create-email">Email</label>
        <input
          className="auth-input"
          id="create-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFeedback('')
            setHasError(false)
            setInvalidField('')
          }}
          aria-invalid={invalidField === 'email'}
          aria-describedby="create-feedback"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="create-password">Password</label>
        <PasswordField
          id="create-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setFeedback('')
            setHasError(false)
            setInvalidField('')
          }}
          describedBy="create-feedback password-strength"
          invalid={invalidField === 'password'}
        />
        <div
          className={`password-strength strength-${strength.level}`}
          id="password-strength"
          aria-live="polite"
        >
          <span className="strength-meter" aria-hidden="true">
            <span />
          </span>
          Password strength: {strength.label}
        </div>
        <button
          className="suggest-password"
          type="button"
          onClick={suggestPassword}
        >
          Suggest a strong password
        </button>
      </div>

      <button className="auth-submit" type="submit">
        Create account
      </button>
      <p
        className={`auth-feedback${hasError ? ' auth-feedback-error' : ''}`}
        id="create-feedback"
        role="status"
        aria-live="polite"
      >
        {feedback}
      </p>
      <Divider />
      <GoogleButton onClick={handleGoogleClick} />
    </form>
  )
}

function SignIn() {
  const [activeTab, setActiveTab] = useState('signin')

  function handleTabKeyDown(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const nextTab = activeTab === 'signin' ? 'create' : 'signin'
      setActiveTab(nextTab)
      document.getElementById(`${nextTab}-tab`)?.focus()
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-heading">
        <h1 className="sr-only" id="auth-heading">
          {activeTab === 'signin' ? 'Sign in to BridgeAI' : 'Create a BridgeAI account'}
        </h1>
        <div className="auth-tabs" role="tablist" aria-label="Account options">
          <button
            className={`auth-tab${activeTab === 'signin' ? ' is-selected' : ''}`}
            id="signin-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === 'signin'}
            aria-controls="auth-panel"
            tabIndex={activeTab === 'signin' ? 0 : -1}
            onClick={() => setActiveTab('signin')}
            onKeyDown={handleTabKeyDown}
          >
            Sign in
          </button>
          <button
            className={`auth-tab${activeTab === 'create' ? ' is-selected' : ''}`}
            id="create-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === 'create'}
            aria-controls="auth-panel"
            tabIndex={activeTab === 'create' ? 0 : -1}
            onClick={() => setActiveTab('create')}
            onKeyDown={handleTabKeyDown}
          >
            Create account
          </button>
        </div>
        <div
          className="auth-panel"
          id="auth-panel"
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
        >
          {activeTab === 'signin' ? <SignInForm /> : <CreateAccountForm />}
        </div>
      </section>
    </main>
  )
}

export default SignIn
