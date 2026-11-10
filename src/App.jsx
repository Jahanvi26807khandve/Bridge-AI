import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import About from './pages/About.jsx'
import Account from './pages/Account.jsx'
import Contact from './pages/Contact.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Home from './pages/Home.jsx'
import Result from './pages/Result.jsx'
import SignIn from './pages/SignIn.jsx'

function App() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/signin' || pathname === '/forgot-password'

  return (
    <div className={`page-shell min-h-screen${isAuthPage ? ' auth-shell' : ''}`}>
      {!isAuthPage && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<Result />} />
        <Route path="/account" element={<Account />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      {!isAuthPage && (
        <footer className="site-footer">
          BridgeAI is a prototype. It does not provide verified guidance.
        </footer>
      )}
    </div>
  )
}

export default App
