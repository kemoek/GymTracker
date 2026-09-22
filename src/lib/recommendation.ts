import { MuscleGroup } from './validations';
import { getDateString, parseDateString } from './utils';

export type CoreMuscleGroup = 'CHEST' | 'BACK' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS' | 'LEGS';

export const CORE_MUSCLE_GROUPS: CoreMuscleGroup[] = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'LEGS',
];

export const PREFERRED_PAIRS: [CoreMuscleGroup, CoreMuscleGroup][] = [
  ['CHEST', 'TRICEPS'],
  ['BACK', 'BICEPS'],
  ['LEGS', 'SHOULDERS'],
];

export interface WorkoutHistoryItem {
  date: string;
  muscleGroups: (MuscleGroup | string)[];
}

export interface RecommendationResult {
  isRest: boolean;
  muscleGroups: MuscleGroup[];
  title: string;
  titleTr: string;
  titleEn: string;
  reasonTr: string;
  reasonEn: string;
  detailedAnalysis: {
    targetDate: string;
    yesterdayDate: string;
    yesterdayMuscles: MuscleGroup[];
    workoutsInLast7Days: number;
    consecutiveWorkoutDays: number;
    daysSinceMap: Record<CoreMuscleGroup, number>; // number of days since last workout, 999 if never/over 7 days
    unworkedLast7Days: MuscleGroup[];
    forbiddenMuscles: MuscleGroup[];
  };
}

/**
 * Calculates the difference in calendar days between two YYYY-MM-DD date strings.
 * Returns positive integer if dateA is after dateB.
 */
function diffDays(dateAStr: string, dateBStr: string): number {
  const dateA = parseDateString(dateAStr);
  const dateB = parseDateString(dateBStr);
  const diffTime = dateA.getTime() - dateB.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Analyzes the user's workout history for the past 7 days and recommends
 * the optimal workout muscle group(s) or REST for today.
 */
export function getWorkoutRecommendation(
  workouts: WorkoutHistoryItem[],
  targetDateStr: string = getDateString(new Date())
): RecommendationResult {
  const targetDate = parseDateString(targetDateStr);

  // Yesterday date string
  const yesterday = new Date(targetDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateString(yesterday);

  // 7 days ago date string
  const sevenDaysAgo = new Date(targetDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = getDateString(sevenDaysAgo);

  // Filter workouts strictly before targetDate (history up to yesterday)
  const pastWorkouts = workouts.filter((w) => w.date < targetDateStr);

  // Workouts in the last 7 days window [targetDate - 7 ... targetDate - 1]
  const last7DaysWorkouts = pastWorkouts.filter(
    (w) => w.date >= sevenDaysAgoStr && w.date <= yesterdayStr
  );

  // Rule 2: Recovery Rule - muscles trained yesterday cannot be trained today
  const yesterdayWorkouts = pastWorkouts.filter((w) => w.date === yesterdayStr);
  const yesterdayMusclesSet = new Set<CoreMuscleGroup>();
  yesterdayWorkouts.forEach((w) => {
    w.muscleGroups.forEach((m) => {
      if ((CORE_MUSCLE_GROUPS as string[]).includes(m)) {
        yesterdayMusclesSet.add(m as CoreMuscleGroup);
      }
    });
  });
  const yesterdayMuscles = Array.from(yesterdayMusclesSet);
  const forbiddenMuscles = yesterdayMuscles;

  // Calculate consecutive workout days leading up to targetDate
  let consecutiveWorkoutDays = 0;
  let checkDate = new Date(yesterday);
  while (true) {
    const curStr = getDateString(checkDate);
    const hasWorkout = pastWorkouts.some((w) => w.date === curStr);
    if (hasWorkout) {
      consecutiveWorkoutDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate days since each core muscle group was last trained
  const daysSinceMap: Record<CoreMuscleGroup, number> = {
    CHEST: 999,
    BACK: 999,
    SHOULDERS: 999,
    BICEPS: 999,
    TRICEPS: 999,
    LEGS: 999,
  };

  for (const muscle of CORE_MUSCLE_GROUPS) {
    const matchingWorkouts = pastWorkouts
      .filter((w) => w.muscleGroups.includes(muscle))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (matchingWorkouts.length > 0) {
      const days = diffDays(targetDateStr, matchingWorkouts[0].date);
      daysSinceMap[muscle] = days > 0 ? days : 999;
    } else {
      daysSinceMap[muscle] = 999;
    }
  }

  // Muscles not worked in the last 7 days (or never)
  const unworkedLast7Days = CORE_MUSCLE_GROUPS.filter((m) => daysSinceMap[m] >= 7);

  // Base analysis object
  const detailedAnalysis = {
    targetDate: targetDateStr,
    yesterdayDate: yesterdayStr,
    yesterdayMuscles,
    workoutsInLast7Days: last7DaysWorkouts.length,
    consecutiveWorkoutDays,
    daysSinceMap,
    unworkedLast7Days,
    forbiddenMuscles,
  };

  // Rule 4: REST Check
  // 4a. Extreme consecutive fatigue (e.g. 4+ consecutive days of workouts without rest)
  if (consecutiveWorkoutDays >= 4) {
    return {
      isRest: true,
      muscleGroups: [],
      title: 'Dinlenme Günü (REST)',
      titleTr: 'Dinlenme Günü (REST)',
      titleEn: 'Rest Day (REST)',
      reasonTr: `Son ${consecutiveWorkoutDays} gündür aralıksız antrenman yaptınız. Kas gelişimi ve sakatlıkları önlemek için bugün tam toparlanma (REST) önerilir.`,
      reasonEn: `You have trained for ${consecutiveWorkoutDays} consecutive days without a break. A full rest day is recommended for recovery and injury prevention.`,
      detailedAnalysis,
    };
  }

  // 4b. All 6 core muscle groups have been trained very recently (e.g., within the last 3 days) and workout count >= 4
  const allTrainedRecently = CORE_MUSCLE_GROUPS.every((m) => daysSinceMap[m] <= 3);
  if (allTrainedRecently && last7DaysWorkouts.length >= 4) {
    return {
      isRest: true,
      muscleGroups: [],
      title: 'Dinlenme Günü (REST)',
      titleTr: 'Dinlenme Günü (REST)',
      titleEn: 'Rest Day (REST)',
      reasonTr: 'Hedef 6 kas grubunun tamamı son 3 gün içinde dengeli şekilde çalıştırıldı. Vücudunuzun toparlanması için bugün dinlenme günü önerilir.',
      reasonEn: 'All 6 core muscle groups have been trained within the last 3 days. A rest day is recommended for full muscle recovery.',
      detailedAnalysis,
    };
  }

  // Eligible muscles (excluding forbidden ones)
  const eligibleMuscles = CORE_MUSCLE_GROUPS.filter((m) => !forbiddenMuscles.includes(m));

  if (eligibleMuscles.length === 0) {
    return {
      isRest: true,
      muscleGroups: [],
      title: 'Dinlenme Günü (REST)',
      titleTr: 'Dinlenme Günü (REST)',
      titleEn: 'Rest Day (REST)',
      reasonTr: 'Tüm uygun kas grupları dün çalıştırıldı. İyileşme kuralı gereği bugün dinlenmelisiniz.',
      reasonEn: 'All available muscle groups were trained yesterday. A rest day is required for recovery.',
      detailedAnalysis,
    };
  }

  // Rule 3: Preferred Splits Evaluation
  // Preferred pairs: [CHEST, TRICEPS], [BACK, BICEPS], [LEGS, SHOULDERS]
  type PairScore = {
    pair: [CoreMuscleGroup, CoreMuscleGroup];
    bothEligible: boolean;
    unworkedCount: number; // how many in this pair haven't been worked in 7 days
    totalDaysSince: number;
    minDaysSince: number;
  };

  const pairScores: PairScore[] = PREFERRED_PAIRS.map((pair) => {
    const [m1, m2] = pair;
    const m1Eligible = !forbiddenMuscles.includes(m1);
    const m2Eligible = !forbiddenMuscles.includes(m2);
    const bothEligible = m1Eligible && m2Eligible;

    let unworkedCount = 0;
    if (daysSinceMap[m1] >= 7) unworkedCount++;
    if (daysSinceMap[m2] >= 7) unworkedCount++;

    return {
      pair,
      bothEligible,
      unworkedCount,
      totalDaysSince: daysSinceMap[m1] + daysSinceMap[m2],
      minDaysSince: Math.min(daysSinceMap[m1], daysSinceMap[m2]),
    };
  });

  // Sort pair candidates:
  // 1. bothEligible first
  // 2. unworkedCount desc (2 unworked > 1 unworked > 0 unworked)
  // 3. totalDaysSince desc
  const eligiblePairs = pairScores.filter((p) => p.bothEligible);
  eligiblePairs.sort((a, b) => {
    if (b.unworkedCount !== a.unworkedCount) {
      return b.unworkedCount - a.unworkedCount;
    }
    return b.totalDaysSince - a.totalDaysSince;
  });

  // If we have an eligible pair where at least one muscle is overdue or both have been rested >= 2 days
  if (eligiblePairs.length > 0) {
    const bestPair = eligiblePairs[0];

    // If both muscles in the best pair have rested at least 2 days, or one is severely overdue (>= 7 days)
    if (bestPair.unworkedCount > 0 || bestPair.minDaysSince >= 2) {
      const [m1, m2] = bestPair.pair;
      const pairNameTr =
        m1 === 'CHEST' ? 'Göğüs + Triceps' :
        m1 === 'BACK' ? 'Sırt + Biceps' : 'Bacak + Omuz';
      const pairNameEn =
        m1 === 'CHEST' ? 'Chest + Triceps' :
        m1 === 'BACK' ? 'Back + Biceps' : 'Legs + Shoulders';

      let reasonTr = '';
      let reasonEn = '';

      if (bestPair.unworkedCount === 2) {
        reasonTr = `Haftalık döngü kuralı: ${m1 === 'CHEST' ? 'Göğüs ve Triceps' : m1 === 'BACK' ? 'Sırt ve Biceps' : 'Bacak ve Omuz'} son 7 günde hiç çalışılmadı (1 numaralı öncelik). Klasik split eşleşmesi korundu.`;
        reasonEn = `Weekly cycle rule: Both ${m1} and ${m2} have not been trained in the last 7 days (Top priority). Default split pair preserved.`;
      } else if (bestPair.unworkedCount === 1) {
        const overdue = daysSinceMap[m1] >= 7 ? m1 : m2;
        const overdueTr = overdue === 'CHEST' ? 'Göğüs' : overdue === 'TRICEPS' ? 'Triceps' : overdue === 'BACK' ? 'Sırt' : overdue === 'BICEPS' ? 'Biceps' : overdue === 'LEGS' ? 'Bacak' : 'Omuz';
        reasonTr = `${overdueTr} bölgesi son 7 günde eksik kaldı. Tercih edilen split şablonunu korumak amacıyla ${pairNameTr} birlikte önerildi.`;
        reasonEn = `${overdue} has been missed in the last 7 days. Recommended with ${pairNameEn} to maintain the preferred split pattern.`;
      } else {
        reasonTr = `Son 7 günlük döngüde en uzun süredir toparlanan ve hazır olan grup: ${pairNameTr} (İyileşme kurallarına uygun).`;
        reasonEn = `The longest recovered and ready muscle group in your cycle: ${pairNameEn}.`;
      }

      return {
        isRest: false,
        muscleGroups: [m1, m2],
        title: pairNameTr,
        titleTr: pairNameTr,
        titleEn: pairNameEn,
        reasonTr,
        reasonEn,
        detailedAnalysis,
      };
    }
  }

  // Fallback: If no full pair matches cleanly (e.g. one muscle of the pair is forbidden by yesterday's workout),
  // pick the most overdue eligible muscle(s).
  eligibleMuscles.sort((a, b) => daysSinceMap[b] - daysSinceMap[a]);
  const primaryMuscle = eligibleMuscles[0];

  // Check if primaryMuscle can pair with its default partner
  const matchingPair = PREFERRED_PAIRS.find((p) => p.includes(primaryMuscle));
  if (matchingPair) {
    const partner = matchingPair.find((m) => m !== primaryMuscle)!;
    if (!forbiddenMuscles.includes(partner) && daysSinceMap[partner] >= 2) {
      const pair = [primaryMuscle, partner] as MuscleGroup[];
      return {
        isRest: false,
        muscleGroups: pair,
        title: `${getMuscleNameTr(primaryMuscle)} + ${getMuscleNameTr(partner)}`,
        titleTr: `${getMuscleNameTr(primaryMuscle)} + ${getMuscleNameTr(partner)}`,
        titleEn: `${primaryMuscle} + ${partner}`,
        reasonTr: `${getMuscleNameTr(primaryMuscle)} en uzun süredir çalışılmayan bölge (${daysSinceMap[primaryMuscle] >= 999 ? '7+ gün' : daysSinceMap[primaryMuscle] + ' gün'}). Split uyumu için partneri ${getMuscleNameTr(partner)} ile önerildi.`,
        reasonEn: `${primaryMuscle} has been resting the longest (${daysSinceMap[primaryMuscle] >= 999 ? '7+ days' : daysSinceMap[primaryMuscle] + ' days'}). Paired with ${partner}.`,
        detailedAnalysis,
      };
    }
  }

  // Single muscle or hybrid fallback
  const primaryNameTr = getMuscleNameTr(primaryMuscle);
  return {
    isRest: false,
    muscleGroups: [primaryMuscle],
    title: primaryNameTr,
    titleTr: primaryNameTr,
    titleEn: primaryMuscle,
    reasonTr: `${primaryNameTr} bölgesi en uzun süredir çalışılmadı (${daysSinceMap[primaryMuscle] >= 999 ? '7+ gün' : daysSinceMap[primaryMuscle] + ' gün önce'}). İyileşme kuralı gereği tek bölge olarak hedeflendi.`,
    reasonEn: `${primaryMuscle} has not been trained for the longest time. Targeted as priority.`,
    detailedAnalysis,
  };
}

function getMuscleNameTr(muscle: MuscleGroup): string {
  switch (muscle) {
    case 'CHEST':
      return 'Göğüs';
    case 'BACK':
      return 'Sırt';
    case 'SHOULDERS':
      return 'Omuz';
    case 'BICEPS':
      return 'Biceps';
    case 'TRICEPS':
      return 'Triceps';
    case 'LEGS':
      return 'Bacak';
    case 'ABS':
      return 'Karın';
    case 'CARDIO':
      return 'Kardiyo';
    default:
      return 'Diğer';
  }
}
