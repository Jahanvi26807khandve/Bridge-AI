import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) {
      return
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
  }, [])

  function signInWithGoogle() {
    if (!auth) {
      throw new Error('Google sign-in is not configured.')
    }

    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  function signOut() {
    if (!auth) {
      return Promise.resolve()
    }

    return firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signOut, isFirebaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  )
}
