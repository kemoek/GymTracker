import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, workoutSchema, changePasswordSchema, weeklyGoalSchema } from '@/lib/validations';

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short username', () => {
    const result = registerSchema.safeParse({
      username: 'ab',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      email: 'test@example.com',
      password: '12345',
      confirmPassword: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects username with special characters', () => {
    const result = registerSchema.safeParse({
      username: 'test@user',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('accepts username with underscores', () => {
    const result = registerSchema.safeParse({
      username: 'test_user',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('workoutSchema', () => {
  it('accepts valid workout data', () => {
    const result = workoutSchema.safeParse({
      date: '2026-09-20',
      muscleGroups: ['CHEST', 'TRICEPS'],
      note: 'Push day',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty muscle groups', () => {
    const result = workoutSchema.safeParse({
      date: '2026-09-20',
      muscleGroups: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = workoutSchema.safeParse({
      date: '09/20/2026',
      muscleGroups: ['CHEST'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid muscle group', () => {
    const result = workoutSchema.safeParse({
      date: '2026-09-20',
      muscleGroups: ['INVALID_GROUP'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts workout without note', () => {
    const result = workoutSchema.safeParse({
      date: '2026-09-20',
      muscleGroups: ['LEGS'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid muscle groups', () => {
    const result = workoutSchema.safeParse({
      date: '2026-09-20',
      muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'ABS', 'CARDIO', 'OTHER'],
    });
    expect(result.success).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid password change', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmNewPassword: 'newpassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched new passwords', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmNewPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword',
      newPassword: '12345',
      confirmNewPassword: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('weeklyGoalSchema', () => {
  it('accepts valid goal values', () => {
    for (let i = 1; i <= 7; i++) {
      const result = weeklyGoalSchema.safeParse({ weeklyGoal: i });
      expect(result.success).toBe(true);
    }
  });

  it('rejects zero', () => {
    const result = weeklyGoalSchema.safeParse({ weeklyGoal: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects values above 7', () => {
    const result = weeklyGoalSchema.safeParse({ weeklyGoal: 8 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integers', () => {
    const result = weeklyGoalSchema.safeParse({ weeklyGoal: 3.5 });
    expect(result.success).toBe(false);
  });
});
