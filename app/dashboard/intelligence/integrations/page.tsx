'use client';

import Link from 'next/link';
import StoreProductFixEditor from '@/components/store-product-fix-editor';
import { useCallback, useEffect, useState, type FormEvent, type CSSProperties } from 'react';

type ProductAttention = { id: string; title: string; status: string | null; price: string | number | null; inventoryQuantity: number | null; imageUrl: string | null; descriptionHtml: string | null; url: string | null };
type MetaCampaign = { id?: string; name?: string; status?: string; objective?: string; insights?: { data?: Array<{ impressions?: string; clicks?: string; spend?: string; ctr?: string }> }; campaignError?: string };
type MetaAccount = { id?: string; name?: string; currency?: string; account_status?: number; campaigns?: MetaCampaign[] };
type GoogleCustomer = { customerId: string; rows?: Array<{ results?: Array<{ customer?: { descriptiveName?: string }; campaign?: { name?: string; status?: string }; metrics?: { impressions?: string; clicks?: string; costMicros?: string; conversions?: string } }> }>; error?: string };
type MarketingData = { metaAds?: { accounts?: MetaAccount[] }; googleAds?: { setupRequired?: boolean; customers?: GoogleCustomer[] }; analytics?: Array<{ name?: string; propertySummaries?: Array<{ displayName?: string; property?: string }> }>; searchConsole?: Array<{ siteUrl?: string; permissionLevel?: string }>; errors?: string[] };
type MarketingConnection = { id: string; provider: string; externalAccountId: string | null; accountName: string | null; scopes: unknown; status: string; expiresAt: string | null; lastSyncedAt: string | null; lastError: string | null };
type Integration = {
  id: string; platform: 'SHOPIFY' | 'WOOCOMMERCE'; shopDomain: string; status: string;
  webhookStatus: string; webhookLastError: string | null; lastSyncedAt: string | null; lastWebhookAt: string | null;
  lastError: string | null; store: { id: string; name: string; url: string };
  _count: { products: number; syncRuns: number };
  monitoring: { sampledProducts: number; missingDescription: number; missingImage: number; missingPrice: number; outOfStock: number; missingProductUrl: number };
  productsNeedingAttention: ProductAttention[];
};

export default function StoreIntegrationsPage() {
  const [platform, setPlatform] = useState<'SHOPIFY' | 'WOOCOMMERCE'>('SHOPIFY');
  const [storeUrl, setStoreUrl] = useState('');
  const [projectName, setProjectName] = useState('My Store');
  const [accessToken, setAccessToken] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [marketingConnections, setMarketingConnections] = useState<MarketingConnection[]>([]);
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [syncingMarketing, setSyncingMarketing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/stores', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load connected stores.');
      setIntegrations(data.integrations || []);
      const marketingResponse = await fetch('/api/integrations/marketing', { cache: 'no-store' });
      const marketingData = await marketingResponse.json();
      if (!marketingResponse.ok) throw new Error(marketingData.message || 'Could not load marketing connections.');
      setMarketingConnections(marketingData.connections || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load connected stores.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('oauth_connected');
    const oauthError = params.get('oauth_error');
    if (connected) setNotice(connected === 'meta_ads' ? 'Meta authorization completed. Ad-account sync and campaign actions still depend on Meta app permissions and review.' : 'Google authorization completed. Ads reporting requires a valid Google Ads developer token and accessible customer accounts.');
    if (oauthError) setError(oauthError);
    if (connected || oauthError) {
      params.delete('oauth_connected'); params.delete('oauth_error');
      const query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? '?' + query : ''));
      if (connected) void load();
    }
  }, [load]);

  async function syncMarketingData() {
    setSyncingMarketing(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/integrations/marketing/data', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not retrieve marketing data.');
      setMarketingData(data.data as MarketingData);
      const count = (data.data?.metaAds?.accounts?.length || 0) + (data.data?.googleAds?.customers?.length || 0);
      setNotice('Marketing data refreshed. ' + count + ' advertising account/customer record(s) returned by connected providers.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not retrieve marketing data.'); }
    finally { setSyncingMarketing(false); }
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(''); setNotice('');
    try {
      const payload = { platform, storeUrl, projectName, webhookSecret, ...(platform === 'SHOPIFY' ? { accessToken } : { consumerKey, consumerSecret }) };
      const response = await fetch('/api/integrations/stores', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Connection failed.');
      setNotice(data.webhookWarning
        ? `Store connected and initial catalogue sync completed. Automatic webhook registration needs attention (${data.webhookWarning}); scheduled sync remains available.`
        : `Store connected. ${data.sync.productsSeen} products imported and webhook subscriptions registered.`);
      setStoreUrl(''); setAccessToken(''); setConsumerKey(''); setConsumerSecret(''); setWebhookSecret('');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); }
    finally { setSubmitting(false); }
  }

  async function sync(id: string) {
    setBusyId(id); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/integrations/stores/${id}/sync`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Sync failed.');
      setNotice(`Sync completed: ${data.sync.productsSeen} products checked; ${data.sync.productsChanged} changed records detected.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Sync failed.'); }
    finally { setBusyId(''); }
  }

  async function disconnect(id: string, domain: string) {
    if (!window.confirm(`Disconnect ${domain}? Stored catalogue data remains available, but monitoring stops until reconnected.`)) return;
    setBusyId(id); setError(''); setNotice('');
    try {
      const response = await fetch('/api/integrations/stores', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ integrationId: id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not disconnect store.');
      setNotice(`${domain} disconnected.`); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not disconnect store.'); }
    finally { setBusyId(''); }
  }

  const fieldStyle: CSSProperties = { display: 'grid', gap: 7, fontSize: 13, fontWeight: 700 };
  const inputStyle: CSSProperties = { width: '100%', minHeight: 44, border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', background: '#fff', color: 'var(--ink)' };

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">WORKSPACES & DATA / INTEGRATIONS</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Store integrations</h1></div><Link href="/dashboard" className="button button-secondary">← Workspace</Link></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850}}>Connect a store once. PageFix imports your catalogue, monitors product-data quality, receives product-change webhooks where provider permissions allow, and refreshes data through scheduled syncs. You no longer need to submit every product URL individually.</p>
      <div className="grid grid-3" style={{margin:'22px 0'}}>
        <div className="card"><div className="label">Connected stores</div><div className="stat">{integrations.filter(i=>i.status==='CONNECTED').length}</div></div>
        <div className="card"><div className="label">Imported catalogue products</div><div className="stat">{integrations.reduce((n,i)=>n+i._count.products,0)}</div></div>
        <div className="card"><div className="label">Webhook subscriptions</div><div className="stat">{integrations.filter(i=>i.webhookStatus==='REGISTERED').length} / {integrations.length}</div></div>
      </div>

      {notice && <div className="card" role="status" style={{borderColor:'#b8ded7',marginBottom:16}}>{notice}</div>}
      {error && <div className="error-box" role="alert" style={{marginBottom:16}}>{error}</div>}

      <section className="card" style={{marginBottom:22}}>
        <div className="store-section-heading"><div><div className="label">CONNECTED MARKETING DATA</div><h2>Campaign & analytics snapshot</h2></div><button type="button" className="button button-primary" onClick={()=>void syncMarketingData()} disabled={syncingMarketing||marketingConnections.length===0}>{syncingMarketing?'Fetching provider data…':'Sync marketing data'}</button></div>
        {!marketingConnections.length ? <p className="muted">Connect Meta Ads or Google Marketing above to fetch live account and analytics data. No sample metrics are shown.</p> : <p className="muted" style={{fontSize:12}}>Data is fetched from provider APIs on request. Numbers below are provider-returned values, not estimates generated by PageFix.</p>}
        {marketingData && <div style={{display:'grid',gap:16,marginTop:16}}>
          {(marketingData.errors||[]).map((message,index)=><div className="error-box" key={index}>{message}</div>)}
          {marketingData.googleAds?.setupRequired && <div className="error-box">Google account is authorized, but campaign reporting needs GOOGLE_ADS_DEVELOPER_TOKEN. Add it to the server environment to query Ads accounts.</div>}
          {(marketingData.metaAds?.accounts||[]).map(account=><article className="finding" key={account.id}>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><strong>{account.name||account.id||'Meta ad account'}</strong><p className="muted" style={{fontSize:12,margin:'3px 0'}}>Account {account.id} · Currency {account.currency||'not returned'} · Status {account.account_status??'unknown'}</p></div><span className="badge">{(account.campaigns||[]).length} campaigns</span></div>
            {(account.campaigns||[]).slice(0,8).map(campaign=>{const insight=campaign.insights?.data?.[0];return <div key={campaign.id} style={{padding:'10px 0',borderTop:'1px solid var(--line)',marginTop:8}}><strong style={{fontSize:13}}>{campaign.name||campaign.id}</strong><p className="muted" style={{fontSize:12,margin:'3px 0'}}>{campaign.status||'Status unavailable'} · {campaign.objective||'Objective unavailable'}</p>{insight?<p style={{fontSize:12,margin:0}}>Impressions: {insight.impressions||'—'} · Clicks: {insight.clicks||'—'} · Spend: {insight.spend||'—'} {account.currency||''} · CTR: {insight.ctr||'—'}%</p>:<p className="muted" style={{fontSize:12,margin:0}}>No insight row returned for this campaign.</p>}</div>})}
          </article>)}
          {(marketingData.googleAds?.customers||[]).map(customer=><article className="finding" key={customer.customerId}><strong>Google Ads customer {customer.customerId}</strong>{customer.error&&<p className="error-box">{customer.error}</p>}{(customer.rows||[]).flatMap(chunk=>chunk.results||[]).slice(0,8).map((row,index)=><div key={row.campaign?.name||index} style={{padding:'9px 0',borderTop:'1px solid var(--line)',marginTop:8}}><strong style={{fontSize:13}}>{row.campaign?.name||'Campaign'}</strong><p className="muted" style={{fontSize:12,margin:'3px 0'}}>Impressions: {row.metrics?.impressions||'—'} · Clicks: {row.metrics?.clicks||'—'} · Cost: {row.metrics?.costMicros? (Number(row.metrics.costMicros)/1000000).toFixed(2):'—'} · Conversions: {row.metrics?.conversions||'—'}</p></div>)}</article>)}
          {(marketingData.analytics||[]).flatMap(account=>account.propertySummaries||[]).map(property=><div className="finding" key={property.property}><strong>GA4 · {property.displayName||property.property}</strong><p className="muted" style={{fontSize:12,margin:'3px 0'}}>{property.property}</p></div>)}
          {(marketingData.searchConsole||[]).map(site=><div className="finding" key={site.siteUrl}><strong>Search Console · {site.siteUrl}</strong><p className="muted" style={{fontSize:12,margin:'3px 0'}}>Permission: {site.permissionLevel||'unknown'}</p></div>)}
          {!marketingData.metaAds?.accounts?.length&&!marketingData.googleAds?.customers?.length&&!marketingData.analytics?.length&&!marketingData.searchConsole?.length&&!(marketingData.errors||[]).length&&<p className="muted">The provider returned no account or property records. Check account permissions and try again.</p>}
        </div>}
      </section>

      <section className="card">
        <div className="label">CONNECT A PLATFORM</div><h2 style={{marginTop:5}}>Connect your commerce store</h2>
        <p className="muted">Credentials are encrypted server-side and never returned to the browser. Use API credentials created in the official store admin.</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'18px 0'}}>
          <button type="button" className={platform==='SHOPIFY'?'button button-primary':'button button-secondary'} onClick={()=>setPlatform('SHOPIFY')}>Shopify</button>
          <button type="button" className={platform==='WOOCOMMERCE'?'button button-primary':'button button-secondary'} onClick={()=>setPlatform('WOOCOMMERCE')}>WooCommerce</button>
        </div>
        <form onSubmit={connect} style={{display:'grid',gap:15,maxWidth:760}}>
          <label style={fieldStyle}>Store URL<input required type="url" value={storeUrl} onChange={e=>setStoreUrl(e.target.value)} placeholder={platform==='SHOPIFY'?'https://your-store.myshopify.com':'https://yourstore.com'} style={inputStyle}/></label>
          <label style={fieldStyle}>PageFix project name<input required minLength={2} maxLength={100} value={projectName} onChange={e=>setProjectName(e.target.value)} style={inputStyle}/></label>
          {platform==='SHOPIFY' ? <>
            <label style={fieldStyle}>Shopify Admin API access token<input required type="password" autoComplete="new-password" value={accessToken} onChange={e=>setAccessToken(e.target.value)} placeholder="shpat_…" style={inputStyle}/></label>
            <p className="muted" style={{fontSize:12,margin:0}}>Create a Shopify custom app with product read access and webhook write access. Add write_products only if you want PageFix to apply approved title/description updates. For webhook verification, use the app client secret below.</p>
          </> : <>
            <label style={fieldStyle}>WooCommerce consumer key<input required type="password" autoComplete="new-password" value={consumerKey} onChange={e=>setConsumerKey(e.target.value)} placeholder="ck_…" style={inputStyle}/></label>
            <label style={fieldStyle}>WooCommerce consumer secret<input required type="password" autoComplete="new-password" value={consumerSecret} onChange={e=>setConsumerSecret(e.target.value)} placeholder="cs_…" style={inputStyle}/></label>
            <p className="muted" style={{fontSize:12,margin:0}}>The API key needs read/write access to register product webhooks. PageFix does not place orders or touch payment data.</p>
          </>}
          <label style={fieldStyle}>{platform==='SHOPIFY'?'Shopify app client secret (webhook signing secret)':'Webhook signing secret'}<input required type="password" autoComplete="new-password" minLength={8} value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} style={inputStyle}/></label>
          <button className="button button-primary" type="submit" disabled={submitting}>{submitting?'Verifying credentials and importing products…':'Verify & connect store'}</button>
        </form>
      </section>

      <section style={{marginTop:24}}>
        <div className="store-section-heading"><div><div className="label">STORE MONITORING</div><h2>Connected stores</h2></div><button type="button" className="button button-secondary" onClick={()=>void load()} disabled={loading}>Refresh</button></div>
        {loading ? <div className="card muted">Loading store connections…</div> : integrations.length===0 ? <div className="card"><h3>No stores connected yet</h3><p className="muted">Connect Shopify or WooCommerce above to import your product catalogue and start monitoring store-wide product data.</p></div> : <div style={{display:'grid',gap:14}}>
          {integrations.map(item=><article className="card" key={item.id}>
            <div style={{display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap',alignItems:'flex-start'}}>
              <div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span className="badge">{item.platform==='SHOPIFY'?'Shopify':'WooCommerce'}</span><span className="badge">{item.status}</span><span className="badge">{item.webhookStatus==='REGISTERED'?'Webhooks registered':item.webhookStatus}</span></div><h3 style={{margin:'12px 0 3px'}}>{item.store.name}</h3><a href={item.store.url} target="_blank" rel="noreferrer" className="muted">{item.shopDomain} ↗</a></div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="button button-primary" type="button" disabled={busyId===item.id||item.status==='DISCONNECTED'} onClick={()=>void sync(item.id)}>{busyId===item.id?'Working…':'Sync now'}</button><button className="button button-secondary" type="button" disabled={busyId===item.id||item.status==='DISCONNECTED'} onClick={()=>void disconnect(item.id,item.shopDomain)}>Disconnect</button></div>
            </div>
            <div className="grid grid-3" style={{marginTop:18}}>
              <div><div className="label">Catalogue products</div><div className="stat">{item._count.products}</div></div>
              <div><div className="label">Missing descriptions</div><div className="stat">{item.monitoring.missingDescription}</div></div>
              <div><div className="label">Missing images</div><div className="stat">{item.monitoring.missingImage}</div></div>
              <div><div className="label">Missing prices</div><div className="stat">{item.monitoring.missingPrice}</div></div>
              <div><div className="label">Out of stock</div><div className="stat">{item.monitoring.outOfStock}</div></div>
              <div><div className="label">Sync runs</div><div className="stat">{item._count.syncRuns}</div></div>
            </div>
            {item.productsNeedingAttention.length > 0 && <section style={{marginTop:18,borderTop:'1px solid var(--line)',paddingTop:15}}>
              <div className="label">PRODUCT QUALITY REVIEW · UP TO 20 PRODUCTS</div>
              <p className="muted" style={{fontSize:12}}>Review product content before applying any live store changes. Approved changes are recorded with before/after values.</p>
              <div style={{display:'grid',gap:12}}>{item.productsNeedingAttention.map(product => <StoreProductFixEditor key={product.id} integrationId={item.id} product={product} onApplied={() => { setNotice('Product updated and change history recorded.'); void load(); }} />)}</div>
            </section>}
            <p className="muted" style={{fontSize:12,marginBottom:0}}>Last API sync: {item.lastSyncedAt?new Date(item.lastSyncedAt).toLocaleString():'Not synced'} · Last webhook: {item.lastWebhookAt?new Date(item.lastWebhookAt).toLocaleString():'None received yet'}</p>
            {item.lastError&&<p className="error-box" style={{marginTop:12,marginBottom:0}}>Last sync error: {item.lastError}</p>}
            {item.webhookLastError&&<p className="error-box" style={{marginTop:12,marginBottom:0}}>Webhook setup needs attention: {item.webhookLastError}</p>}
          </article>)}
        </div>}
      </section>
      <section className="card" style={{marginTop:24}}>
        <div className="label">AUTOMATION SAFETY</div><h2>Monitor automatically. Apply fixes with control.</h2>
        <p className="muted">Catalog sync and product-change webhooks update the store catalogue in PageFix automatically. This first integration release identifies missing descriptions/images/prices and stock issues. It does not silently rewrite live product content or change prices; write operations need an explicit approval and an auditable before/after record. Ads and Meta integrations are the next phase after store sync is verified.</p>
      </section>
    </div>
  </main>;
}
