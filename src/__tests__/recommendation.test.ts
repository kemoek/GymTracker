import { describe, it, expect } from 'vitest';
import { getWorkoutRecommendation, type WorkoutHistoryItem } from '../lib/recommendation';

describe('Workout Recommendation Engine', () => {
  const targetDate = '2026-09-22';

  it('Rule 1 & 3: Recommends BACK + BICEPS when unworked in 7 days and not trained yesterday', () => {
    // Kemal's real scenario
    const workouts: WorkoutHistoryItem[] = [
      { date: '2026-09-21', muscleGroups: ['LEGS'] }, // Yesterday
      { date: '2026-09-19', muscleGroups: ['CHEST', 'TRICEPS'] }, // 3 days ago
      { date: '2026-09-18', muscleGroups: ['ABS', 'CARDIO'] }, // 4 days ago
      { date: '2026-09-16', muscleGroups: ['LEGS'] }, // 6 days ago
    ];

    const result = getWorkoutRecommendation(workouts, targetDate);

    expect(result.isRest).toBe(false);
    expect(result.muscleGroups).toEqual(['BACK', 'BICEPS']);
    expect(result.detailedAnalysis.forbiddenMuscles).toContain('LEGS');
    expect(result.detailedAnalysis.unworkedLast7Days).toContain('BACK');
    expect(result.detailedAnalysis.unworkedLast7Days).toContain('BICEPS');
  });

  it('Rule 2: Never recommends yesterday\'s muscle group (Recovery Rule)', () => {
    // Yesterday was CHEST + TRICEPS
    const workouts: WorkoutHistoryItem[] = [
      { date: '2026-09-21', muscleGroups: ['CHEST', 'TRICEPS'] },
      { date: '2026-09-17', muscleGroups: ['BACK', 'BICEPS'] },
      { date: '2026-09-16', muscleGroups: ['LEGS', 'SHOULDERS'] },
    ];

    const result = getWorkoutRecommendation(workouts, targetDate);

    expect(result.muscleGroups).not.toContain('CHEST');
    expect(result.muscleGroups).not.toContain('TRICEPS');
    expect(result.detailedAnalysis.forbiddenMuscles).toContain('CHEST');
    expect(result.detailedAnalysis.forbiddenMuscles).toContain('TRICEPS');
  });

  it('Rule 4a: Recommends REST when user worked out 4 consecutive days without break', () => {
    const workouts: WorkoutHistoryItem[] = [
      { date: '2026-09-21', muscleGroups: ['LEGS'] },
      { date: '2026-09-20', muscleGroups: ['SHOULDERS'] },
      { date: '2026-09-19', muscleGroups: ['BACK', 'BICEPS'] },
      { date: '2026-09-18', muscleGroups: ['CHEST', 'TRICEPS'] },
    ];

    const result = getWorkoutRecommendation(workouts, targetDate);

    expect(result.isRest).toBe(true);
    expect(result.title).toContain('REST');
    expect(result.detailedAnalysis.consecutiveWorkoutDays).toBeGreaterThanOrEqual(4);
  });

  it('Rule 4b: Recommends REST when all 6 core muscles were trained in the last 3 days', () => {
    const workouts: WorkoutHistoryItem[] = [
      { date: '2026-09-21', muscleGroups: ['LEGS', 'SHOULDERS'] },
      { date: '2026-09-20', muscleGroups: ['BACK', 'BICEPS'] },
      { date: '2026-09-19', muscleGroups: ['CHEST', 'TRICEPS'] },
      { date: '2026-09-17', muscleGroups: ['ABS'] },
    ];

    const result = getWorkoutRecommendation(workouts, targetDate);

    expect(result.isRest).toBe(true);
    expect(result.title).toContain('REST');
  });

  it('Rule 3: Recommends CHEST + TRICEPS when Back, Biceps, Legs, Shoulders were trained recently', () => {
    const workouts: WorkoutHistoryItem[] = [
      { date: '2026-09-21', muscleGroups: ['LEGS', 'SHOULDERS'] },
      { date: '2026-09-20', muscleGroups: ['BACK', 'BICEPS'] },
      { date: '2026-09-15', muscleGroups: ['CHEST', 'TRICEPS'] }, // 7 days ago
    ];

    const result = getWorkoutRecommendation(workouts, targetDate);

    expect(result.isRest).toBe(false);
    expect(result.muscleGroups).toEqual(['CHEST', 'TRICEPS']);
  });

  it('Rule 3: Recommends LEGS + SHOULDERS when Chest/Triceps and Back/Biceps were trained recently', () => {
    const workouts: WorkoutHistoryItem[] = [
      { date: '2026-09-21', muscleGroups: ['BACK', 'BICEPS'] },
      { date: '2026-09-19', muscleGroups: ['CHEST', 'TRICEPS'] },
      { date: '2026-09-14', muscleGroups: ['LEGS', 'SHOULDERS'] }, // 8 days ago
    ];

    const result = getWorkoutRecommendation(workouts, targetDate);

    expect(result.isRest).toBe(false);
    expect(result.muscleGroups).toEqual(['LEGS', 'SHOULDERS']);
  });
});
