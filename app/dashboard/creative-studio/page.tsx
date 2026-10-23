import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import CreativeStudio from '@/components/creative-studio';

export const dynamic = 'force-dynamic';

export default async function CreativeStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audits = await db.audit.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 20,
    select: { id: true, url: true, completedAt: true },
  });
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / CREATIVE STUDIO</div><h1 style={{ fontSize: 26, margin: '4px 0 0' }}>Creative Studio</h1></div></header>
    <CreativeStudio audits={audits.map(a => ({ id: a.id, url: a.url, completedAt: a.completedAt?.toISOString() ?? null }))} />
  </main>;
}
