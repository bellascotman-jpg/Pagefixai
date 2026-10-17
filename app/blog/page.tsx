import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'The PageFix AI Blog | E-commerce, Landing Pages & Evidence-led Optimization',
  description: 'Practical, evidence-first guidance for e-commerce product pages, campaign-to-landing-page message match and prioritizing website fixes.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'The PageFix AI Blog',
    description: 'Practical guidance for clearer product pages, better landing-page journeys and evidence-led website improvements.',
    type: 'website',
    url: '/blog',
  },
};

const dateLabel = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));

export default function BlogIndexPage() {
  const [featured, ...articles] = blogPosts;
  return <main className="marketing editorial-page blog-page">
    <header className="site-nav">
      <Link href="/" className="brand" aria-label="PageFix AI home">PageFix<span>AI</span></Link>
      <nav className="nav-links" aria-label="Blog navigation"><Link href="/#capabilities">Platform</Link><Link href="/resources">Guides</Link><Link href="/pricing">Pricing</Link></nav>
      <div className="nav-actions"><Link href="/auth?mode=login" className="nav-signin">Sign in</Link><Link href="/auth" className="button button-primary button-small">Start an audit ↗</Link></div>
    </header>

    <section className="blog-hero">
      <div className="blog-hero-orbit" aria-hidden="true"><span /><span /><span /></div>
      <div className="blog-hero-inner">
        <div className="eyebrow"><span className="status-dot" /> THE PAGEFIX AI JOURNAL</div>
        <h1>Better pages start<br />with <span>better questions.</span></h1>
        <p>Practical thinking for e-commerce product pages, landing-page journeys and website fixes. Clear methods, evidence over guesswork, and no invented performance claims.</p>
        <div className="blog-hero-meta"><span>Field notes for operators and growth teams</span><span className="blog-meta-dot">·</span><span>{blogPosts.length} practical articles to start</span></div>
      </div>
    </section>

    <section className="blog-content">
      <div className="blog-section-heading"><div><div className="eyebrow">START HERE</div><h2>Featured field guide</h2></div><span>01 / {String(blogPosts.length).padStart(2,'0')}</span></div>
      <article className="blog-featured-card">
        <div className="blog-featured-art" aria-hidden="true"><div className="blog-art-browser"><div className="blog-art-browser-top"><i /><i /><i /><span>PAGE REVIEW</span></div><div className="blog-art-product"><div className="blog-art-image"><span>PRODUCT</span><i /></div><div className="blog-art-lines"><b /><i /><i /><i /><span /></div></div><div className="blog-art-evidence"><span>OBSERVED EVIDENCE</span><b /><i /><i /></div></div><div className="blog-art-orbit blog-art-orbit-one" /><div className="blog-art-orbit blog-art-orbit-two" /></div>
        <div className="blog-featured-copy"><div className="blog-card-meta"><span className="blog-category">{featured.category}</span><span>{featured.readTime}</span></div><h3><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h3><p>{featured.description}</p><div className="blog-card-bottom"><span>{dateLabel(featured.publishedAt)}</span><Link className="blog-read-link" href={`/blog/${featured.slug}`}>Read field guide <span aria-hidden="true">↗</span></Link></div></div>
      </article>

      <div className="blog-section-heading blog-all-heading"><div><div className="eyebrow">THE FIELD NOTES</div><h2>Useful ideas. Clear next steps.</h2></div><span>{String(blogPosts.length).padStart(2,'0')} ARTICLES</span></div>
      <div className="blog-card-grid">{articles.map((post,index)=><article key={post.slug} className="blog-card"><div className={`blog-card-art blog-card-art-${index+2}`} aria-hidden="true"><span className="blog-art-number">0{index+2}</span><div className="blog-art-lines"><i /><i /><i /></div><div className="blog-art-signal">{index===0?'MESSAGE MATCH':'FIX PRIORITY'}<b>↗</b></div></div><div className="blog-card-body"><div className="blog-card-meta"><span className="blog-category">{post.category}</span><span>{post.readTime}</span></div><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.description}</p><div className="blog-card-bottom"><span>{dateLabel(post.publishedAt)}</span><Link className="blog-read-link" href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>Read article <span aria-hidden="true">↗</span></Link></div></div></article>)}</div>
    </section>

    <section className="blog-cta"><div><div className="eyebrow eyebrow-light">FROM INSIGHT TO ACTION</div><h2>Move from “something feels off”<br />to a fix you can verify.</h2><p>Inspect a public page, review the evidence behind the findings and make your next improvement with a clearer plan.</p></div><Link href="/auth" className="button button-light">Start an audit <span aria-hidden="true">↗</span></Link></section>

    <footer className="site-footer"><Link href="/" className="brand brand-footer">PageFix<span>AI</span></Link><p>Evidence-led website diagnostics. Clear limits. Practical fixes.</p><div><Link href="/blog">Blog</Link><Link href="/resources">Resources</Link><Link href="/compare">Compare tools</Link><Link href="/pricing">Pricing</Link><Link href="/partners/affiliate">Affiliate program</Link><Link href="/methodology">Evidence standard</Link><Link href="/privacy">Privacy</Link></div><small>© {new Date().getFullYear()} PageFix AI. Audit findings describe observable evidence and do not guarantee commercial outcomes.</small></footer>
  </main>;
}
