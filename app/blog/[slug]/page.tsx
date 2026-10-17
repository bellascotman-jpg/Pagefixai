import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, getBlogPost } from '@/lib/blog-posts';

const siteUrl = process.env.APP_URL || 'https://pagefixai.vercel.app';
const dateLabel = (date: string) => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Article not found' };
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title: post.title, description: post.description, publishedTime: new Date(post.publishedAt).toISOString(), siteName: 'PageFix AI' },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const related = blogPosts.filter((item) => item.slug !== post.slug);
  const canonical = new URL(`/blog/${post.slug}`, siteUrl).toString();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(post.publishedAt).toISOString(),
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'PageFix AI Editorial Team', url: siteUrl },
    publisher: { '@type': 'Organization', name: 'PageFix AI', url: siteUrl },
    articleSection: post.category,
    inLanguage: 'en',
  };
  return <main className="marketing editorial-page blog-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <header className="site-nav"><Link href="/" className="brand" aria-label="PageFix AI home">PageFix<span>AI</span></Link><nav className="nav-links" aria-label="Article navigation"><Link href="/blog">All articles</Link><Link href="/resources">Guides</Link><Link href="/pricing">Pricing</Link></nav><div className="nav-actions"><Link href="/auth" className="button button-primary button-small">Start an audit ↗</Link></div></header>
    <div className="blog-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span><span>{post.category}</span></div>
    <article className="blog-article">
      <header className="blog-article-header"><div className="blog-card-meta"><span className="blog-category">{post.category}</span><span>{post.readTime}</span><span>{dateLabel(post.publishedAt)}</span></div><h1>{post.title}</h1><p className="blog-article-intro">{post.intro}</p><div className="blog-author"><span className="blog-author-mark">P<span>F</span></span><div><strong>PageFix AI Editorial Team</strong><span>Evidence-led website optimization</span></div></div></header>
      <div className="blog-article-layout"><aside className="blog-article-aside"><span>IN THIS ARTICLE</span><ol>{post.sections.map((section,index)=><li key={section.heading}><a href={`#section-${index+1}`}>{section.heading}</a></li>)}</ol><div className="blog-aside-note">Keep the evidence visible. Treat unknowns as unknowns.</div></aside><div className="blog-article-content">
        {post.sections.map((section,index)=><section id={`section-${index+1}`} key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph)=> <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet)=><li key={bullet}>{bullet}</li>)}</ul>}</section>)}
        <div className="blog-takeaway"><span>THE TAKEAWAY</span><p>{post.takeaway}</p></div>
        <div className="blog-article-end"><span>KEEP GOING</span><Link href="/methodology">Read the PageFix evidence standard ↗</Link><Link href="/resources">Explore practical guides ↗</Link></div>
      </div></div>
    </article>
    <section className="blog-related"><div className="blog-section-heading"><div><div className="eyebrow">CONTINUE READING</div><h2>More from the field notes</h2></div><Link href="/blog" className="blog-read-link">All articles ↗</Link></div><div className="blog-card-grid">{related.map((item,index)=><article key={item.slug} className="blog-card"><div className={`blog-card-art blog-card-art-${index+2}`} aria-hidden="true"><span className="blog-art-number">0{index+2}</span><div className="blog-art-lines"><i /><i /><i /></div></div><div className="blog-card-body"><div className="blog-card-meta"><span className="blog-category">{item.category}</span><span>{item.readTime}</span></div><h3><Link href={`/blog/${item.slug}`}>{item.title}</Link></h3><p>{item.description}</p><div className="blog-card-bottom"><span>{dateLabel(item.publishedAt)}</span><Link className="blog-read-link" href={`/blog/${item.slug}`}>Read article ↗</Link></div></div></article>)}</div></section>
    <section className="blog-cta"><div><div className="eyebrow eyebrow-light">PUT THE METHOD TO WORK</div><h2>Inspect. Fix. Verify.</h2><p>Bring evidence and a clear next step to your next website improvement.</p></div><Link href="/auth" className="button button-light">Start an audit ↗</Link></section>
    <footer className="site-footer"><Link href="/" className="brand brand-footer">PageFix<span>AI</span></Link><div><Link href="/blog">Blog</Link><Link href="/resources">Resources</Link><Link href="/compare">Compare tools</Link><Link href="/pricing">Pricing</Link><Link href="/methodology">Evidence standard</Link></div><small>© {new Date().getFullYear()} PageFix AI.</small></footer>
  </main>;
}
