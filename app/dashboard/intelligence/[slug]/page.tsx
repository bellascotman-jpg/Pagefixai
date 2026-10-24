import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { getFeatureSpecification } from '@/lib/intelligence/feature-specifications';
import FeatureAnalysisWorkspace from '@/components/feature-analysis-workspace';

const slugs: Record<string, string> = {\n  'intelligence-hub':'intelligence-hub','competitor-comparison':'competitor-comparison','store-intelligence':'store-intelligence',
  'buyer-decisions':'buyer-decisions','clarity-scorecard':'clarity-scorecard','return-risk':'prepurchase-return-risk','prepurchase-return-risk':'prepurchase-return-risk','visual-inspection':'visual-mobile-inspection','visual-mobile-inspection':'visual-mobile-inspection','seo-data':'seo-product-data','seo-product-data':'seo-product-data','ai-search-readiness':'ai-search-readiness','store':'store-intelligence','store-intelligence':'store-intelligence','copy-fixes':'grounded-copy-fixes','grounded-copy-fixes':'grounded-copy-fixes','impact':'impact-analysis','impact-analysis':'impact-analysis','journey':'journey-message-match','journey-message-match':'journey-message-match','claims':'claims-promises','claims-promises':'claims-promises','promise-ledger':'promise-ledger','retention':'retention-onboarding','retention-onboarding':'retention-onboarding','experiments':'experimentation','experimentation':'experimentation','ab-testing':'ab-testing','verification':'verification-history','verification-history':'verification-history','governance':'evidence-governance','evidence-governance':'evidence-governance','assistant':'pagefix-assistant','pagefix-assistant':'pagefix-assistant','ads-creative-studio':'ads-creative-studio'
};

export default async function FeatureWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const { slug } = await params;
  const featureId = slugs[slug];
  const spec = featureId ? getFeatureSpecification(featureId) : null;
  if (!spec) notFound();
  const audits = await db.audit.findMany({ where: { userId: user.id, status: 'COMPLETED' }, orderBy: { completedAt: 'desc' }, take: 30, select: { id: true, url: true, completedAt: true, createdAt: true } });
  return <main className="dashboard"><header className="topbar"><div><div className="label">{spec.section.replace('_',' ')} / PAGEFIX AI</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>{spec.name}</h1></div><Link className="button button-secondary" href="/dashboard/intelligence">All features</Link></header><div className="container dashboard-main"><FeatureAnalysisWorkspace featureId={spec.id} audits={audits.map(a => ({...a, completedAt:a.completedAt?.toISOString() ?? null, createdAt:a.createdAt.toISOString()}))} /></div></main>;
}
