import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import ReferralDashboardPage from '@/app/referrals/page';

export const dynamic = 'force-dynamic';

export default async function WorkspaceReferralsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login&next=/dashboard/referrals');
  return <ReferralDashboardPage />;
}
