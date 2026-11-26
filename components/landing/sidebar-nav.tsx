"use client";

import { useState } from "react";
import Link from "next/link";
import Brand from "@/components/brand";

const groups = [
  { title: "Explore", items: [
    { label: "Overview", href: "/#top" },
    { label: "Platform & features", href: "/#capabilities" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Evidence standard", href: "/#trust" },
    { label: "Ads & creative", href: "/#solutions" },
  ]},
  { title: "Resources", items: [
    { label: "Compare tools", href: "/compare" },
    { label: "Guides & resources", href: "/resources" },
    { label: "Partners", href: "/partners/affiliate" },
    { label: "Pricing", href: "/pricing" },
  ]},
];

export function SidebarNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <>
    <button className="pfx-menu-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="pfx-sidebar" onClick={() => setOpen(v => !v)}>
      <span/><span/><span/>
    </button>
    <button className={`pfx-sidebar-scrim${open ? " is-open" : ""}`} type="button" aria-label="Close navigation" onClick={close} tabIndex={open ? 0 : -1}/>
    <aside id="pfx-sidebar" className={`pfx-sidebar${open ? " is-open" : ""}`} aria-label="PageFix main navigation">
      <div className="pfx-sidebar-brand">
        <Brand className="pfx-sidebar-logo" />
        <button className="pfx-sidebar-close" type="button" aria-label="Close navigation" onClick={close}>×</button>
      </div>
      <div className="pfx-sidebar-kicker">COMMERCE INTELLIGENCE</div>
      {groups.map(group => <div className="pfx-sidebar-group" key={group.title}>
        <div className="pfx-sidebar-heading">{group.title}</div>
        <nav aria-label={group.title}>{group.items.map(item => <Link key={item.href} href={item.href} onClick={close}>{item.label}<span aria-hidden="true">↗</span></Link>)}</nav>
      </div>)}
      <div className="pfx-sidebar-bottom">
        <Link className="pfx-sidebar-signin" href="/auth?mode=login" onClick={close}>Sign in</Link>
        <Link className="pfx-btn pfx-btn-red" href="/auth" onClick={close}>Start an audit <span aria-hidden="true">↗</span></Link>
        <p>Evidence before opinions.</p>
      </div>
    </aside>
  </>;
}
