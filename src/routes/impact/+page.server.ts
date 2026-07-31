import type { PageServerLoad } from './$types';
import { getTasks, getClaims, getBadges } from '$lib/server/appwrite';
import { getTagStyle } from '$lib/utils/tagColors';

export const load: PageServerLoad = async () => {
  const [tasks, claims, badges] = await Promise.all([
    getTasks({ includeInactive: true }),
    getClaims(),
    getBadges()
  ]);

  const approvedClaims = claims.filter((c) => c.status === 'approved');
  const tasksCompleted = approvedClaims.length;
  const activeVolunteers = new Set(approvedClaims.map((c) => c.userId).filter(Boolean)).size;
  const ngosOnboarded = new Set(tasks.map((t) => t.orgId).filter(Boolean)).size;
  const badgesAwarded = badges.length;

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  let totalMinutesContributed = 0;
  const durationCounts = { '15m': 0, '20m': 0, '30m': 0, 'other': 0 };
  const causeCounts = new Map<string, number>();

  for (const claim of approvedClaims) {
    const task = taskMap.get(claim.taskId);
    const mins = task?.estimatedMinutes ?? 15;
    totalMinutesContributed += mins;

    if (mins <= 15) durationCounts['15m']++;
    else if (mins <= 20) durationCounts['20m']++;
    else if (mins <= 30) durationCounts['30m']++;
    else durationCounts['other']++;

    if (task?.tags && task.tags.length > 0) {
      for (const tag of task.tags) {
        const normalized = tag.replace(/^#/, '').toLowerCase();
        causeCounts.set(normalized, (causeCounts.get(normalized) ?? 0) + 1);
      }
    }
  }

  const causeBreakdown = Array.from(causeCounts.entries())
    .map(([name, count]) => {
      const style = getTagStyle(name);
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: Math.round((count / Math.max(approvedClaims.length, 1)) * 100),
        bg: style.bg,
        color: style.color
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const hoursContributed = (totalMinutesContributed / 60).toFixed(1);
  const avgTaskMinutes = Math.round(totalMinutesContributed / Math.max(tasksCompleted, 1));

  return {
    stats: {
      tasksCompleted,
      activeVolunteers,
      ngosOnboarded,
      badgesAwarded,
      totalMinutesContributed,
      hoursContributed,
      avgTaskMinutes,
      durationCounts,
      causeBreakdown
    }
  };
};

