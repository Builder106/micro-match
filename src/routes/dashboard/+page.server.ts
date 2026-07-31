import type { PageServerLoad } from './$types';
import { getTasks, getClaims } from '$lib/server/appwrite';
import type { Task, Claim } from '$lib/types';

type EnrichedClaim = Claim & { task?: { id: string; title: string; estimatedMinutes?: number } };

function enrichClaims(claims: Claim[], tasks: Task[]): EnrichedClaim[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  return claims.map(c => {
    const t = taskMap.get(c.taskId);
    return t
      ? { ...c, task: { id: t.id, title: t.title, estimatedMinutes: t.estimatedMinutes } }
      : c;
  });
}

export const load: PageServerLoad = async ({ locals }) => {
  const userRole = locals.userRole ?? 'anonymous';
  const session = locals.session;
  const user = session?.user?.id ? { id: session.user.id, email: session.user.email ?? undefined } : null;

  if (userRole === 'ngo' && user) {
    const allTasks = await getTasks({ orgId: user.id, includeInactive: true });
    const myTasks = allTasks.filter(t => t.orgId === user.id);

    const allClaims = await getClaims();
    const myTaskIds = new Set(myTasks.map(t => t.id));
    const myTaskClaims = enrichClaims(
      allClaims.filter((c: Claim) => myTaskIds.has(c.taskId)),
      myTasks
    );

    const pendingReviews = myTaskClaims.filter(c => c.status === 'pending');
    const approvedClaims = myTaskClaims.filter(c => c.status === 'approved');

    const totalHours = approvedClaims.reduce((total, claim) => {
      return total + ((claim.task?.estimatedMinutes ?? 30) / 60);
    }, 0);

    return {
      signedIn: true,
      userRole,
      user,
      userData: {
        myTasks,
        pendingReviews,
        totalTasks: myTasks.length,
        pendingReviewsCount: pendingReviews.length,
        approvedClaimsCount: approvedClaims.length,
        totalHours: Math.round(totalHours * 10) / 10,
        myClaims: myTaskClaims
      }
    };
  } else if (userRole === 'volunteer' && user) {
    const allTasks = await getTasks();
    const allClaims = await getClaims({ userId: user.id });
    const myClaims = enrichClaims(
      allClaims.filter((c: Claim) => c.userId === user.id),
      allTasks
    );
    const approvedClaims = myClaims.filter(c => c.status === 'approved');

    const totalHours = approvedClaims.reduce((total, claim) => {
      return total + ((claim.task?.estimatedMinutes ?? 30) / 60);
    }, 0);

    // Recommendations: shortest active tasks the volunteer hasn't already claimed.
    const claimedTaskIds = new Set(myClaims.map(c => c.taskId));
    const recommendations = allTasks
      .filter(t => !claimedTaskIds.has(t.id))
      .sort((a, b) => (a.estimatedMinutes ?? 999) - (b.estimatedMinutes ?? 999))
      .slice(0, 3);

    return {
      signedIn: true,
      userRole,
      user,
      userData: {
        myClaims,
        approvedClaimsCount: approvedClaims.length,
        totalHours: Math.round(totalHours * 10) / 10,
        recommendations
      }
    };
  }

  return {
    signedIn: false,
    userRole,
    user: null,
    userData: null
  };
};
