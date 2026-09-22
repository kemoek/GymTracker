import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MUSCLE_GROUPS = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'ABS', 'CARDIO', 'OTHER'] as const;

/**
 * Generate a date string (YYYY-MM-DD) for N days ago.
 */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pick random elements from an array.
 */
function pickRandom<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Common workout patterns
const WORKOUT_PATTERNS = [
  { groups: ['CHEST', 'TRICEPS'] as const, note: 'Push day' },
  { groups: ['BACK', 'BICEPS'] as const, note: 'Pull day' },
  { groups: ['LEGS', 'ABS'] as const, note: 'Leg day' },
  { groups: ['SHOULDERS', 'TRICEPS'] as const, note: 'Shoulder focus' },
  { groups: ['CHEST', 'SHOULDERS', 'TRICEPS'] as const, note: 'Upper push' },
  { groups: ['BACK', 'BICEPS', 'ABS'] as const, note: 'Upper pull' },
  { groups: ['LEGS'] as const, note: 'Leg day - heavy squats' },
  { groups: ['CARDIO'] as const, note: 'Morning cardio session' },
  { groups: ['CHEST', 'BACK'] as const, note: 'Upper body' },
  { groups: ['ABS', 'CARDIO'] as const, note: 'Core and cardio' },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  await prisma.workoutMuscleGroup.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12);

  const kemal = await prisma.user.create({
    data: {
      username: 'kemal',
      email: 'kemal@example.com',
      passwordHash,
      weeklyGoal: 4,
    },
  });

  const ozi = await prisma.user.create({
    data: {
      username: 'ozi',
      email: 'ozi@example.com',
      passwordHash,
      weeklyGoal: 3,
    },
  });

  const rido = await prisma.user.create({
    data: {
      username: 'rido',
      email: 'rido@example.com',
      passwordHash,
      weeklyGoal: 5,
    },
  });


  // Create friendships
  await prisma.friendship.create({
    data: {
      requesterId: kemal.id,
      addresseeId: ozi.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      requesterId: kemal.id,
      addresseeId: rido.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.create({
    data: {
      requesterId: ozi.id,
      addresseeId: rido.id,
      status: 'ACCEPTED',
    },
  });

  console.log('✅ Created friendships between all users\n');

  // Generate workouts for each user
  const users = [
    { user: kemal, frequency: 0.65, name: 'kemal' },  // ~4-5 days/week
    { user: ozi, frequency: 0.5, name: 'ozi' },       // ~3-4 days/week
    { user: rido, frequency: 0.4, name: 'rido' },      // ~2-3 days/week
  ];

  for (const { user, frequency, name } of users) {
    let workoutCount = 0;

    // Generate workouts for the last 90 days
    for (let i = 0; i < 90; i++) {
      // Skip some days based on frequency
      if (Math.random() > frequency) continue;

      // Skip Sundays more often
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 && Math.random() > 0.2) continue;

      const date = daysAgo(i);
      const pattern = WORKOUT_PATTERNS[Math.floor(Math.random() * WORKOUT_PATTERNS.length)];

      await prisma.workout.create({
        data: {
          userId: user.id,
          date,
          note: Math.random() > 0.3 ? pattern.note : null,
          muscleGroups: {
            create: pattern.groups.map((mg) => ({ muscleGroup: mg })),
          },
        },
      });

      workoutCount++;
    }

    console.log(`✅ Created ${workoutCount} workouts for ${name}`);
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\nYou can log in with any of these accounts:');
  console.log('  kemal@example.com / password123');
  console.log('  ozi@example.com / password123');
  console.log('  rido@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
