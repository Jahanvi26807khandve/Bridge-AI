import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const warning =
  'Firebase configuration is missing or invalid. Google sign-in is unavailable.'

function isValidAuthDomain(authDomain) {
  if (
    typeof authDomain !== 'string' ||
    authDomain.trim() !== authDomain ||
    !/^[a-z\d.-]+(?::\d+)?$/i.test(authDomain) ||
    authDomain.includes('..')
  ) {
    return false
  }

  try {
    const url = new URL(`https://${authDomain}`)
    const labels = url.hostname.split('.')

    return (
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      (url.hostname === 'localhost' ||
        (labels.length > 1 &&
          labels.every((label) => /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label))))
    )
  } catch {
    return false
  }
}

function isValidConfig(config) {
  const { apiKey, authDomain, projectId, appId } = config
  const validProjectId =
    typeof projectId === 'string' && /^[a-z][a-z\d-]{4,28}[a-z\d]$/.test(projectId)

  return (
    typeof apiKey === 'string' &&
    /^AIza[0-9A-Za-z_-]{35}$/.test(apiKey) &&
    isValidAuthDomain(authDomain) &&
    validProjectId &&
    typeof appId === 'string' &&
    /^1:\d+:(web|ios|android):[a-zA-Z0-9_-]+$/.test(appId)
  )
}

function createAuth() {
  if (!isValidConfig(firebaseConfig)) {
    console.warn(warning)
    return null
  }

  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    return getAuth(app)
  } catch {
    console.warn(warning)
    return null
  }
}

export const auth = createAuth()
export const isFirebaseConfigured = auth !== null
