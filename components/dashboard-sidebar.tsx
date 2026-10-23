'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const groups = [
  { label: 'WORKSPACE', items: [
    { href: '/dashboard', label: 'Overview', icon: '◫', exact: true },
    { href: '/dashboard/audits', label: 'Audit history', icon: '⌕' },
    { href: '/dashboard/fixes', label: 'Fix center', icon: '↗' },
    { href: '/dashboard/reports', label: 'Reports', icon: '▤' },
  ]},
  { label: 'GROWTH OPERATIONS', items: [
    { href: '/dashboard/creative-studio', label: 'Ads & Creative Studio', icon: '✎' },
    { href: '/dashboard/experiments', label: 'A/B testing', icon: '⌁' },
    { href: '/dashboard/intelligence/integrations', label: 'Integrations', icon: '⤴' },
  ]},
  { label: 'PAGE INTELLIGENCE', items: [
    { href: '/dashboard/intelligence/buyer-decisions', label: 'Buyer decisions', icon: '◎' },
    { href: '/dashboard/intelligence/visual-inspection', label: 'Visual & mobile inspection', icon: '▧' },
    { href: '/dashboard/intelligence/seo-data', label: 'SEO & product data', icon: '⌕' },
    { href: '/dashboard/intelligence/store', label: 'Store intelligence', icon: '▦' },
    { href: '/dashboard/intelligence/claims', label: 'Claims & promises', icon: '⇄' },
  ]},
  { label: 'AI ASSISTANCE', items: [
    { href: '/dashboard/ai-help', label: 'PageFix AI assistant', icon: '✦' },
  ]},
  { label: 'ACCOUNT', items: [
    { href: '/dashboard/settings', label: 'Workspace settings', icon: '⚙' },
    { href: '/pricing', label: 'Plans & usage', icon: '◇' },
  ]},
];

export default function DashboardSidebar({ isFounder = false }: { isFounder?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ 'GROWTH OPERATIONS': false, 'PAGE INTELLIGENCE': true, 'AI ASSISTANCE': true, 'ACCOUNT': true, 'ADMINISTRATION': true });

  useEffect(() => {
    setOpen(false);
    setCollapsed(current => ({
      ...current,
      'GROWTH OPERATIONS': (pathname.startsWith('/dashboard/creative-studio') || pathname.startsWith('/dashboard/experiments') || pathname.startsWith('/dashboard/intelligence/integrations')) ? false : current['GROWTH OPERATIONS'],
      'PAGE INTELLIGENCE': pathname.startsWith('/dashboard/intelligence/') && !pathname.startsWith('/dashboard/intelligence/integrations') ? false : current['PAGE INTELLIGENCE'],
      'AI ASSISTANCE': pathname.startsWith('/dashboard/ai-help') ? false : current['AI ASSISTANCE'],
      'ACCOUNT': pathname.startsWith('/dashboard/settings') ? false : current['ACCOUNT'],
      'ADMINISTRATION': pathname.startsWith('/founder') ? false : current['ADMINISTRATION'],
    }));
  }, [pathname]);

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

  const visibleGroups = isFounder ? [...groups, { label: 'ADMINISTRATION', items: [
    { href: '/founder', label: 'Founder console', icon: '▣' },
    { href: '/founder/affiliates', label: 'Affiliate operations', icon: '◎' },
    { href: '/founder/users', label: 'User management', icon: '♙' },
    { href: '/founder/audits', label: 'All audits', icon: '⌕' },
  ] }] : groups;

  return <>
    <div className="mobile-workspace-bar">
      <button className="workspace-menu-button" type="button" aria-label={open ? 'Close workspace menu' : 'Open workspace menu'} aria-expanded={open} aria-controls="workspace-sidebar" onClick={() => setOpen(value => !value)}>
        <span /><span /><span />
      </button>
      <Link href="/dashboard" className="sidebar-brand">PageFix<span>AI</span></Link>
      <span className="workspace-bar-label">WORKSPACE</span>
    </div>
    <button type="button" aria-label="Close workspace navigation" className={`workspace-sidebar-backdrop ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} />
    <aside id="workspace-sidebar" className={`app-sidebar ${open ? 'is-open' : ''}`}>
      <Link href="/dashboard" className="sidebar-brand sidebar-desktop-brand">PageFix<span>AI</span></Link>
      <div className="sidebar-mobile-heading">
        <Link href="/dashboard" className="sidebar-brand" onClick={() => setOpen(false)}>PageFix<span>AI</span></Link>
        <button type="button" className="sidebar-close-button" aria-label="Close workspace menu" onClick={() => setOpen(false)}>×</button>
      </div>
      {visibleGroups.map(group => <div key={group.label} className={`sidebar-group ${collapsed[group.label] ? 'is-collapsed' : ''}`}>
        <button type="button" className="sidebar-section-toggle" aria-expanded={!collapsed[group.label]} onClick={() => setCollapsed(current => ({ ...current, [group.label]: !current[group.label] }))}><span className="sidebar-section-label">{group.label}</span><span className="sidebar-section-chevron" aria-hidden="true">{collapsed[group.label] ? '+' : '−'}</span></button>
        {!collapsed[group.label] && <nav className="sidebar-nav" aria-label={group.label}>
          {group.items.map(item => {
            const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
            return <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}>
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
            </Link>;
          })}
        </nav>}
      </div>)}
      <div className="sidebar-bottom"><p>Evidence first. Honest limits. Fix what you can verify.</p><Link href="/security" onClick={() => setOpen(false)}>Security & privacy ↗</Link></div>
    </aside>
  </>;
}
