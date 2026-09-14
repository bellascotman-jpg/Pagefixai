export default function HomePage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
      <p style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#087f73" }}>PageFix AI</p>
      <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", lineHeight: 0.98, maxWidth: 850, margin: "18px 0" }}>
        Find what&apos;s getting in the way of the sale.
      </h1>
      <p style={{ maxWidth: 680, fontSize: 20, lineHeight: 1.6, color: "#46605f" }}>
        Evidence-driven ecommerce purchase-friction intelligence. PageFix analyzes observable storefront evidence, prioritizes purchase friction, and turns findings into practical fixes.
      </p>
      <section style={{ marginTop: 48, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          ["Evidence first", "Browser evidence and deterministic checks remain the source of truth."],
          ["Buyer questions", "Map observable information gaps to the questions buyers need answered."],
          ["Fix center", "Turn verified findings into implementation-ready actions and rechecks."],
        ].map(([title, body]) => (
          <article key={title} style={{ background: "white", border: "1px solid #dce8e5", borderRadius: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p style={{ color: "#5a706f", lineHeight: 1.6 }}>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
