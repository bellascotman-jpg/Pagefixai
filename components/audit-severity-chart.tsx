type FindingLike = { severity: string };

const SERIES = [
  { key: 'HIGH', label: 'High severity', description: 'Review first' },
  { key: 'MEDIUM', label: 'Medium severity', description: 'Plan a fix' },
  { key: 'LOW', label: 'Low severity', description: 'Improve when practical' },
] as const;

export default function AuditSeverityChart({ findings }: { findings: FindingLike[] }) {
  const counts = SERIES.map(item => ({ ...item, count: findings.filter(finding => finding.severity === item.key).length }));
  const max = Math.max(1, ...counts.map(item => item.count));
  return <section className="card" aria-labelledby="audit-severity-chart-title" style={{ marginTop: 24 }}>
    <div className="label">FINDINGS OVERVIEW</div>
    <h2 id="audit-severity-chart-title">Issues by severity</h2>
    <p className="muted" style={{ fontSize: 12 }}>Counts reflect findings recorded by this audit—not revenue lost or predicted conversion impact.</p>
    <div className="audit-severity-chart">
      {counts.map(item => <div className="audit-severity-row" key={item.key}>
        <div className="audit-severity-label"><strong>{item.label}</strong><span>{item.description}</span></div>
        <div className="audit-severity-track" role="img" aria-label={item.count + ' ' + item.label.toLowerCase() + ' findings'}>
          <span className={'audit-severity-bar severity-' + item.key.toLowerCase()} style={{ width: (item.count / max * 100) + '%' }} />
        </div>
        <strong className="audit-severity-count">{item.count}</strong>
      </div>)}
    </div>
  </section>;
}
