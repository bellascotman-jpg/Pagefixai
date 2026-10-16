'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const groups = [
  { label: 'WORKSPACE', items: [
    { href: '/dashboard', label: 'Overview', icon: '◫', exact: true },
    { href: '/dashboard/audits', label: 'Audit history', icon: '⌕' },
    { href: '/dashboard/fixes', label: 'Fix center', icon: '↗' },
    { href: '/dashboard/reports', label: 'Reports', icon: '▤' },
  ]},
  { label: 'COMMERCE INTELLIGENCE', items: [
    { href: '/dashboard/intelligence', label: 'Intelligence hub', icon: '◈', exact: true },
    { href: '/dashboard/intelligence/buyer-decisions', label: 'Buyer decisions', icon: '◎' },
    { href: '/dashboard/intelligence/return-risk', label: 'Pre-purchase & return risk', icon: '?' },
    { href: '/dashboard/intelligence/visual-inspection', label: 'Visual & mobile inspection', icon: '▧' },
    { href: '/dashboard/intelligence/seo-data', label: 'SEO & product data', icon: '⌕' },
    { href: '/dashboard/intelligence/copy-fixes', label: 'Grounded copy fixes', icon: '✎' },
    { href: '/dashboard/intelligence/claims', label: 'Claims & promises', icon: '⇄' },
    { href: '/dashboard/intelligence/store', label: 'Store intelligence', icon: '▦' },
    { href: '/dashboard/intelligence/impact', label: 'Impact analysis', icon: '↗' },
    { href: '/dashboard/intelligence/promise-ledger', label: 'Promise Ledger', icon: '▤' },
    { href: '/dashboard/intelligence/experiments', label: 'Experimentation', icon: '⌁' },
    { href: '/dashboard/intelligence/governance', label: 'Evidence & governance', icon: '✓' },
    { href: '/dashboard/intelligence/journey', label: 'Journey & message match', icon: '⌁' },
    { href: '/dashboard/intelligence/verification', label: 'Verification history', icon: '✓' },
  ]},
  { label: 'WORKSPACES', items: [
    { href: '/dashboard/competitors', label: 'Competitors', icon: '⊙' },
    { href: '/dashboard/intelligence/workspaces', label: 'Seller & agency workspaces', icon: '▣' },
    { href: '/dashboard/intelligence/integrations', label: 'Integrations', icon: '⤴' },
  ]},
  { label: 'ACCOUNT', items: [
    { href: '/dashboard/settings', label: 'Workspace settings', icon: '⚙' },
    { href: '/pricing', label: 'Plans & usage', icon: '◇' },
  ]},
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  return <aside className="app-sidebar">
    <Link href="/dashboard" className="sidebar-brand">PageFix<span>AI</span></Link>
    {groups.map(group => <div key={group.label}>
      <div className="sidebar-section-label">{group.label}</div>
      <nav className="sidebar-nav" aria-label={group.label}>
        {group.items.map(item => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
          return <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <span className="sidebar-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          </Link>;
        })}
      </nav>
    </div>)}
    <div className="sidebar-bottom"><p>Evidence first. Honest limits. Fix what you can verify.</p><Link href="/security">Security & privacy ↗</Link></div>
  </aside>;
}
