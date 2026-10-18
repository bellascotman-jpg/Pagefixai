'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const workspaceItems = [
  { href: '/dashboard', label: 'Overview', icon: '◫', exact: true },
  { href: '/dashboard/audits', label: 'Audit history', icon: '⌕' },
  { href: '/dashboard/fixes', label: 'Fix center', icon: '↗' },
  { href: '/dashboard/reports', label: 'Reports', icon: '▤' },
];

const intelligenceItems = [
  { href: '/dashboard/intelligence', label: 'Intelligence hub', icon: '◈', exact: true },
  { href: '/dashboard/intelligence/buyer-decisions', label: 'Buyer decisions', icon: '◎' },
  { href: '/dashboard/intelligence/clarity-scorecard', label: 'Clarity scorecard', icon: '◉' },
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
  { href: '/dashboard/intelligence/retention', label: 'Retention & onboarding', icon: '↻' },
  { href: '/dashboard/intelligence/verification', label: 'Verification history', icon: '✓' },
];

const growthItems = [
  { href: '/dashboard/referrals', label: 'Referrals & earnings', icon: '↗' },
  { href: '/dashboard/affiliate', label: 'Affiliate program', icon: '◎' },
];

const workspaceTools = [
  { href: '/dashboard/competitors', label: 'Competitors', icon: '⊙' },
  { href: '/dashboard/intelligence/workspaces', label: 'Seller & agency workspaces', icon: '▣' },
  { href: '/dashboard/intelligence/integrations', label: 'Integrations', icon: '⤴' },
];

const accountItems = [
  { href: '/dashboard/settings', label: 'Workspace settings', icon: '⚙' },
  { href: '/pricing', label: 'Plans & usage', icon: '◇' },
];

type Item = { href: string; label: string; icon: string; exact?: boolean };

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  const renderItems = (items: Item[]) => (
    <nav className="sidebar-nav">
      {items.map(item => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}>
            <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="mobile-workspace-bar">
        <button className="workspace-menu-button" type="button" aria-label={open ? 'Close workspace menu' : 'Open workspace menu'} aria-expanded={open} aria-controls="workspace-sidebar" onClick={() => setOpen(value => !value)}>
          <span /><span /><span />
        </button>
        <Link href="/dashboard" className="sidebar-brand">PageFix<span>AI</span></Link>
        <span className="workspace-bar-label">WORKSPACE</span>
      </div>
      <button type="button" aria-label="Close workspace navigation" className={`workspace-sidebar-backdrop ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} />
      <aside id="workspace-sidebar" className={`app-sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-mobile-heading">
          <Link href="/dashboard" className="sidebar-brand" onClick={() => setOpen(false)}>PageFix<span>AI</span></Link>
          <button type="button" className="sidebar-close-button" aria-label="Close workspace menu" onClick={() => setOpen(false)}>×</button>
        </div>
        <Link href="/dashboard" className="sidebar-brand sidebar-desktop-brand">PageFix<span>AI</span></Link>

        <div className="sidebar-group">
          <div className="sidebar-section-label">WORKSPACE</div>
          {renderItems(workspaceItems)}
        </div>

        <details className="sidebar-group sidebar-intelligence" open={pathname.startsWith('/dashboard/intelligence')}>
          <summary className="sidebar-section-label"><span>COMMERCE INTELLIGENCE</span><span className="sidebar-section-chevron" aria-hidden="true" /></summary>
          {renderItems(intelligenceItems)}
        </details>

        <div className="sidebar-group">
          <div className="sidebar-section-label">GROWTH</div>
          {renderItems(growthItems)}
        </div>

        <div className="sidebar-group">
          <div className="sidebar-section-label">WORKSPACE TOOLS</div>
          {renderItems(workspaceTools)}
        </div>

        <div className="sidebar-group">
          <div className="sidebar-section-label">ACCOUNT</div>
          {renderItems(accountItems)}
        </div>

        <div className="sidebar-bottom">
          <p>Evidence first. Honest limits. Fix what you can verify.</p>
          <Link href="/security" onClick={() => setOpen(false)}>Security & privacy ↗</Link>
        </div>
      </aside>
    </>
  );
}
