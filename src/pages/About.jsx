function About() {
  return (
    <main className="main-content info-page mx-auto w-full">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">About BridgeAI</p>
        <h1 id="page-title">Public notices, made clearer.</h1>
        <p className="intro-copy">
          BridgeAI helps people make sense of public-service notices by turning
          dense language into a straightforward explanation of what matters.
        </p>
      </section>

      <section className="input-panel" aria-labelledby="how-it-works">
        <h2 id="how-it-works">How it works</h2>
        <ol className="steps-list">
          <li>
            <h3>Paste a notice</h3>
            <p>Share the plain text of a public notice without personal details.</p>
          </li>
          <li>
            <h3>Get a simpler explanation</h3>
            <p>BridgeAI organizes the notice into a summary, affected people, and deadlines.</p>
          </li>
          <li>
            <h3>Review the next steps</h3>
            <p>Use the suggested action steps as a starting point, then verify important details with the issuing organization.</p>
          </li>
        </ol>
      </section>

      <aside className="privacy-note" aria-labelledby="limitations-heading">
        <h2 id="limitations-heading">Limitations</h2>
        <p>
          BridgeAI is a prototype and may make mistakes or omit important details.
          It is not legal advice or a substitute for guidance from a qualified
          professional. Always check the original notice and contact its issuing
          organization if something is unclear. Do not paste sensitive or
          personally identifying information.
        </p>
      </aside>
    </main>
  )
}

export default About
