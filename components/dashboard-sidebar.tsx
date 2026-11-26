'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Brand from '@/components/brand';

type Item = { href: string; label: string; icon: string; exact?: boolean };
type Group = { label: string; descriptor: string; tone?: 'diagnose' | 'fix'; items: Item[] };

const groups: Group[] = [
  { label: 'HOME', descriptor: 'Your store at a glance', items: [
    { href: '/dashboard', label: 'Overview', icon: 'home', exact: true },
    { href: '/dashboard/audits', label: 'Audit history', icon: 'history' },
    { href: '/dashboard/reports', label: 'Reports', icon: 'file' },
  ]},
  { label: 'DIAGNOSE', descriptor: 'Find what makes buyers hesitate', tone: 'diagnose', items: [
    { href: '/dashboard/intelligence/buyer-decisions', label: 'Buyer decisions', icon: 'message' },
    { href: '/dashboard/intelligence/clarity-scorecard', label: 'Clarity scorecard', icon: 'scan' },
    { href: '/dashboard/intelligence/return-risk', label: 'Return risk', icon: 'package' },
    { href: '/dashboard/intelligence/visual-inspection', label: 'Mobile inspection', icon: 'smartphone' },
    { href: '/dashboard/intelligence/seo-data', label: 'SEO & product data', icon: 'search' },
    { href: '/dashboard/intelligence/ai-search-readiness', label: 'AI search readiness', icon: 'sparkles' },
    { href: '/dashboard/intelligence/store', label: 'Store intelligence', icon: 'store' },
    { href: '/dashboard/competitors', label: 'Competitors', icon: 'users' },
  ]},
  { label: 'FIX', descriptor: 'Turn evidence into better pages', tone: 'fix', items: [
    { href: '/dashboard/fixes', label: 'Fix center', icon: 'wrench' },
    { href: '/dashboard/intelligence/copy-fixes', label: 'Copy fixes', icon: 'pen' },
    { href: '/dashboard/intelligence/journey', label: 'Journey match', icon: 'route' },
    { href: '/dashboard/intelligence/claims', label: 'Claims & promises', icon: 'shield' },
    { href: '/dashboard/intelligence/impact', label: 'Impact analysis', icon: 'target' },
  ]},
  { label: 'CREATE & TEST', descriptor: 'Build, compare and improve', items: [
    { href: '/dashboard/creative-studio', label: 'Ads & Creative Studio', icon: 'image' },
    { href: '/dashboard/experiments', label: 'A/B testing & experiments', icon: 'flask' },
    { href: '/dashboard/intelligence/retention', label: 'Retention & onboarding', icon: 'repeat' },
  ]},
  { label: 'PROVE', descriptor: 'Keep a record of what changed', items: [
    { href: '/dashboard/intelligence/verification', label: 'Verification history', icon: 'check' },
    { href: '/dashboard/intelligence/governance', label: 'Evidence & governance', icon: 'clipboard' },
  ]},
  { label: 'GROW', descriptor: 'Expand your business workflow', items: [
    { href: '/dashboard/referrals', label: 'Referrals & affiliate', icon: 'gift' },
    { href: '/dashboard/intelligence/workspaces', label: 'Seller & agency workspaces', icon: 'briefcase' },
    { href: '/dashboard/intelligence/integrations', label: 'Integrations', icon: 'plug' },
  ]},
];

const iconPaths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6',
  history: 'M3 12a9 9 0 1 0 2.6-6.4L3 8m0-5v5h5M12 7v5l3 2',
  file: 'M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6',
  message: 'M4 5h16v12H9l-5 4zM8 10h8M8 14h5',
  scan: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10',
  package: 'm12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9M8 5.3l8 4.5',
  smartphone: 'M7 2.8h10v18.4H7zM10 5.5h4M11 18.5h2',
  search: 'm20 20-4.5-4.5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
  sparkles: 'm12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  store: 'M3 10h18l-2-6H5zM5 10v10h14V10M9 20v-6h6v6M3 10l2 2 2-2 2 2 2-2 2 2 2-2 2 2 2-2',
  users: 'M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4.2a4 4 0 0 1 0 7.6M20 20v-1.5a4 4 0 0 0-2.8-3.8',
  wrench: 'm14.5 6.5 3-3a5 5 0 0 0-6.7 6.7L4 17a2.1 2.1 0 0 0 3 3l6.8-6.8a5 5 0 0 0 6.7-6.7l-3 3z',
  pen: 'm4 20 4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11zM13.5 6.5l4 4M4 20h16',
  route: 'M5 5a2 2 0 1 0 0 .1M19 19a2 2 0 1 0 0 .1M7 5h5a4 4 0 0 1 4 4v2a4 4 0 0 0 4 4M5 7v8a4 4 0 0 0 4 4h8',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10M9 12l2 2 4-4',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 12h.01',
  image: 'M4 4h16v16H4zM8 10h.01M20 15l-5-5L5 20',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  check: 'm5 12 4 4L19 6M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0',
  clipboard: 'M9 4h6l1 2h3v15H5V6h3zM9 4a3 3 0 0 0 6 0M8 12h8M8 16h6',
  gift: 'M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9H7a2 2 0 1 1 2-2c0 2 3 2 3 2M12 9h5a2 2 0 1 0-2-2c0 2-3 2-3 2',
  briefcase: 'M3 8h18v13H3zM8 8V5h8v3M3 13h18M10 13v2h4v-2',
  plug: 'M9 7V3M15 7V3M7 7h10v5a5 5 0 0 1-10 0zM12 17v4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.6h.5A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.6v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.5 1',
};

function SidebarIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-lucide"><path d={iconPaths[name] ?? iconPaths.file} /></svg>;
}

export default function DashboardSidebar({ isFounder = false }: { isFounder?: boolean }) {
  const pathname = usePathname();
  const activeGroup = groups.find(group => group.items.some(item => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/'))) ?? groups[0];
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string>(activeGroup.label);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    setOpen(false);
    if (!userToggled) setExpanded(activeGroup.label);
  }, [pathname, activeGroup.label, userToggled]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = ''; };
  }, [open]);

  const visibleGroups = isFounder ? [...groups, { label: 'ADMINISTRATION', descriptor: 'Platform operations', items: [
    { href: '/founder', label: 'Founder console', icon: 'briefcase' },
    { href: '/founder/affiliates', label: 'Affiliate operations', icon: 'users' },
    { href: '/founder/users', label: 'User management', icon: 'users' },
    { href: '/founder/audits', label: 'All audits', icon: 'history' },
  ] }] : groups;

  return <>
    <div className="mobile-workspace-bar">
      <button className="workspace-menu-button" type="button" aria-label={open ? 'Close workspace menu' : 'Open workspace menu'} aria-expanded={open} aria-controls="workspace-sidebar" onClick={() => setOpen(value => !value)}><span /><span /><span /></button>
      <Brand href="/dashboard" className="sidebar-brand-lockup" />
      <span className="workspace-bar-label">WORKSPACE</span>
    </div>
    <button type="button" aria-label="Close workspace navigation" className={`workspace-sidebar-backdrop ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} />
    <aside id="workspace-sidebar" className={`app-sidebar redesigned-sidebar ${open ? 'is-open' : ''}`} aria-label="Workspace navigation">
      <div className="sidebar-brand-row">
        <Brand href="/dashboard" className="sidebar-brand-lockup sidebar-desktop-brand" />
        <button type="button" className="sidebar-close-button" aria-label="Close workspace menu" onClick={() => setOpen(false)}>×</button>
      </div>
      <div className="sidebar-scroll-area">
        {visibleGroups.map(group => {
          const isExpanded = expanded === group.label;
          const active = group.items.some(item => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/'));
          return <section key={group.label} className={`sidebar-group redesigned-group ${group.tone ?? ''} ${active ? 'has-active' : ''} ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
            <button type="button" className="sidebar-section-toggle redesigned-section-toggle" aria-expanded={isExpanded} onClick={() => { setUserToggled(true); setExpanded(current => current === group.label ? '' : group.label); }}>
              <span className="sidebar-group-copy"><span className="sidebar-section-label">{group.label}</span><span className="sidebar-group-descriptor">{group.descriptor}</span></span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="sidebar-chevron"><path d="m7 10 5 5 5-5" /></svg>
            </button>
            {isExpanded && <nav className="sidebar-nav redesigned-nav" aria-label={group.label}>{group.items.map(item => {
              const selected = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
              return <Link key={item.href} href={item.href} className={`sidebar-link redesigned-link ${selected ? 'sidebar-link-active' : ''}`} aria-current={selected ? 'page' : undefined} onClick={() => setOpen(false)}><SidebarIcon name={item.icon} /><span>{item.label}</span></Link>;
            })}</nav>}
          </section>;
        })}
      </div>
      <div className="sidebar-account">
        <div className="sidebar-account-heading"><SidebarIcon name="settings" /><span>ACCOUNT</span></div>
        <Link href="/dashboard/settings" className={`sidebar-link redesigned-link ${pathname.startsWith('/dashboard/settings') ? 'sidebar-link-active' : ''}`} onClick={() => setOpen(false)}><SidebarIcon name="settings" /><span>Workspace settings</span></Link>
        <Link href="/pricing" className={`sidebar-link redesigned-link ${pathname.startsWith('/pricing') ? 'sidebar-link-active' : ''}`} onClick={() => setOpen(false)}><SidebarIcon name="target" /><span>Plans & usage</span></Link>
        <div className="sidebar-usage-note"><span>Plan and audit usage</span><Link href="/pricing">View usage <span aria-hidden="true">↗</span></Link></div>
      </div>
      <div className="sidebar-bottom"><p>Evidence first. Fix what you can verify.</p></div>
    </aside>
    <Link href="/dashboard/ai-help" className="pagefix-assistant-float" aria-label="Open PageFix AI assistant"><SidebarIcon name="sparkles" /><span>Ask PageFix AI</span></Link>
  </>;
}
