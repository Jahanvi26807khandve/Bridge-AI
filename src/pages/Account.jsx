import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context.js'
import {
  readHistory,
  readSettings,
  writeHistory,
  writeSettings,
} from '../utils/account-storage.js'

const tabs = ['Profile', 'History', 'Settings']

function getProviderName(user) {
  const providerId = user.providerData?.[0]?.providerId
  if (!providerId || providerId === 'google.com') return 'Google'
  if (providerId === 'password') return 'email and password'
  return providerId.split('.')[0]
}

function Account() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <main className="main-content account-content" role="status" aria-live="polite">
        Loading your account…
      </main>
    )
  }

  if (!user) return <Navigate to="/signin" replace />

  return <AccountContent key={user.uid} user={user} signOut={signOut} />
}

function AccountContent({ user, signOut }) {
  const navigate = useNavigate()
  const [initialData] = useState(() => {
    const savedSettings = readSettings(user.uid)
    const savedHistory = readHistory(user.uid)
    return {
      settings: savedSettings.settings,
      history: savedHistory.history,
      feedback:
        savedSettings.error || savedHistory.error
          ? 'Some saved account data could not be read from this browser.'
          : '',
    }
  })
  const [activeTab, setActiveTab] = useState('Profile')
  const [settings, setSettings] = useState(initialData.settings)
  const [history, setHistory] = useState(initialData.history)
  const [feedback, setFeedback] = useState(initialData.feedback)
  const tabRefs = useRef([])

  function handleTabKeyDown(event, index) {
    let nextIndex
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    else return

    event.preventDefault()
    setActiveTab(tabs[nextIndex])
    tabRefs.current[nextIndex]?.focus()
  }

  function updateSettings(nextSettings) {
    setSettings(nextSettings)
    setFeedback(
      writeSettings(user.uid, nextSettings)
        ? 'Saved'
        : 'Settings could not be saved in this browser.',
    )
  }

  function deleteHistoryEntry(id) {
    const nextHistory = history.filter((entry) => entry.id !== id)
    if (!writeHistory(user.uid, nextHistory)) {
      setFeedback('This history entry could not be deleted from this browser.')
      return
    }
    setHistory(nextHistory)
    setFeedback('History entry deleted.')
  }

  function clearHistory() {
    if (!history.length || !window.confirm('Clear all saved history on this device?')) {
      return
    }
    if (!writeHistory(user.uid, [])) {
      setFeedback('History could not be cleared from this browser.')
      return
    }
    setHistory([])
    setFeedback('History cleared.')
  }

  async function handleSignOut() {
    setFeedback('')
    try {
      await signOut()
      navigate('/signin', { replace: true })
    } catch {
      setFeedback('We couldn’t sign you out. Please try again.')
    }
  }

  function openHistoryEntry(entry) {
    navigate('/result', { state: { result: entry } })
  }

  const displayName = user.displayName || user.email || 'Your account'
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <main className="main-content account-content mx-auto w-full">
      <section className="account-profile" aria-labelledby="account-title">
        {user.photoURL ? (
          <img className="account-profile-photo" src={user.photoURL} alt="" />
        ) : (
          <span className="account-initials" aria-hidden="true">
            {initials || '?'}
          </span>
        )}
        <div className="account-profile-copy">
          <p className="eyebrow">Your account</p>
          <h1 id="account-title">{displayName}</h1>
          <p>{user.email || 'No email address available'}</p>
        </div>
        <button className="account-sign-out" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </section>

      <div className="account-tabs" role="tablist" aria-label="Account sections">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            id={`account-tab-${tab.toLowerCase()}`}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            className={`account-tab${activeTab === tab ? ' is-selected' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls="account-tabpanel"
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <section
        className="account-panel"
        id="account-tabpanel"
        role="tabpanel"
        aria-labelledby={`account-tab-${activeTab.toLowerCase()}`}
        tabIndex={0}
      >
        {activeTab === 'Profile' && (
          <dl className="account-details">
            <div>
              <dt>Name</dt>
              <dd>{user.displayName || 'Not provided'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email || 'Not provided'}</dd>
            </div>
            <div>
              <dt>Sign-in method</dt>
              <dd>Signed in with {getProviderName(user)}</dd>
            </div>
          </dl>
        )}

        {activeTab === 'History' && (
          <div className="account-history">
            <div className="account-history-heading">
              <h2>Saved results</h2>
              {history.length > 0 && (
                <button
                  className="account-text-button"
                  type="button"
                  onClick={clearHistory}
                >
                  Clear all history
                </button>
              )}
            </div>
            {history.length ? (
              <ul className="history-list">
                {history.map((entry) => (
                  <li className="history-entry" key={entry.id}>
                    <div className="history-entry-copy">
                      <p className="history-date">
                        {entry.date} <span aria-hidden="true">·</span> {entry.time}
                      </p>
                      <h3>{entry.title}</h3>
                    </div>
                    <div className="history-entry-actions">
                      <button
                        className="account-action-button"
                        type="button"
                        onClick={() => openHistoryEntry(entry)}
                      >
                        Open
                      </button>
                      <button
                        className="account-action-button account-action-secondary"
                        type="button"
                        onClick={() => deleteHistoryEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="history-empty">
                No history yet. Simplify a notice and it will appear here.
              </p>
            )}
            <p className="history-privacy-note">
              History is saved only on this device and browser. Don&apos;t simplify
              notices that contain personal information.
            </p>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="account-settings">
            <div className="account-setting-field">
              <label htmlFor="account-language">Language</label>
              <select
                id="account-language"
                value={settings.language}
                onChange={(event) =>
                  updateSettings({ ...settings, language: event.target.value })
                }
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
              </select>
            </div>
            <div className="account-setting-field">
              <label htmlFor="account-reading-level">Reading level</label>
              <select
                id="account-reading-level"
                value={settings.readingLevel}
                onChange={(event) =>
                  updateSettings({ ...settings, readingLevel: event.target.value })
                }
              >
                <option>Simple</option>
                <option>Detailed</option>
              </select>
            </div>
            <label className="history-toggle">
              <input
                type="checkbox"
                checked={settings.saveHistory}
                onChange={(event) =>
                  updateSettings({ ...settings, saveHistory: event.target.checked })
                }
              />
              <span>Save my history on this device</span>
            </label>
            <p className="account-setting-note">
              Language and reading level will be applied to results soon.
            </p>
          </div>
        )}
      </section>
      <p className="account-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
    </main>
  )
}

export default Account
