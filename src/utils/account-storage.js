const DEFAULT_SETTINGS = {
  language: 'English',
  readingLevel: 'Simple',
  saveHistory: true,
}

function settingsKey(uid) {
  return `bridgeai-settings-${uid}`
}

function historyKey(uid) {
  return `bridgeai-history-${uid}`
}

function isResult(value) {
  return (
    value &&
    typeof value.summary === 'string' &&
    typeof value.whoItAffects === 'string' &&
    typeof value.deadlines === 'string' &&
    Array.isArray(value.actionSteps) &&
    value.actionSteps.every((step) => typeof step === 'string')
  )
}

export function readSettings(uid) {
  try {
    const saved = window.localStorage.getItem(settingsKey(uid))
    if (!saved) return { settings: { ...DEFAULT_SETTINGS }, error: false }

    const parsed = JSON.parse(saved)
    return {
      settings: {
        language: ['English', 'Hindi', 'Marathi'].includes(parsed.language)
          ? parsed.language
          : DEFAULT_SETTINGS.language,
        readingLevel: ['Simple', 'Detailed'].includes(parsed.readingLevel)
          ? parsed.readingLevel
          : DEFAULT_SETTINGS.readingLevel,
        saveHistory:
          typeof parsed.saveHistory === 'boolean'
            ? parsed.saveHistory
            : DEFAULT_SETTINGS.saveHistory,
      },
      error: false,
    }
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, error: true }
  }
}

export function writeSettings(uid, settings) {
  try {
    window.localStorage.setItem(settingsKey(uid), JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export function readHistory(uid) {
  try {
    const saved = window.localStorage.getItem(historyKey(uid))
    if (!saved) return { history: [], error: false }

    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return { history: [], error: true }

    const history = parsed.filter(
      (entry) =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.date === 'string' &&
        typeof entry.time === 'string' &&
        typeof entry.title === 'string' &&
        isResult(entry),
    )
    return { history, error: false }
  } catch {
    return { history: [], error: true }
  }
}

export function writeHistory(uid, history) {
  try {
    window.localStorage.setItem(historyKey(uid), JSON.stringify(history.slice(0, 20)))
    return true
  } catch {
    return false
  }
}

export function createHistoryEntry(result) {
  const now = new Date()
  return {
    id:
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    title: result.summary.slice(0, 60),
    language: result.language,
    summary: result.summary,
    whoItAffects: result.whoItAffects,
    deadlines: result.deadlines,
    actionSteps: result.actionSteps,
  }
}

export function saveHistoryEntry(uid, result) {
  const { history, error } = readHistory(uid)
  if (error) return false
  return writeHistory(uid, [createHistoryEntry(result), ...history].slice(0, 20))
}
