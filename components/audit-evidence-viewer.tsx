import React from 'react';

type Evidence = {
  type: string;
  source: string;
  location?: string | null;
  content: string;
};

type CapturedImage = { src: string; alt?: string; width?: number; height?: number };
type CapturedLink = { text?: string; href: string };

function parseJson(value: string): unknown {
  try { return JSON.parse(value); } catch { return null; }
}

function safeHttpUrl(value: string, baseUrl?: string): string | null {
  try {
    const url = baseUrl ? new URL(value, baseUrl) : new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function shortUrlLabel(value: string): string {
  try {
    const url = new URL(value);
    const path = url.pathname === '/' ? '' : url.pathname;
    return (url.hostname + path + url.search).slice(0, 78) + (url.hostname.length + path.length + url.search.length > 78 ? '…' : '');
  } catch {
    return value.slice(0, 78) + (value.length > 78 ? '…' : '');
  }
}

function isImageInventory(value: unknown): value is { totalVisible?: number; imagesWithoutAlt?: number; images?: CapturedImage[] } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as { images?: unknown }).images));
}

function isLinkInventory(value: unknown): value is CapturedLink[] {
  return Array.isArray(value) && value.every(item => item && typeof item === 'object' && typeof item.href === 'string');
}

export default function AuditEvidenceViewer({ evidence, baseUrl }: { evidence: Evidence; baseUrl?: string }) {
  const parsed = parseJson(evidence.content);
  const source = evidence.source.toLowerCase();
  const location = (evidence.location ?? '').toLowerCase();

  if ((source.includes('image_inventory') || location === 'images') && isImageInventory(parsed)) {
    const images = (parsed.images ?? []).filter(image => typeof image.src === 'string' && image.src.trim()).slice(0, 24);
    return <div className="audit-evidence-viewer">
      <div className="audit-evidence-summary">
        <strong>{parsed.totalVisible ?? images.length} captured image element{(parsed.totalVisible ?? images.length) === 1 ? '' : 's'}</strong>
        <span>{parsed.imagesWithoutAlt ?? images.filter(image => !image.alt?.trim()).length} without alt text</span>
      </div>
      {images.length ? <div className="audit-image-grid">
        {images.map((image, index) => {
          const src = safeHttpUrl(image.src, baseUrl);
          return <article className="audit-image-card" key={image.src + index}>
            {src ? <a href={src} target="_blank" rel="noreferrer noopener" className="audit-image-preview-link" aria-label={'Open captured image ' + (image.alt || index + 1)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={image.alt?.trim() || 'Page image with no alternative text'} loading="lazy" referrerPolicy="no-referrer" />
            </a> : <div className="audit-image-unavailable">Preview unavailable</div>}
            <div className="audit-image-caption">
              <strong>{image.alt?.trim() || 'No alt text'}</strong>
              <span>{image.width || '?'} × {image.height || '?'}</span>
              {src && <a href={src} target="_blank" rel="noreferrer noopener">Open original image ↗</a>}
            </div>
          </article>;
        })}
      </div> : <p className="muted">Image elements were recorded, but no usable image URLs were available for previews.</p>}
      {(parsed.totalVisible ?? images.length) > images.length && <p className="muted">Showing the first {images.length} images to keep the report responsive.</p>}
    </div>;
  }

  if ((source.includes('link_inventory') || evidence.type === 'LINK' || location.includes('links')) && isLinkInventory(parsed)) {
    const links = parsed.slice(0, 16);
    return <div className="audit-evidence-viewer">
      <div className="audit-evidence-summary"><strong>{parsed.length} captured link{parsed.length === 1 ? '' : 's'}</strong><span>First {links.length} shown</span></div>
      <ul className="audit-link-list">
        {links.map((link, index) => {
          const href = safeHttpUrl(link.href, baseUrl);
          return <li key={link.href + index}>
            <div className="audit-link-copy">
              <strong>{link.text?.trim() || 'Unlabelled link'}</strong>
              <span title={link.href}>{shortUrlLabel(href ?? link.href)}</span>
            </div>
            {href ? <a href={href} target="_blank" rel="noreferrer noopener">Open ↗</a> : <span className="muted">Unsafe or unsupported URL</span>}
          </li>;
        })}
      </ul>
      {parsed.length > links.length && <p className="muted">Showing {links.length} of {parsed.length} links. The raw inventory is intentionally not printed as one long JSON string.</p>}
    </div>;
  }

  if (source.includes('viewport_signals') && Array.isArray(parsed)) {
    return <div className="audit-evidence-viewer">
      <div className="audit-evidence-summary"><strong>Viewport measurements</strong><span>Observed browser signals</span></div>
      <div className="audit-viewport-grid">
        {parsed.map((item, index) => {
          if (!item || typeof item !== 'object') return null;
          const signal = item as Record<string, unknown>;
          return <article className="audit-viewport-card" key={String(signal.viewport ?? index)}>
            <strong>{String(signal.viewport ?? 'Viewport')}</strong>
            <span>Viewport width: {String(signal.viewportWidth ?? 'Not recorded')} px</span>
            <span>Document width: {String(signal.documentWidth ?? 'Not recorded')} px</span>
            <span>Horizontal overflow: {signal.horizontalOverflow === true ? 'Detected' : signal.horizontalOverflow === false ? 'Not detected' : 'Unknown'}</span>
            <span>Primary heading visible: {signal.primaryHeadingVisible === true ? 'Yes' : signal.primaryHeadingVisible === false ? 'No' : 'Unknown'}</span>
            <span>Commercial action visible: {signal.commercialActionVisible === true ? 'Yes' : signal.commercialActionVisible === false ? 'No' : 'Unknown'}</span>
          </article>;
        })}
      </div>
    </div>;
  }

  if (evidence.type === 'METADATA' && parsed && typeof parsed === 'object') {
    const metadata = parsed as Record<string, unknown>;
    const rows = [
      ['HTTP status', metadata.statusCode],
      ['Page title', metadata.title],
      ['Title length', metadata.titleLength],
      ['Meta description', metadata.description],
      ['Canonical URL', metadata.canonical],
      ['Viewport meta', metadata.viewport],
    ].filter(([, value]) => value !== undefined && value !== null && value !== '');
    return <div className="audit-evidence-viewer"><dl className="audit-evidence-fields">
      {rows.map(([label, value]) => <div key={String(label)}><dt>{String(label)}</dt><dd>{String(value)}</dd></div>)}
    </dl></div>;
  }

  if (evidence.type === 'DOM' && parsed && typeof parsed === 'object') {
    const dom = parsed as Record<string, unknown>;
    const headings = Array.isArray(dom.headings) ? dom.headings as Array<{ tag?: string; text?: string }> : [];
    const buttons = Array.isArray(dom.buttons) ? dom.buttons.filter((item): item is string => typeof item === 'string') : [];
    return <div className="audit-evidence-viewer">
      <div className="audit-evidence-summary"><strong>{headings.length} headings · {buttons.length} buttons</strong><span>{String(dom.forms ?? 0)} forms</span></div>
      {headings.length > 0 && <div className="audit-evidence-list"><strong>Headings captured</strong>{headings.slice(0, 12).map((heading, index) => <p key={index}><span className="badge">{heading.tag ?? 'Heading'}</span> {heading.text ?? 'No heading text'}</p>)}</div>}
      {buttons.length > 0 && <div className="audit-evidence-list"><strong>Button labels</strong><p>{buttons.slice(0, 16).join(' · ')}</p></div>}
    </div>;
  }

  if (evidence.type === 'STRUCTURED_DATA' && Array.isArray(parsed)) {
    return <div className="audit-evidence-viewer">
      <div className="audit-evidence-summary"><strong>{parsed.length} structured-data script{parsed.length === 1 ? '' : 's'}</strong><span>JSON parse status</span></div>
      {parsed.slice(0, 8).map((script, index) => {
        let valid = false;
        let kind = 'Unknown type';
        if (typeof script === 'string') {
          try {
            const object = JSON.parse(script) as Record<string, unknown>;
            valid = true;
            kind = String(object['@type'] ?? (Array.isArray(object['@graph']) ? '@graph' : 'JSON-LD'));
          } catch { valid = false; }
        }
        return <div className="audit-structured-row" key={index}><span className={'audit-parse-state ' + (valid ? 'is-valid' : 'is-invalid')}>{valid ? 'Valid JSON' : 'Invalid JSON'}</span><strong>{kind}</strong></div>;
      })}
      {parsed.length > 8 && <p className="muted">Additional structured-data scripts omitted from this summary.</p>}
    </div>;
  }

  if (typeof parsed === 'string') {
    return <p className="audit-evidence-text">{parsed.slice(0, 1000)}{parsed.length > 1000 ? '…' : ''}</p>;
  }

  return <pre className="audit-evidence-fallback">{evidence.content.slice(0, 1200)}{evidence.content.length > 1200 ? '…' : ''}</pre>;
}
