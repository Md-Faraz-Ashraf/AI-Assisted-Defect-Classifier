import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          QI
        </div>
        <div>
          <p className="eyebrow">MANUFACTURING QUALITY</p>
          <h1>Inspection workspace</h1>
        </div>
        <span className="phase-badge">Foundation setup</span>
      </header>
      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <p className="eyebrow">HUMAN-IN-THE-LOOP QUALITY</p>
          <h2 id="welcome-title">Clear decisions start with a closer look.</h2>
          <p className="supporting-copy">
            This workspace will help Quality Engineers review AI suggestions and
            record the final inspection decision.
          </p>
          <Link className="text-link" to="/about">
            View project foundation <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="inspection-illustration" aria-hidden="true">
          <div className="inspection-ring">
            <div className="inspection-part">
              <i />
              <b />
              <span />
            </div>
          </div>
          <div className="scan-label">
            QUALITY CHECK <span>● READY</span>
          </div>
        </div>
      </section>
      <section
        className="status-grid"
        aria-label="Application foundation status"
      >
        <article className="status-card">
          <span className="status-icon green">✓</span>
          <div>
            <p>Review first</p>
            <small>People make the final call</small>
          </div>
        </article>
        <article className="status-card">
          <span className="status-icon blue">↗</span>
          <div>
            <p>Trace every decision</p>
            <small>AI suggestion and outcome stay linked</small>
          </div>
        </article>
        <article className="status-card">
          <span className="status-icon amber">⌁</span>
          <div>
            <p>Built for the shop floor</p>
            <small>Products and batches share one workflow</small>
          </div>
        </article>
      </section>
      <footer>
        Quality Inspection <span>·</span> Phase 1 foundation
      </footer>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="page-shell compact-shell">
      <Link className="back-link" to="/">
        ← Workspace
      </Link>
      <section className="welcome-card about-card">
        <p className="eyebrow">PROJECT FOUNDATION</p>
        <h2>AI recommends. A human decides.</h2>
        <p className="supporting-copy">
          The foundation is ready for the approval-gated backend and inspection
          workflow phases. This screen does not yet submit or analyze
          inspections.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}
