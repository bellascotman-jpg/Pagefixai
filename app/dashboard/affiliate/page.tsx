import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import AffiliateProgramPage from '@/app/partners/affiliate/page';

export const dynamic = 'force-dynamic';

export default async function WorkspaceAffiliatePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login&next=/dashboard/affiliate');
  return <AffiliateProgramPage />;
}
