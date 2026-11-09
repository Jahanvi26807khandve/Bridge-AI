import { Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Home from './pages/Home.jsx'

function App() {
  return (
    <div className="page-shell min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <footer className="site-footer">
        BridgeAI is a prototype. It does not provide verified guidance.
      </footer>
    </div>
  )
}

export default App
