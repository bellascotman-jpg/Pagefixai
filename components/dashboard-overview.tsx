'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AuditLauncher from '@/components/audit-launcher';

type OverviewProps = { userName?: string | null; email: string; planName: string; isPaid: boolean; isFounder: boolean; usedUnits: number; includedUnits: number | null; criticalObjections: number; verifiedOptimizations: number; recentAuditCount: number };

const tools = [
{title:'Buyer Decisions',description:'Purchase objections and missing answers',state:'Evidence-led buyer questions',detail:'Review what shoppers may still need to know before deciding.',href:'/dashboard/intelligence/buyer-decisions',icon:'brain',group:'analysis'},
{title:'Clarity Scorecard',description:'Understand how clearly your offer communicates value',state:'Clarity review',detail:'Inspect value proposition, hierarchy and confusing language.',href:'/dashboard/intelligence/clarity-scorecard',icon:'shield',group:'analysis'},
{title:'Pre-purchase & Return Risk',description:'Find information gaps that can create uncertainty',state:'Product information risks',detail:'Check sizing, delivery, returns and expectation-setting gaps.',href:'/dashboard/intelligence/return-risk',icon:'alert',group:'analysis'},
{title:'Visual & Mobile Inspection',description:'Review page presentation across screen sizes',state:'Responsive review',detail:'Inspect visual hierarchy, mobile usability and layout issues.',href:'/dashboard/intelligence/visual-inspection',icon:'mobile',group:'analysis'},
{title:'Grounded Copy Fixes',description:'Improve page copy using captured evidence',state:'Evidence-linked suggestions',detail:'Draft specific revisions without inventing product claims.',href:'/dashboard/intelligence/copy-fixes',icon:'spark',group:'optimization'},
{title:'Journey & Message Match',description:'Check consistency from entry point to landing page',state:'Journey consistency',detail:'Compare campaign promises, page messages and next steps.',href:'/dashboard/intelligence/journey',icon:'compare',group:'optimization'},
{title:'Impact Analysis',description:'Prioritize changes by evidence, reach and effort',state:'Decision support',detail:'Compare implementation effort with evidence and verification needs.',href:'/dashboard/intelligence/impact',icon:'chart',group:'optimization'},
{title:'Ads & Creative Studio',description:'Keep creative messaging aligned with destination pages',state:'Creative consistency',detail:'Review ad-to-page message alignment before publishing.',href:'/dashboard/creative-studio',icon:'layers',group:'optimization'},
];

function Glyph({name,size=20}:{name:string;size?:number}) {
 const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true as const};
 const paths:Record<string,ReactNode>={
 grid:<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
 brain:<><path d="M12 5.2a3.1 3.1 0 0 0-5.9 1.3A3.4 3.4 0 0 0 5 12.8a3.2 3.2 0 0 0 3.1 5.3A3.1 3.1 0 0 0 12 20"/><path d="M12 5.2a3.1 3.1 0 0 1 5.9 1.3 3.4 3.4 0 0 1 1.1 6.3 3.2 3.2 0 0 1-3.1 5.3A3.1 3.1 0 0 1 12 20V5.2Z"/><path d="M8 9.5c1.7 0 2.5 1 2.5 2.5M16 9.5c-1.7 0-2.5 1-2.5 2.5M8.5 15.5c1.2-.3 2 .2 2.5 1"/></>,
 shield:<><path d="M12 3 19 6v5.1c0 4.5-2.8 7.8-7 9.9-4.2-2.1-7-5.4-7-9.9V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>,
 alert:<><path d="m10.3 4.7-7 12.1A1.5 1.5 0 0 0 4.6 19h14.8a1.5 1.5 0 0 0 1.3-2.2l-7-12.1a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></>,
 mobile:<><rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M10 5h4m-2 13.5h.01"/></>,
 spark:<><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
 compare:<><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></>,
 chart:<><path d="M4 19.5h16"/><path d="M6.5 16V11m5 5V5m5 11V8"/></>,
 layers:<><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
 arrow:<><path d="M5 12h14m-6-6 6 6-6 6"/></>,
 check:<path d="m5 12 4 4L19 6"/>
 };
 return <svg {...common}>{paths[name]||paths.grid}</svg>;
}

export default function DashboardOverview(props:OverviewProps) {
 const [noticeVisible,setNoticeVisible]=useState(true);
 const initials=(props.userName||props.email).trim().split(/[\\s@._-]+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'U';
 const used=Math.max(0,props.usedUnits),limit=props.includedUnits;
 const progress=limit&&limit>0?Math.min(100,(used/limit)*100):0;
 const metrics=[
 {label:'Average health score',value:'—',note:'Score reporting is not yet available',icon:'chart',tone:'violet'},
 {label:'Critical objections',value:String(props.criticalObjections),note:props.criticalObjections?'Open high-severity findings across your audits':'No open high-severity findings recorded',icon:'brain',tone:'amber'},
 {label:'Verified optimizations',value:String(props.verifiedOptimizations),note:'Changes marked verified in Fix Center',icon:'check',tone:'rose'}
 ];
 const analysisTools=tools.filter(tool=>tool.group==='analysis'),optimizationTools=tools.filter(tool=>tool.group==='optimization');
 return <main className="dashboard overview-page">
 <header className="overview-header"><div><div className="overview-breadcrumb"><span>PageFix AI</span><span className="overview-crumb-separator">/</span><span>Workspace</span></div><h1>Overview</h1><p>Your website intelligence command center.</p></div><div className="overview-header-actions"><Link className="overview-notification" href="/dashboard/settings" aria-label="Workspace settings" title="Workspace settings"><Glyph name="bell" size={19}/></Link><div className="overview-avatar" title={props.userName||props.email} aria-label={'Account: '+(props.userName||props.email)}>{initials}</div></div></header>
 <div className="overview-content">
 <section className="overview-hero-card"><div className="overview-hero-main"><div className="overview-eyebrow"><span className="overview-live-dot"/>WEBSITE INTELLIGENCE</div><h2>Analyze a product page</h2><p>Find usability friction, unclear product information and evidence-backed opportunities to improve your page.</p><AuditLauncher/><div className="overview-assurance"><Glyph name="shield" size={15}/> Evidence-led findings. No invented performance metrics.</div></div>
 <aside className="overview-usage-card" aria-label="Audit usage"><div className="overview-usage-top"><span className="overview-usage-icon"><Glyph name="grid" size={19}/></span><span className="overview-plan-badge">{props.isFounder?'Founder access':props.planName}</span></div><p className="overview-usage-label">Audit usage this period</p><div className="overview-usage-count"><strong>{used.toLocaleString('en-US',{maximumFractionDigits:1})}</strong><span>{props.isFounder?'units recorded · unlimited allowance':limit===null?'units used':`/ ${limit} units used`}</span></div>{limit!==null&&<div className="overview-progress-track" role="progressbar" aria-label="Usage units consumed" aria-valuemin={0} aria-valuemax={Math.max(1,limit)} aria-valuenow={Math.min(used,limit)}><span style={{width:progress+'%'}}/></div>}<div className="overview-usage-bottom"><span>{props.isFounder?'Unlimited allowance':limit===null?'Allowance unavailable':`${Math.max(0,limit-used).toLocaleString('en-US',{maximumFractionDigits:1})} units remaining`}</span><Link href="/pricing">View plans <Glyph name="arrow" size={13}/></Link></div><div className="overview-usage-divider"/><p className="overview-usage-caption">Usage is based on your account balance, not an estimate.</p></aside></section>
 {!props.isPaid&&noticeVisible&&<section className="overview-plan-notice"><span className="overview-notice-icon"><Glyph name="spark" size={20}/></span><div className="overview-notice-copy"><h2>Choose a plan</h2><p>Compare audit capacity and features to find the right fit for your workflow.</p></div><Link className="overview-notice-cta" href="/pricing">Explore plans <Glyph name="arrow" size={15}/></Link><button type="button" className="overview-dismiss" aria-label="Dismiss plan notice" onClick={()=>setNoticeVisible(false)}>×</button></section>}
 <section className="overview-metrics" aria-label="Workspace metrics">{metrics.map(metric=><article className={`overview-metric-card tone-${metric.tone}`} key={metric.label}><span className="overview-metric-icon"><Glyph name={metric.icon} size={19}/></span><div className="overview-metric-content"><p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.note}</span></div></article>)}</section>
 <section className="overview-toolkit"><div className="overview-section-heading"><div><div className="overview-section-eyebrow">YOUR TOOLKIT</div><h2>Intelligence engines</h2><p>Move from evidence to decisions, then verify the changes.</p></div><Link className="overview-view-all" href="/dashboard/intelligence">Explore intelligence <Glyph name="arrow" size={15}/></Link></div>
 <div className="overview-tool-group"><div className="overview-tool-group-heading"><span className="overview-group-marker analysis-marker"/><h3>Analyze & understand</h3><span>Evidence and diagnosis</span></div><div className="overview-tool-grid">{analysisTools.map(tool=><Link href={tool.href} className="overview-tool-card analysis-card" key={tool.title}><div className="overview-tool-card-top"><span className="overview-tool-icon"><Glyph name={tool.icon} size={21}/></span><span className="overview-tool-open"><Glyph name="arrow" size={16}/></span></div><h4>{tool.title}</h4><p className="overview-tool-description">{tool.description}</p><div className="overview-tool-state"><span className="overview-state-indicator"/>{tool.state}</div><p className="overview-tool-detail">{tool.detail}</p></Link>)}</div></div>
 <div className="overview-tool-group"><div className="overview-tool-group-heading"><span className="overview-group-marker optimization-marker"/><h3>Optimize & prioritize</h3><span>Action and decision support</span></div><div className="overview-tool-grid">{optimizationTools.map(tool=><Link href={tool.href} className="overview-tool-card optimization-card" key={tool.title}><div className="overview-tool-card-top"><span className="overview-tool-icon"><Glyph name={tool.icon} size={21}/></span><span className="overview-tool-open"><Glyph name="arrow" size={16}/></span></div><h4>{tool.title}</h4><p className="overview-tool-description">{tool.description}</p><div className="overview-tool-state"><span className="overview-state-indicator"/>{tool.state}</div><p className="overview-tool-detail">{tool.detail}</p></Link>)}</div></div></section>
 <footer className="overview-referral-footer"><span className="overview-referral-icon"><Glyph name="layers" size={19}/></span><div className="overview-referral-copy"><h2>Refer customers. Earn commission.</h2><p>Share PageFix AI with your network and manage eligible referrals.</p></div><Link href="/dashboard/referrals" className="overview-referral-link">Open referrals <Glyph name="arrow" size={15}/></Link></footer>
 <div className="overview-recent-link"><span>{props.recentAuditCount} recent {props.recentAuditCount===1?'audit':'audits'} loaded</span><Link href="/dashboard/audits">Open audit history <Glyph name="arrow" size={14}/></Link></div>
 </div></main>;
}