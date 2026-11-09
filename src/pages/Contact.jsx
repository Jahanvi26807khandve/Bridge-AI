function Contact() {
  return (
    <main className="main-content info-page mx-auto w-full">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Contact</p>
        <h1 id="page-title">Get in touch.</h1>
        <p className="intro-copy">
          Find the project on GitHub or reach us by email.
        </p>
      </section>

      <section className="input-panel contact-panel" aria-label="Contact details">
        <p>
          <strong>GitHub</strong>
          <a
            href="https://github.com/Jahanvi26807khandve/Bridge-AI"
            target="_blank"
            rel="noreferrer"
          >
            Jahanvi26807khandve/Bridge-AI
          </a>
        </p>
        <p>
          <strong>Email</strong>
          <a href="mailto:your-email@example.com">your-email@example.com</a>
        </p>
      </section>
    </main>
  )
}

export default Contact
